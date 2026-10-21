const crypto = require("node:crypto");
const { promisify } = require("node:util");
const bcrypt = require("bcryptjs");
const scrypt = promisify(crypto.scrypt);
const db = require("../config/db");
const { signToken } = require("../utils/jwt");
const { fail } = require("../utils/validation");
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password, stored) {
  if (/^\$2[aby]\$/.test(String(stored)))
    return bcrypt.compare(password, stored);
  // Existing scrypt accounts upgrade to bcrypt after successful authentication.
  const [algorithm, salt, hash] = String(stored || "").split("$");
  if (
    algorithm !== "scrypt" ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(hash || "")
  )
    return false;
  const derived = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), derived);
}
async function register({ name, email, password }) {
  const hash = await hashPassword(password);
  try {
    const user = await db.transaction(async (client) => {
      const normalized = email.trim().toLowerCase();
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [normalized],
      );
      if (
        (
          await client.query("SELECT 1 FROM users WHERE lower(email)=$1", [
            normalized,
          ])
        ).rowCount
      )
        fail("Email already registered", 409);
      const result = await client.query(
        "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,created_at",
        [name.trim(), email.trim().toLowerCase(), hash, "student"],
      );
      await client.query("INSERT INTO streaks(user_id) VALUES($1)", [
        result.rows[0].id,
      ]);
      return result.rows[0];
    });
    return { user, token: signToken(user) };
  } catch (error) {
    if (error.code === "23505") fail("Email already registered", 409);
    throw error;
  }
}
async function login({ email, password }) {
  const result = await db.query(
    "SELECT id,name,email,password_hash,role,disabled FROM users WHERE lower(email)=$1",
    [email.trim().toLowerCase()],
  );
  if (
    !result.rowCount ||
    result.rows[0].disabled ||
    !(await verifyPassword(password, result.rows[0].password_hash))
  )
    fail("Invalid email or password", 401);
  const { password_hash, disabled, ...user } = result.rows[0];
  if (
    password_hash.startsWith("scrypt$") &&
    Buffer.byteLength(password, "utf8") <= 72
  )
    await db.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2 AND password_hash=$3",
      [await hashPassword(password), user.id, password_hash],
    );
  return { user, token: signToken(user) };
}
module.exports = { register, login, hashPassword, verifyPassword };
