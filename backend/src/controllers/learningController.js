const db = require("../config/db");
const service = require("../services/learningService");
exports.getLesson = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT l.id,l.title,l.content,l.video_url,l.resources,l.order_index AS lesson_order,l.duration_minutes AS estimated_minutes,m.id module_id,m.title module_title,c.id course_id,c.title course_title,e.id enrollment_id,COALESCE(lp.completed,false) completed,lp.completed_at FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id LEFT JOIN enrollments e ON e.course_id=c.id AND e.user_id=$2 LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2 WHERE l.id=$1 AND NOT l.archived AND NOT m.archived AND NOT c.archived AND c.published`,
      [req.params.id, req.user.id],
    );
    if (!r.rowCount)
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    if (!r.rows[0].enrollment_id)
      return res
        .status(403)
        .json({
          success: false,
          message: "Enroll in this course to access the lesson",
        });
    const { enrollment_id, ...lesson } = r.rows[0];
    res.json({ success: true, data: lesson });
  } catch (e) {
    next(e);
  }
};
exports.complete = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await service.completeLesson(req.user.id, req.params.id),
    });
  } catch (e) {
    next(e);
  }
};
