require("dotenv").config({ quiet: true });
const databaseUrl = process.env.DATABASE_URL || undefined;
const jwtSecret = process.env.JWT_SECRET;
if (process.env.DB_CREDENTIALS_JSON) {
  try {
    const credentials = JSON.parse(process.env.DB_CREDENTIALS_JSON);
    if (
      typeof credentials.username !== "string" ||
      typeof credentials.password !== "string"
    )
      throw new Error();
    process.env.DBUSER = credentials.username;
    process.env.DBPASSWORD = credentials.password;
  } catch {
    throw new Error("Database secret is malformed");
  }
}
if (
  process.env.NODE_ENV === "production" &&
  (!jwtSecret || jwtSecret.length < 32)
) {
  throw new Error(
    "JWT_SECRET must be set to at least 32 characters in production",
  );
}
module.exports = {
  port: Number(process.env.PORT || 5000),
  databaseUrl,
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret:
    jwtSecret || require("node:crypto").randomBytes(32).toString("hex"),
  corsOrigin:
    process.env.CORS_ORIGIN || `http://localhost:${process.env.PORT || 5000}`,
  nodeEnv: process.env.NODE_ENV || "development",
};
