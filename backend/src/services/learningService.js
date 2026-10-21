const db = require("../config/db");
const { award, issueCertificate } = require("./rewardService");
const { fail } = require("../utils/validation");
async function completeLesson(userId, lessonId) {
  return db.transaction(async (client) => {
    const lesson = await client.query(
      `SELECT l.id,m.course_id FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
      WHERE l.id=$1 AND NOT l.archived AND NOT m.archived AND NOT c.archived AND c.published`,
      [lessonId],
    );
    if (!lesson.rowCount) fail("Lesson not found", 404);
    const courseId = lesson.rows[0].course_id;
    const enrolled = await client.query(
      "SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2",
      [userId, courseId],
    );
    if (!enrolled.rowCount)
      fail("Enroll in this course before completing lessons", 403);
    const result = await client.query(
      `INSERT INTO lesson_progress(user_id,lesson_id,completed,completed_at) VALUES($1,$2,true,NOW())
      ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed=true,completed_at=COALESCE(lesson_progress.completed_at,NOW()) RETURNING *`,
      [userId, lessonId],
    );
    const rewarded = await award(
      client,
      userId,
      "lesson_completed",
      lessonId,
      10,
      { lesson_id: String(lessonId) },
    );
    await issueCertificate(client, userId, courseId);
    return { ...result.rows[0], xp_awarded: rewarded ? 10 : 0 };
  });
}
module.exports = { completeLesson };
