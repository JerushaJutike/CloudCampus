const router = require("express").Router();
const crypto = require("node:crypto");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { fail, text, httpUrl, positiveId } = require("../utils/validation");
const { award } = require("../services/rewardService");
const route = (work) => async (req, res, next) => {
  try {
    res.json({ success: true, data: await work(req, res) });
  } catch (error) {
    next(error);
  }
};
router.get(
  "/certificates/:certificateId/verify",
  route(async (req) => {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.certificateId))
      fail("Certificate not found", 404);
    const result = await db.query(
      "SELECT id,student_name,course_name,issued_at FROM certificates WHERE id=$1",
      [req.params.certificateId],
    );
    if (!result.rowCount) fail("Certificate not found", 404);
    return result.rows[0];
  }),
);
router.use((req, res, next) => {
  const paths = [
    "portfolio",
    "leaderboard",
    "quiz-attempts",
    "recommendations",
    "notifications",
    "bookmarks",
    "profile",
    "goals",
    "search",
    "mock-interviews",
  ];
  if (!paths.includes(req.path.split("/")[1])) return next("router");
  authenticate(req, res, next);
});
router.get(
  "/portfolio",
  route(async (req) => {
    const [profile, projects, badges, certificates, skills] = await Promise.all(
      [
        db.query("SELECT id,name,bio,github_url FROM users WHERE id=$1", [
          req.user.id,
        ]),
        db.query(
          `SELECT s.id,p.title,s.github_url,s.live_demo_url,s.description,s.technologies,s.submitted_at,s.updated_at
      FROM project_submissions s JOIN projects p ON p.id=s.project_id WHERE s.user_id=$1 ORDER BY s.submitted_at DESC`,
          [req.user.id],
        ),
        db.query(
          "SELECT a.name,a.description,ua.unlocked_at FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=$1",
          [req.user.id],
        ),
        db.query(
          "SELECT id,course_name,student_name,issued_at FROM certificates WHERE user_id=$1",
          [req.user.id],
        ),
        db.query(
          `SELECT c.category,COUNT(DISTINCT p.lesson_id)::int lessons_completed FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id
      JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE p.user_id=$1 AND p.completed GROUP BY c.category`,
          [req.user.id],
        ),
      ],
    );
    return {
      profile: profile.rows[0],
      projects: projects.rows,
      badges: badges.rows,
      certificates: certificates.rows,
      skills: skills.rows,
    };
  }),
);
router.get(
  "/leaderboard",
  route(
    async () =>
      (
        await db.query(`SELECT u.id,u.name,COALESCE(SUM(x.amount),0)::int xp FROM users u LEFT JOIN xp_transactions x ON x.user_id=u.id
  WHERE NOT u.disabled AND u.role='student' GROUP BY u.id ORDER BY xp DESC,u.id LIMIT 50`)
      ).rows,
  ),
);
router.get(
  "/quiz-attempts",
  route(
    async (req) =>
      (
        await db.query(
          `SELECT a.id,a.quiz_id,q.title,a.score,a.max_score,a.percentage,a.attempted_at
  FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE a.user_id=$1 ORDER BY a.attempted_at DESC LIMIT 100`,
          [req.user.id],
        )
      ).rows,
  ),
);
router.get(
  "/recommendations",
  route(async (req) => {
    const results = await db.query(
      `SELECT c.id,c.title,c.category,ROUND(AVG(a.percentage))::int average_score FROM courses c JOIN quizzes q ON q.course_id=c.id
    JOIN quiz_attempts a ON a.quiz_id=q.id WHERE a.user_id=$1 AND NOT c.archived AND c.published GROUP BY c.id HAVING AVG(a.percentage)<60 ORDER BY average_score`,
      [req.user.id],
    );
    const recommended = results.rows.length
      ? results.rows
      : (
          await db.query(
            `SELECT c.id,c.title,c.category FROM courses c WHERE c.published AND NOT c.archived
    AND NOT EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id=$1 AND e.course_id=c.id) ORDER BY c.id LIMIT 3`,
            [req.user.id],
          )
        ).rows;
    return recommended.map((row) => ({
      ...row,
      reason:
        row.average_score == null
          ? "Explore a new learning path"
          : "Review lessons and practice before retaking this assessment",
    }));
  }),
);
router.get(
  "/notifications",
  route(
    async (req) =>
      (
        await db.query(
          "SELECT id,title,message,read,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
          [req.user.id],
        )
      ).rows,
  ),
);
router.patch(
  "/notifications/:id",
  route(async (req) => {
    const result = await db.query(
      "UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING id",
      [positiveId(req.params.id), req.user.id],
    );
    if (!result.rowCount) fail("Notification not found", 404);
    return result.rows[0];
  }),
);
router.get(
  "/bookmarks",
  route(
    async (req) =>
      (
        await db.query(
          `SELECT b.id,b.lesson_id,l.title FROM bookmarks b JOIN lessons l ON l.id=b.lesson_id
  WHERE b.user_id=$1 AND NOT l.archived ORDER BY b.created_at DESC`,
          [req.user.id],
        )
      ).rows,
  ),
);
router.post(
  "/bookmarks/:id",
  route(async (req) => {
    const lessonId = positiveId(req.params.id);
    const result = await db.query(
      `INSERT INTO bookmarks(user_id,lesson_id) SELECT $1,l.id FROM lessons l JOIN modules m ON m.id=l.module_id
    JOIN enrollments e ON e.course_id=m.course_id AND e.user_id=$1 WHERE l.id=$2 AND NOT l.archived
    ON CONFLICT(user_id,lesson_id) DO UPDATE SET lesson_id=EXCLUDED.lesson_id RETURNING *`,
      [req.user.id, lessonId],
    );
    if (!result.rowCount)
      fail("Enroll in the course to bookmark this lesson", 403);
    return result.rows[0];
  }),
);
router.delete(
  "/bookmarks/:id",
  route(
    async (req) =>
      (
        await db.query(
          "DELETE FROM bookmarks WHERE user_id=$1 AND lesson_id=$2 RETURNING id",
          [req.user.id, positiveId(req.params.id)],
        )
      ).rows,
  ),
);
router.patch(
  "/profile",
  route(async (req) => {
    const name = text(req.body?.name, "Name", 100, 2);
    const bio = text(req.body?.bio || "", "Bio", 2000);
    const github = httpUrl(req.body?.githubUrl);
    return (
      await db.query(
        "UPDATE users SET name=$1,bio=$2,github_url=$3 WHERE id=$4 RETURNING id,name,bio,github_url",
        [name, bio, github, req.user.id],
      )
    ).rows[0];
  }),
);
router.get(
  "/goals",
  route(async (req) => {
    const result = await db.query(
      "SELECT lessons,problems,quizzes FROM learning_goals WHERE user_id=$1",
      [req.user.id],
    );
    const activity = await db.query(
      `SELECT reason,COUNT(*)::int count FROM xp_transactions WHERE user_id=$1 AND created_at>=CURRENT_DATE GROUP BY reason`,
      [req.user.id],
    );
    return {
      targets: result.rows[0] || { lessons: 2, problems: 3, quizzes: 1 },
      completed: Object.fromEntries(
        activity.rows.map((x) => [x.reason, x.count]),
      ),
    };
  }),
);
router.put(
  "/goals",
  route(async (req) => {
    const values = ["lessons", "problems", "quizzes"].map((name) => {
      const value = req.body?.[name];
      if (!Number.isInteger(value) || value < 1 || value > 20)
        fail("Each daily goal must be 1 to 20");
      return value;
    });
    return (
      await db.query(
        `INSERT INTO learning_goals(user_id,lessons,problems,quizzes) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id) DO UPDATE SET lessons=$2,problems=$3,quizzes=$4 RETURNING *`,
        [req.user.id, ...values],
      )
    ).rows[0];
  }),
);
router.get(
  "/search",
  route(async (req) => {
    const query = text(req.query.q, "Search", 100, 2);
    return (
      await db.query(
        `SELECT 'course' kind,c.id,c.title,NULL::integer parent_id FROM courses c WHERE c.published AND NOT c.archived AND c.title ILIKE $1
    UNION ALL SELECT 'lesson',l.id,l.title,c.id FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
      WHERE c.published AND NOT c.archived AND NOT m.archived AND NOT l.archived AND l.title ILIKE $1
    UNION ALL SELECT 'problem',id,title,NULL FROM coding_problems WHERE NOT archived AND title ILIKE $1
    UNION ALL SELECT 'interview',id,question,NULL FROM interview_questions WHERE NOT archived AND question ILIKE $1
    UNION ALL SELECT 'quiz',q.id,q.title,q.course_id FROM quizzes q JOIN courses c ON c.id=q.course_id
      WHERE NOT q.archived AND c.published AND NOT c.archived AND q.title ILIKE $1 LIMIT 50`,
        ["%" + query + "%"],
      )
    ).rows;
  }),
);
router.post(
  "/mock-interviews",
  route(async (req) => {
    const questions = (
      await db.query(
        `SELECT id,category,question FROM interview_questions WHERE NOT archived ORDER BY (category='HR') DESC,random() LIMIT 5`,
      )
    ).rows;
    if (!questions.length) fail("No interview questions available", 409);
    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO mock_interviews(id,user_id,question_ids) VALUES($1,$2,$3::jsonb)",
      [id, req.user.id, JSON.stringify(questions.map((q) => q.id))],
    );
    return {
      id,
      questions,
      scoring:
        "Self-assessment: rate each response from 1 to 5 against the sample answer.",
    };
  }),
);
router.get(
  "/mock-interviews",
  route(
    async (req) =>
      (
        await db.query(
          "SELECT id,score,started_at,completed_at FROM mock_interviews WHERE user_id=$1 ORDER BY started_at DESC LIMIT 50",
          [req.user.id],
        )
      ).rows,
  ),
);
router.get(
  "/mock-interviews/:mockId/review",
  route(async (req) => {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.mockId))
      fail("Interview not found", 404);
    const session = await db.query(
      "SELECT question_ids FROM mock_interviews WHERE id=$1 AND user_id=$2",
      [req.params.mockId, req.user.id],
    );
    if (!session.rowCount) fail("Interview not found", 404);
    return (
      await db.query(
        "SELECT id,category,question,answer FROM interview_questions WHERE id=ANY($1::int[])",
        [session.rows[0].question_ids],
      )
    ).rows;
  }),
);
router.post(
  "/mock-interviews/:mockId/complete",
  route(async (req) => {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.mockId))
      fail("Interview not found", 404);
    return db.transaction(async (client) => {
      const session = await client.query(
        "SELECT * FROM mock_interviews WHERE id=$1 AND user_id=$2 FOR UPDATE",
        [req.params.mockId, req.user.id],
      );
      if (!session.rowCount) fail("Interview not found", 404);
      if (session.rows[0].completed_at)
        fail("Interview already completed", 409);
      const { answers, ratings } = req.body || {};
      const ids = session.rows[0].question_ids;
      if (
        !answers ||
        !ratings ||
        typeof answers !== "object" ||
        typeof ratings !== "object"
      )
        fail("Answers and self-ratings are required");
      for (const id of ids) {
        text(answers[id], "Interview answer", 10000, 10);
        if (
          !Number.isInteger(ratings[id]) ||
          ratings[id] < 1 ||
          ratings[id] > 5
        )
          fail("Self-ratings must be 1 to 5");
      }
      const score = Math.round(
        (ids.reduce((sum, id) => sum + ratings[id], 0) / (ids.length * 5)) *
          100,
      );
      await client.query(
        "UPDATE mock_interviews SET answers=$1::jsonb,ratings=$2::jsonb,score=$3,completed_at=now() WHERE id=$4",
        [
          JSON.stringify(answers),
          JSON.stringify(ratings),
          score,
          req.params.mockId,
        ],
      );
      const rewarded = await award(
        client,
        req.user.id,
        "mock_completed",
        new Date().toISOString().slice(0, 10),
        100,
        { interview_id: req.params.mockId },
      );
      return {
        score,
        xp_awarded: rewarded ? 100 : 0,
        scoring: "Self-assessed",
        weak_questions: ids.filter((id) => ratings[id] <= 2),
      };
    });
  }),
);
module.exports = router;
