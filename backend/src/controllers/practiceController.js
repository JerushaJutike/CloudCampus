const db = require("../config/db");
exports.list = async (req, res, next) => {
  try {
    const { difficulty, category, search } = req.query;
    const params = [];
    const where = ["NOT archived"];
    if (difficulty) {
      params.push(difficulty);
      where.push(`difficulty=$${params.length}`);
    }
    if (category) {
      params.push(category);
      where.push(`category=$${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(title ILIKE $${params.length} OR statement ILIKE $${params.length})`,
      );
    }
    const r = await db.query(
      `SELECT id,title,slug,category,difficulty,statement,examples,constraints,starter_code FROM coding_problems ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id`,
      params,
    );
    res.json({ success: true, data: r.rows });
  } catch (e) {
    next(e);
  }
};
exports.submit = async (req, res, next) => {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await require("../services/practiceService").submit(
          req.user.id,
          req.body,
        ),
      });
  } catch (error) {
    next(error);
  }
};
exports.history = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT s.id,s.problem_id,p.title problem_title,s.language,s.status,s.created_at FROM submissions s JOIN coding_problems p ON p.id=s.problem_id WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 100`,
      [req.user.id],
    );
    res.json({ success: true, data: r.rows });
  } catch (e) {
    next(e);
  }
};
