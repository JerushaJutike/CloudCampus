const db = require("../config/db");
exports.stats = async (req, res, next) => {
  try {
    const [u, c, e, s] = await Promise.all([
      db.query("SELECT COUNT(*)::int count FROM users"),
      db.query("SELECT COUNT(*)::int count FROM courses"),
      db.query("SELECT COUNT(*)::int count FROM enrollments"),
      db.query("SELECT COUNT(*)::int count FROM submissions"),
    ]);
    res.json({
      success: true,
      data: {
        users: u.rows[0].count,
        courses: c.rows[0].count,
        enrollments: e.rows[0].count,
        submissions: s.rows[0].count,
      },
    });
  } catch (e) {
    next(e);
  }
};
