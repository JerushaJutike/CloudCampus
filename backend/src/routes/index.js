const r = require("express").Router();
r.use("/files", require("./fileRoutes"));
r.use((req, res, next) => {
  try {
    for (const segment of req.path.split("/"))
      if (/^\d+$/.test(segment))
        require("../utils/validation").positiveId(segment);
    next();
  } catch (error) {
    next(error);
  }
});
r.use(require("./communityRoutes"));
r.use("/auth", require("./authRoutes"));
r.use("/courses", require("./courseRoutes"));
r.use("/lessons", require("./lessonRoutes"));
r.use("/quizzes", require("./quizRoutes"));
r.use("/practice", require("./practiceRoutes"));
r.use("/interview-questions", require("./interviewRoutes"));
r.use("/projects", require("./projectRoutes"));
r.use("/dashboard", require("./dashboardRoutes"));
r.use("/analytics", require("./analyticsRoutes"));
r.use("/admin", require("./adminRoutes"));
// Compatibility with the endpoint names in the project blueprint.
r.get(
  "/coding-problems",
  require("../middleware/auth").authenticate,
  require("../controllers/practiceController").list,
);
r.post(
  "/submissions",
  require("../middleware/auth").authenticate,
  require("../controllers/practiceController").submit,
);
r.get(
  "/submissions",
  require("../middleware/auth").authenticate,
  require("../controllers/practiceController").history,
);
r.get(
  "/questions",
  require("../middleware/auth").authenticate,
  async (req, res, next) => {
    try {
      const db = require("../config/db");
      const quizId = req.query.quizId
        ? require("../utils/validation").positiveId(req.query.quizId)
        : null;
      const q = await db.query(
        `SELECT x.id,x.quiz_id,x.question_text,x.question_type,x.options,x.points,x.question_order FROM questions x JOIN quizzes q ON q.id=x.quiz_id JOIN courses c ON c.id=q.course_id JOIN enrollments e ON e.course_id=c.id AND e.user_id=$1 WHERE NOT x.archived AND NOT q.archived AND NOT c.archived AND c.published AND ($2::integer IS NULL OR q.id=$2) ORDER BY x.quiz_id,x.question_order,x.id LIMIT 500`,
        [req.user.id, quizId],
      );
      res.json({ success: true, data: q.rows });
    } catch (error) {
      next(error);
    }
  },
);
module.exports = r;
