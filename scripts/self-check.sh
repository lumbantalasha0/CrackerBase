#!/usr/bin/env bash
set -euo pipefail

# Self-check script for diagnosing JS/TS projects
# Usage: ./scripts/self-check.sh <repo-url> [--no-install] [--no-build]

REPO_URL=${1:-}
NO_INSTALL=false
NO_BUILD=false
if [[ "$REPO_URL" == "--no-install" ]]; then NO_INSTALL=true; REPO_URL=${2:-}; fi
if [[ "$REPO_URL" == "--no-build" ]]; then NO_BUILD=true; REPO_URL=${2:-}; fi
if [[ -z "$REPO_URL" ]]; then
  echo "Usage: $0 <repo-url> [--no-install] [--no-build]"
  exit 1
fi

TMPDIR=$(mktemp -d /tmp/selfcheck-XXXX)
REPO_DIR="$TMPDIR/repo"
LOG_DIR="$TMPDIR/logs"
mkdir -p "$LOG_DIR"

echo "Cloning $REPO_URL into $REPO_DIR"
git clone --depth 1 "$REPO_URL" "$REPO_DIR" > "$LOG_DIR/clone.log" 2>&1 || { echo "git clone failed, see $LOG_DIR/clone.log"; cat "$LOG_DIR/clone.log"; exit 2; }

cd "$REPO_DIR"

# detect package manager
PKG_MANAGER="npm"
if [[ -f pnpm-lock.yaml ]]; then PKG_MANAGER="pnpm"; fi
if [[ -f yarn.lock && "$PKG_MANAGER" == "npm" ]]; then PKG_MANAGER="yarn"; fi

echo "Detected package manager: $PKG_MANAGER" | tee "$LOG_DIR/detect_pm.log"

run_cmd() {
  local name="$1"; shift
  echo "---- RUN: $name ----" | tee -a "$LOG_DIR/commands.log"
  ( set -x; "$@" ) > "$LOG_DIR/$name.out" 2> "$LOG_DIR/$name.err" || true
}

if [ "$NO_INSTALL" = false ]; then
  case "$PKG_MANAGER" in
    pnpm) run_cmd install pnpm install ;; 
    yarn) run_cmd install yarn install ;; 
    *) run_cmd install npm install ;;
  esac
else
  echo "Skipping install (NO_INSTALL=true)" | tee -a "$LOG_DIR/commands.log"
fi

# run lint if available
if npm run | sed -n '1,200p' | grep -q "lint"; then
  run_cmd lint npm run lint
fi

# run type check if there's a script or tsc available
if npm run | sed -n '1,200p' | grep -q "type-check\|tsc"; then
  if npm run | grep -q "type-check"; then
    run_cmd type-check npm run type-check || true
  else
    if command -v npx > /dev/null; then
      run_cmd tsc npx tsc --noEmit || true
    fi
  fi
fi

if [ "$NO_BUILD" = false ]; then
  if npm run | sed -n '1,200p' | grep -q "build"; then
    run_cmd build npm run build
  else
    echo "No build script found" | tee -a "$LOG_DIR/commands.log"
  fi
else
  echo "Skipping build (NO_BUILD=true)" | tee -a "$LOG_DIR/commands.log"
fi

echo "Packaging logs to $TMPDIR/selfcheck-logs.tar.gz"
tar -czf "$TMPDIR/selfcheck-logs.tar.gz" -C "$LOG_DIR" .

echo "DONE. Logs: $TMPDIR/selfcheck-logs.tar.gz"
echo
echo "To inspect logs run: tar -xzf $TMPDIR/selfcheck-logs.tar.gz -C /some/path && ls -la /some/path"
