const r = require("express").Router();
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
r.get("/", authenticate, async (req, res, next) => {
  try {
    const q = await db.query(
      `SELECT to_char(created_at,'YYYY-MM-DD') AS "day",COUNT(*)::int activity FROM xp_transactions WHERE user_id=$1 AND created_at>=CURRENT_DATE-INTERVAL '30 days' GROUP BY to_char(created_at,'YYYY-MM-DD') ORDER BY "day"`,
      [req.user.id],
    );
    res.json({ success: true, data: q.rows });
  } catch (e) {
    next(e);
  }
});
module.exports = r;
