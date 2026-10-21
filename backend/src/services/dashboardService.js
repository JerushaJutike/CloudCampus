const db = require("../config/db");
const { levelFromXp } = require("../utils/xp");
async function getDashboard(userId) {
  const [u, c, xp, streak, a] = await Promise.all([
    db.query("SELECT id,name,email,role FROM users WHERE id=$1", [userId]),
    db.query(
      `SELECT c.id,c.title,c.category,e.enrolled_at,COALESCE(ROUND(100.0*COUNT(lp.id) FILTER(WHERE lp.completed)/NULLIF(COUNT(l.id),0)),0)::int progress FROM enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN modules m ON m.course_id=c.id AND NOT m.archived LEFT JOIN lessons l ON l.module_id=m.id AND NOT l.archived LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=e.user_id WHERE e.user_id=$1 AND NOT c.archived GROUP BY c.id,c.title,c.category,e.enrolled_at ORDER BY e.enrolled_at DESC`,
      [userId],
    ),
    db.query(
      "SELECT COALESCE(SUM(amount),0)::int xp FROM xp_transactions WHERE user_id=$1",
      [userId],
    ),
    db.query(
      "SELECT CASE WHEN last_activity_date>=CURRENT_DATE-1 THEN current_streak ELSE 0 END current_streak,longest_streak FROM streaks WHERE user_id=$1",
      [userId],
    ),
    db.query(
      "SELECT COUNT(*)::int attempts FROM quiz_attempts WHERE user_id=$1",
      [userId],
    ),
  ]);
  return {
    user: u.rows[0],
    xp: xp.rows[0].xp,
    level: levelFromXp(xp.rows[0].xp),
    streak: streak.rows[0] || { current_streak: 0, longest_streak: 0 },
    quizAttempts: a.rows[0].attempts,
    courses: c.rows,
  };
}
module.exports = { getDashboard };
