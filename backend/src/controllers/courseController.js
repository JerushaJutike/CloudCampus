const s = require("../services/courseService");
exports.list = async (req, res, next) => {
  try {
    res.json({ success: true, data: await s.listCourses() });
  } catch (e) {
    next(e);
  }
};
exports.get = async (req, res, next) => {
  try {
    const data = await s.getCourse(req.params.id, req.user?.id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
exports.enroll = async (req, res, next) => {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await s.enroll(req.user.id, req.params.id),
      });
  } catch (e) {
    next(e);
  }
};

exports.quizzes = async (req, res, next) => {
  try {
    const course = await require("../config/db").query(
      "SELECT id FROM courses WHERE id=$1 AND published=true AND NOT archived",
      [req.params.id],
    );
    if (!course.rowCount)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    const q = await require("../config/db").query(
      "SELECT id,title,description,difficulty,passing_percentage FROM quizzes WHERE course_id=$1 AND NOT archived ORDER BY id",
      [req.params.id],
    );
    res.json({ success: true, data: q.rows });
  } catch (e) {
    next(e);
  }
};
