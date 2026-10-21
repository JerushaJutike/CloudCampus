const service = require("../services/authService");
const { validateRegistration } = require("../validators/auth");
exports.register = async (req, res, next) => {
  try {
    const e = validateRegistration(req.body);
    if (e) return res.status(400).json({ success: false, message: e });
    res
      .status(201)
      .json({ success: true, data: await service.register(req.body) });
  } catch (err) {
    next(err);
  }
};
exports.login = async (req, res, next) => {
  try {
    if (
      typeof req.body?.email !== "string" ||
      typeof req.body?.password !== "string" ||
      !req.body.email ||
      !req.body.password ||
      req.body.email.length > 254 ||
      req.body.password.length > 128
    )
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    res.json({ success: true, data: await service.login(req.body) });
  } catch (err) {
    next(err);
  }
};
exports.me = async (req, res, next) => {
  try {
    const db = require("../config/db");
    const q = await db.query(
      "SELECT id,name,email,role,created_at FROM users WHERE id=$1",
      [req.user.id],
    );
    if (!q.rowCount)
      return res
        .status(401)
        .json({ success: false, message: "User account no longer exists" });
    res.json({ success: true, data: q.rows[0] });
  } catch (e) {
    next(e);
  }
};
