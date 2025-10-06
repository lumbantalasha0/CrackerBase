import pkg from 'pg';
const { Client } = pkg;
const cs = process.env.DATABASE_URL;
if (!cs) { console.error('No DATABASE_URL in env'); process.exit(2); }
const c = new Client({ connectionString: cs });
(async () => {
  try {
    await c.connect();
    const r = await c.query('SELECT now(), current_user, current_database();');
    console.log('CONNECTED AS:', r.rows[0]);
    await c.query("CREATE TEMP TABLE IF NOT EXISTS _diag_node (id serial PRIMARY KEY, note text);");
    const ins = await c.query("INSERT INTO _diag_node (note) VALUES ($1) RETURNING id, note;", ['node-test']);
    console.log('INSERT OK:', ins.rows[0]);
  } catch (e) {
    console.error('ERROR:', e.message || e);
    process.exit(3);
  } finally {
    await c.end();
  }
})();
