// Run only from a trusted host with private network access to the NEW RDS database.
const fs = require("node:fs"),
  path = require("node:path");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { Pool } = require("pg");
const required = [
  "AWS_REGION",
  "RDS_HOST",
  "RDS_MASTER_SECRET_ARN",
  "APP_DB_SECRET_ARN",
];
for (const name of required)
  if (!process.env[name]) throw new Error(`${name} is required`);
const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION });
let pool;
(async () => {
  const get = async (id) =>
    JSON.parse(
      (await secrets.send(new GetSecretValueCommand({ SecretId: id })))
        .SecretString,
    );
  const master = await get(process.env.RDS_MASTER_SECRET_ARN),
    app = await get(process.env.APP_DB_SECRET_ARN);
  if (app.username !== "cloudcampus_app")
    throw new Error("Unexpected application role");
  pool = new Pool({
    host: process.env.RDS_HOST,
    port: 5432,
    database: "cloud_campus",
    user: master.username,
    password: master.password,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
  });
  const tables = await pool.query(
    "SELECT COUNT(*)::int count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
  );
  if (tables.rows[0].count)
    throw new Error(
      "Bootstrap requires a NEW empty database. Use a reviewed migration for an existing database.",
    );
  const schema = fs
    .readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8")
    .split("\n")
    .filter((line) => !line.startsWith("\\"))
    .join("\n");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schema);
    await client.query("SET search_path TO public");
    for (const name of fs
      .readdirSync(path.join(__dirname, "../db/migrations"))
      .sort())
      await client.query(
        fs
          .readFileSync(path.join(__dirname, "../db/migrations", name), "utf8")
          .replace(/^BEGIN;\s*/, "")
          .replace(/COMMIT;\s*$/, ""),
      );
    for (const name of ["seed.sql", "content.sql"])
      await client.query(
        fs
          .readFileSync(path.join(__dirname, "../db", name), "utf8")
          .replace(/^BEGIN;\s*/, "")
          .replace(/COMMIT;\s*$/, ""),
      );
    const exists = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname=$1",
      [app.username],
    );
    const statement = await client.query(
      `SELECT format('${exists.rowCount ? "ALTER" : "CREATE"} ROLE cloudcampus_app LOGIN PASSWORD %L',$1) sql`,
      [app.password],
    );
    await client.query(statement.rows[0].sql);
    await client.query(
      "GRANT CONNECT ON DATABASE cloud_campus TO cloudcampus_app",
    );
    await client.query("GRANT USAGE ON SCHEMA public TO cloudcampus_app");
    await client.query(
      "GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO cloudcampus_app",
    );
    await client.query(
      "GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO cloudcampus_app",
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  console.log(
    "New cloud database bootstrapped. App role has data access without schema ownership.",
  );
})()
  .catch((error) => {
    console.error("Cloud bootstrap failed:", error.code || error.message);
    process.exitCode = 1;
  })
  .finally(() => pool?.end());
