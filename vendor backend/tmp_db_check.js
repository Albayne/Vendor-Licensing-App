const pool = require('./config/db');
(async () => {
  try {
    const r = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename IN ('vendor_login','payments','license_applications');");
    console.log('tables:', r.rows);
  } catch (e) {
    console.error('err', e);
  } finally {
    await pool.end();
  }
})();