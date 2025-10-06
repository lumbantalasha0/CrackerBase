import pkg from 'pg';
const { Client } = pkg;
const cs = process.env.NETLIFY_DATABASE_URL;
if (!cs) { console.error('No NETLIFY_DATABASE_URL in env'); process.exit(2); }
const client = new Client({ connectionString: cs });
(async () => {
  try {
    await client.connect();
    const sel = await client.query('SELECT now(), current_user, current_database();');
    console.log('CONNECTED AS:', sel.rows[0]);
    await client.query("CREATE TEMP TABLE IF NOT EXISTS _diag_node (id serial PRIMARY KEY, note text);");
    const ins = await client.query("INSERT INTO _diag_node (note) VALUES ($1) RETURNING id, note;", ['node-test']);
    console.log('INSERT OK:', ins.rows[0]);
  } catch (e) {
    console.error('ERROR:', e.message || e);
    process.exitCode = 3;
  } finally {
    await client.end();
  }
})();
