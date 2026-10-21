// Creates a separate database. Never runs test mutations against DBNAME or DATABASE_URL.
const fs = require("node:fs"),
  path = require("node:path");
require("dotenv").config({ quiet: true });
const { Pool } = require("pg");
const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DBHOST || "localhost",
      port: Number(process.env.DBPORT || 5432),
      user: process.env.DBUSER,
      password: process.env.DBPASSWORD,
      database: process.env.DBNAME,
    };
const original = new Pool(config),
  name = "cloudcampus_verify_" + Date.now();
let target;
(async () => {
  await original.query(`CREATE DATABASE ${name}`);
  const testConfig = { ...config };
  if (config.connectionString) {
    const url = new URL(config.connectionString);
    url.pathname = "/" + name;
    testConfig.connectionString = url.toString();
  } else testConfig.database = name;
  target = new Pool(testConfig);
  const schema = fs
    .readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8")
    .split("\n")
    .filter((line) => !line.startsWith("\\"))
    .join("\n");
  await target.query(schema);
  await target.query("SET search_path TO public");
  await target.query(fs.readFileSync(path.join(__dirname,'../test/fixtures/legacy-catalog.sql'),'utf8'));
  for (const file of fs
    .readdirSync(path.join(__dirname, "../db/migrations"))
    .sort())
    for (let i = 0; i < 2; i++)
      await target.query(
        fs.readFileSync(path.join(__dirname, "../db/migrations", file), "utf8"),
      );
  for (const file of ["seed.sql", "content.sql"])
    for (let i = 0; i < 2; i++)
      await target.query(
        fs.readFileSync(path.join(__dirname, "../db", file), "utf8"),
      );
  await target.end();
  target = null;
  await original.end();
  const env = {
    ...process.env,
    DBNAME: name,
    RUN_INTEGRATION: "true",
    NODE_ENV: "test",
  };
  if (testConfig.connectionString)
    env.DATABASE_URL = testConfig.connectionString;
  env.STORAGE_DIR = path.join(__dirname, "../data/verification", name);
  console.log("Verification database:", name);
  const result = require("node:child_process").spawnSync(
    process.execPath,
    ["--test"],
    { cwd: path.join(__dirname, ".."), env, stdio: "inherit" },
  );
  process.exitCode = result.status;
  console.log(
    "Test database retained for inspection; existing database was not modified.",
  );
})()
  .catch((error) => {
    console.error("Verification failed:", error.code || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (target) await target.end();
    if (!original.ended) await original.end();
  });
