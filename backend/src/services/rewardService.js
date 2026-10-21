const crypto = require("node:crypto");
async function award(client, userId, reason, sourceId, amount, metadata = {}) {
  // Serialize rewards and streak changes per account within the caller's transaction.
  await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [userId]);
  const claim = await client.query(
    "INSERT INTO reward_claims(user_id,reason,source_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING user_id",
    [userId, reason, String(sourceId)],
  );
  if (!claim.rowCount) return false;
  await client.query(
    "INSERT INTO xp_transactions(user_id,amount,reason,metadata) VALUES($1,$2,$3,$4::jsonb)",
    [userId, amount, reason, JSON.stringify(metadata)],
  );
  await client.query(
    `INSERT INTO streaks(user_id,current_streak,longest_streak,last_activity_date) VALUES($1,1,1,CURRENT_DATE)
    ON CONFLICT(user_id) DO UPDATE SET
    current_streak=CASE WHEN streaks.last_activity_date=CURRENT_DATE THEN streaks.current_streak WHEN streaks.last_activity_date=CURRENT_DATE-1 THEN streaks.current_streak+1 ELSE 1 END,
    longest_streak=GREATEST(streaks.longest_streak,CASE WHEN streaks.last_activity_date=CURRENT_DATE THEN streaks.current_streak WHEN streaks.last_activity_date=CURRENT_DATE-1 THEN streaks.current_streak+1 ELSE 1 END),
    last_activity_date=CURRENT_DATE`,
    [userId],
  );
  const badges = {
    lesson_completed: "first_lesson",
    quiz_passed: "quiz_master",
    project_submitted: "first_project",
    mock_completed: "interview_ready",
  };
  for (const code of [badges[reason], "seven_day_streak"].filter(Boolean)) {
    if (code === "seven_day_streak") {
      const streak = await client.query(
        "SELECT current_streak FROM streaks WHERE user_id=$1",
        [userId],
      );
      if (streak.rows[0].current_streak < 7) continue;
    }
    const badge = await client.query(
      `INSERT INTO user_achievements(user_id,achievement_id)
      SELECT $1,id FROM achievements WHERE code=$2 ON CONFLICT DO NOTHING RETURNING achievement_id`,
      [userId, code],
    );
    if (badge.rowCount)
      await client.query(
        "INSERT INTO notifications(user_id,title,message) SELECT $1,'Achievement unlocked',name FROM achievements WHERE id=$2",
        [userId, badge.rows[0].achievement_id],
      );
  }
  return true;
}
async function issueCertificate(client, userId, courseId) {
  const eligible = await client.query(
    `SELECT c.title,u.name FROM courses c JOIN users u ON u.id=$1
    WHERE c.id=$2 AND NOT c.archived
    AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id AND NOT l.archived AND NOT m.archived)
    AND NOT EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id AND NOT l.archived AND NOT m.archived
      AND NOT EXISTS(SELECT 1 FROM lesson_progress p WHERE p.user_id=$1 AND p.lesson_id=l.id AND p.completed))
    AND NOT EXISTS(SELECT 1 FROM quizzes q WHERE q.course_id=c.id AND NOT q.archived
      AND NOT EXISTS(SELECT 1 FROM quiz_attempts a WHERE a.user_id=$1 AND a.quiz_id=q.id AND a.percentage>=q.passing_percentage))`,
    [userId, courseId],
  );
  if (eligible.rowCount)
    await client.query(
      "INSERT INTO certificates(id,user_id,course_id,student_name,course_name) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,course_id) DO NOTHING",
      [
        crypto.randomUUID(),
        userId,
        courseId,
        eligible.rows[0].name,
        eligible.rows[0].title,
      ],
    );
}
module.exports = { award, issueCertificate };
