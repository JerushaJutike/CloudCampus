const crypto = require("crypto");
const env = require("../config/env");
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    id: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 7 * 24 * 60 * 60,
  });
  const data = `${header}.${payload}`;
  return `${data}.${crypto.createHmac("sha256", env.jwtSecret).update(data).digest("base64url")}`;
}
function verifyToken(token) {
  if (typeof token !== "string") throw new Error("Invalid token");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const data = `${parts[0]}.${parts[1]}`;
  const expected = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(data)
    .digest();
  let actual;
  try {
    actual = Buffer.from(parts[2], "base64url");
  } catch {
    throw new Error("Invalid token");
  }
  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  )
    throw new Error("Invalid token signature");
  const header = JSON.parse(
    Buffer.from(parts[0], "base64url").toString("utf8"),
  );
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8"),
  );
  if (
    header.alg !== "HS256" ||
    !payload.exp ||
    payload.exp <= Math.floor(Date.now() / 1000) ||
    !payload.id
  )
    throw new Error("Expired or invalid token");
  return { id: payload.id, email: payload.email, role: payload.role };
}
module.exports = { signToken, verifyToken };
