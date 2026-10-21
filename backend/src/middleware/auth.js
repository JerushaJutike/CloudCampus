const { verifyToken } = require("../utils/jwt");
const db = require("../config/db");
async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer "))
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  let claims;
  try {
    claims = verifyToken(header.slice(7));
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
  try {
    const result = await db.query(
      "SELECT id,email,role FROM users WHERE id=$1 AND NOT disabled",
      [claims.id],
    );
    if (!result.rowCount)
      return res
        .status(401)
        .json({ success: false, message: "Account unavailable" });
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
async function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  let claims;
  try {
    claims = verifyToken(header.slice(7));
  } catch {
    return next();
  }
  try {
    const result = await db.query(
      "SELECT id,email,role FROM users WHERE id=$1 AND NOT disabled",
      [claims.id],
    );
    if (result.rowCount) req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : res.status(403).json({ success: false, message: "Forbidden" });
}
module.exports = { authenticate, optionalAuthenticate, requireRole };
