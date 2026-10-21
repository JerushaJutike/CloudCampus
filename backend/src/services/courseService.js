const db = require("../config/db");

async function listCourses() {
  const r = await db.query(`
    SELECT c.*,(SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id=c.id) enrollment_count,
      (SELECT COUNT(*)::int FROM modules m WHERE m.course_id=c.id AND NOT m.archived) module_count,
      (SELECT COUNT(*)::int FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id AND NOT m.archived AND NOT l.archived) lesson_count
    FROM courses c WHERE c.published=true AND NOT c.archived ORDER BY c.created_at DESC,c.id LIMIT 500`);
  return r.rows;
}
async function getCourse(id, userId) {
  const c = await db.query(
    "SELECT c.*,(SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id=c.id) enrollment_count FROM courses c WHERE id=$1 AND published=true AND NOT archived",
    [id],
  );
  if (!c.rowCount) return null;
  const [modules, enrollment] = await Promise.all([
    db.query(
      `SELECT m.id,m.title,m.description,m.order_index AS module_order,
      COALESCE(json_agg(json_build_object('id',l.id,'title',l.title,'lesson_order',l.order_index,'estimated_minutes',l.duration_minutes)
      ORDER BY l.order_index) FILTER(WHERE l.id IS NOT NULL),'[]'::json) AS lessons
      FROM modules m LEFT JOIN lessons l ON l.module_id=m.id AND NOT l.archived WHERE m.course_id=$1 AND NOT m.archived
      GROUP BY m.id ORDER BY m.order_index`,
      [id],
    ),
    userId
      ? db.query(
          "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2",
          [userId, id],
        )
      : Promise.resolve({ rowCount: 0 }),
  ]);
  return {
    ...c.rows[0],
    enrolled: Boolean(enrollment.rowCount),
    modules: modules.rows,
  };
}
async function enroll(userId, courseId) {
  const course = await db.query(
    "SELECT id FROM courses WHERE id=$1 AND published=true AND NOT archived",
    [courseId],
  );
  if (!course.rowCount)
    throw Object.assign(new Error("Course not found"), { status: 404 });
  const r = await db.query(
    `INSERT INTO enrollments(user_id,course_id) VALUES($1,$2)
    ON CONFLICT(user_id,course_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING *`,
    [userId, courseId],
  );
  return r.rows[0];
}
module.exports = { listCourses, getCourse, enroll };
