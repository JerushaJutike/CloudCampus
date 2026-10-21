const db = require("../config/db");
exports.list = async (req, res, next) => {
  try {
    const r = await db.query(
      "SELECT id,category,difficulty,question,answer FROM interview_questions WHERE NOT archived AND ($1::text IS NULL OR category=$1) ORDER BY id",
      [req.query.category || null],
    );
    res.json({ success: true, data: r.rows });
  } catch (e) {
    next(e);
  }
};
