#!/usr/bin/env bash
# diagnose_neon.sh
# Usage:
#   ./diagnose_neon.sh [CONNECTION_STRING]
# If no arg given, will look for env vars: DATABASE_URL, SUPABASE_DB_URL, SUPABASE_URL, PG*.
set -euo pipefail

echo "=== DIAGNOSE NEON START: $(date -u) ==="
echo

# 1) Find connection string to use
CONN="${1:-}"
if [ -z "$CONN" ]; then
  # try common env vars
  for v in DATABASE_URL SUPABASE_DB_URL SUPABASE_URL PGHOST PGPASSWORD PGUSER PGDATABASE; do
    val="$(printenv $v || true)"
    if [ -n "$val" ] && [ -z "$CONN" ]; then
      if [[ "$v" == "DATABASE_URL" || "$v" == "SUPABASE_DB_URL" || "$v" == "SUPABASE_URL" ]]; then
        CONN="$val"
      fi
    fi
  done
fi

if [ -z "$CONN" ]; then
  echo "WARNING: No full DB connection string supplied or found in env (DATABASE_URL or SUPABASE_DB_URL)."
  echo "You can re-run with: ./diagnose_neon.sh \"postgresql://user:pass@host/dbname?sslmode=require\""
  echo
fi

echo "=== ENV SUMMARY ==="
echo "Shell user: $(whoami)"
echo "Node present: $(command -v node >/dev/null 2>&1 && node --version || echo \"no\")"
echo "psql present: $(command -v psql >/dev/null 2>&1 && psql --version || echo \"no\")"
echo
echo "Environment variables (showing presence, not values for secrets):"
for v in DATABASE_URL SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_DB_URL PGHOST PGUSER PGPASSWORD PGDATABASE PGPORT; do
  if printenv "$v" >/dev/null 2>&1; then
    echo "  $v = (set)"
  else
    echo "  $v = (not set)"
  fi
done
echo

# 2) Install psql if missing (only if sudo available and interactive)
if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Attempting to install postgresql-client (apt)..."
  if command -v apt >/dev/null 2>&1 && [ "$(id -u)" -ne 0 ]; then
    sudo apt update && sudo apt install -y postgresql-client
  elif command -v apt >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
    apt update && apt install -y postgresql-client
  else
    echo "Can't auto-install psql on this system. Please install psql and re-run."
    echo "On Ubuntu: sudo apt install postgresql-client"
    echo "On macOS w/ homebrew: brew install libpq && brew link --force libpq"
    echo
  fi
  echo "psql present after attempted install: $(command -v psql >/dev/null 2>&1 && psql --version || echo \"no\")"
  echo
fi

