const { Pool } = require("pg");
const env = require("./env");
const pool = new Pool({
  ...(env.databaseUrl
    ? { connectionString: env.databaseUrl }
    : {
        user: process.env.DBUSER,
        host: process.env.DBHOST,
        database: process.env.DBNAME,
        password: process.env.DBPASSWORD,
        port: Number(process.env.DBPORT || 5432),
      }),
  ssl: env.databaseSsl ? { rejectUnauthorized: true } : undefined,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  options: "-c statement_timeout=15000",
});
pool.on("error", () => console.error("PostgreSQL connection unavailable"));
async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  transaction,
};