# 3) If we have a connection string, run a battery of psql checks
if [ -n "$CONN" ] && command -v psql >/dev/null 2>&1; then
  echo "=== PSQL CONNECTIVITY CHECK ==="
  echo "Running: SELECT now(), current_user, current_database();"
  psql "$CONN" -At -c "SELECT now(), current_user, current_database();" || { echo "FAILED to run basic SELECT (connection error)"; }
  echo

  echo "=== LIST TABLES (public.*) ==="
  psql "$CONN" -c "\dt public.*" || true
  echo

  echo "=== TEMP WRITE TEST (CREATE TEMP TABLE, INSERT, SELECT) ==="
  psql "$CONN" -c "CREATE TEMP TABLE _diag_test (id serial PRIMARY KEY, note text); INSERT INTO _diag_test (note) VALUES ('diag test - codespace') RETURNING *; SELECT * FROM _diag_test ORDER BY id DESC LIMIT 5;" || echo "Temp write test failed"
  echo

  echo "=== TRY WRITING TO EXISTING APP TABLES (non-destructive: check permissions via INSERT ... RETURNING with minimal columns) ==="
  TABLES=(customers inventory_movements sales expenses settings ingredients)
  for t in "${TABLES[@]}"; do
    echo "-> Checking table: $t"
    exists=$(psql "$CONN" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='${t}';")
    if [ "$exists" = "1" ]; then
      echo "  Table exists. Attempting minimal INSERT (may fail if table has required columns)..."
      col=$(psql "$CONN" -tAc "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' AND data_type IN ('text','character varying','varchar') LIMIT 1;")
      if [ -n "$col" ]; then
        echo "  Found text column: $col — attempting INSERT..."
        psql "$CONN" -c "INSERT INTO public.\"${t}\" (\"${col}\") VALUES ('diag-insert') RETURNING *;" || echo "  INSERT failed (permission, RLS, or required constraints)."
      else
        echo "  No simple text column to insert into — skipping safe INSERT for $t."
      fi
    else
      echo "  Table does not exist in public schema."
    fi
    echo
  done

  echo "=== RLS POLICIES FOR APP TABLES ==="
  psql "$CONN" -At -c "SELECT schemaname, tablename, policyname, permissive, roles, qual IS NOT NULL AS has_qual, with_check IS NOT NULL AS has_with_check FROM pg_policies WHERE schemaname='public' AND tablename IN ('customers','inventory_movements','sales','expenses','settings','ingredients') ORDER BY tablename;" || true
  echo

  echo "=== RLS ENABLE FLAGS (relrowsecurity) ==="
  psql "$CONN" -At -c "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN ('customers','inventory_movements','sales','expenses','settings','ingredients');" || true
  echo

  echo "=== GRANTS ON APP TABLES (who has privileges) ==="
  psql "$CONN" -c "SELECT grantee, privilege_type, table_name FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('customers','inventory_movements','sales','expenses','settings','ingredients') ORDER BY table_name, grantee;" || true
  echo

  echo "=== LIST ROLES (\\du) ==="
  psql "$CONN" -c "\\du" || true
  echo

else
  echo "Skipping psql checks because no connection string or psql missing."
  echo
fi

# 4) Repo-level checks (search for env var names and supabase references)
echo "=== REPO SEARCH (grep) ==="
echo "Searching for DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, supabase.co, supabase-js, and pg connection usage in the repo..."
grep -R --line-number --exclude-dir=node_modules -e "DATABASE_URL" -e "SUPABASE_URL" -e "SUPABASE_ANON_KEY" -e "supabase.co" -e "supabase-js" -e "new Supabase" -e "createClient(" . || true
echo
echo "Search package.json for supabase or pg deps:"
if [ -f package.json ]; then
  jq -r '.dependencies + .devDependencies | keys[]' package.json 2>/dev/null | grep -E 'supabase|@supabase|pg' || echo "No obvious deps found (or jq missing)"
else
  echo "No package.json in repo root."
fi
echo

# 5) Optional Node test (if node present and conn provided)
if [ -n "$CONN" ] && command -v node >/dev/null 2>&1; then
  echo "=== NODE CONNECTIVITY TEST ==="
  TMPJS=$(mktemp /tmp/diagnode.XXXX.js)
  cat > "$TMPJS" <<'NODEJS'
import pkg from 'pg';
const { Client } = pkg;
const cs = process.env.DATABASE_URL || process.argv[2];
if (!cs) {
  console.error("No connection string provided to Node test.");
  process.exit(2);
}
const c = new Client({ connectionString: cs });
(async () => {
  try {
    await c.connect();
    const r = await c.query('SELECT now(), current_user, current_database();');
    console.log('NODE SELECT:', r.rows[0]);
    await c.query("CREATE TEMP TABLE IF NOT EXISTS _diag_node_test (id serial PRIMARY KEY, note text);");
    const ins = await c.query("INSERT INTO _diag_node_test (note) VALUES ($1) RETURNING id, note, now()", ['node-diagnose']);
    console.log('NODE INSERT OK:', ins.rows[0]);
  } catch (e) {
    console.error('NODE ERROR:', e.message || e);
    process.exitCode = 3;
  } finally {
    await c.end();
  }
})();
NODEJS
  node "$TMPJS" "$CONN" || echo "Node test failed or produced errors above."
  rm -f "$TMPJS"
  echo
else
  echo "Skipping Node test (node or conn missing)."
  echo
fi

echo "=== DIAGNOSE NEON END: $(date -u) ==="
