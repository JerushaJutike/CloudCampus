const db = require("../config/db");
const { fail } = require("../utils/validation");
const { award, issueCertificate } = require("./rewardService");
async function authorize(client, userId, quizId) {
  const result = await client.query(
    `SELECT q.id,q.course_id,q.passing_percentage FROM quizzes q JOIN courses c ON c.id=q.course_id
    WHERE q.id=$1 AND NOT q.archived AND NOT c.archived AND c.published`,
    [quizId],
  );
  if (!result.rowCount) fail("Quiz not found", 404);
  const enrolled = await client.query(
    "SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2",
    [userId, result.rows[0].course_id],
  );
  if (!enrolled.rowCount)
    fail("Enroll in this course before taking quizzes", 403);
  return result.rows[0];
}
async function getQuiz(id, userId) {
  await authorize(db, userId, id);
  const quiz = await db.query(
    "SELECT id,title,description,difficulty,passing_percentage FROM quizzes WHERE id=$1",
    [id],
  );
  const questions = await db.query(
    "SELECT id,question_text,question_type,options,points,question_order FROM questions WHERE quiz_id=$1 AND NOT archived ORDER BY question_order,id",
    [id],
  );
  return { ...quiz.rows[0], questions: questions.rows };
}
function normalizeAnswer(value) {
  if (Array.isArray(value))
    return JSON.stringify(
      [...new Set(value.map((x) => String(x).trim().toLowerCase()))].sort(),
    );
  return String(value ?? "")
    .trim()
    .toLowerCase();
}
function scoreQuestions(questions, answers) {
  let score = 0,
    max = 0;
  for (const question of questions) {
    const points = Number(question.points);
    if (!Number.isInteger(points) || points < 1)
      fail("Question points are invalid; contact an administrator", 409);
    max += points;
    let expected = question.correct_answer;
    if (typeof expected === "string") {
      try {
        expected = JSON.parse(expected);
      } catch {
        /* Legacy plain text answer. */
      }
    }
    const submitted = answers[question.id];
    const matches =
      question.question_type === "code_output"
        ? String(expected).trim() === String(submitted).trim()
        : normalizeAnswer(expected) === normalizeAnswer(submitted);
    if (submitted !== undefined && matches) score += points;
  }
  if (!max) fail("This quiz has no questions yet", 409);
  return { score, max, percentage: Math.round((score / max) * 100) };
}
async function submitQuiz(userId, quizId, answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers))
    fail("answers must be an object keyed by question ID");
  return db.transaction(async (client) => {
    const quiz = await authorize(client, userId, quizId);
    const questions = await client.query(
      "SELECT id,correct_answer,points,question_type FROM questions WHERE quiz_id=$1 AND NOT archived",
      [quizId],
    );
    const ids = new Set(questions.rows.map((q) => String(q.id)));
    for (const [id, answer] of Object.entries(answers)) {
      if (
        !ids.has(id) ||
        !(
          (typeof answer === "string" && answer.length <= 10000) ||
          typeof answer === "boolean" ||
          (typeof answer === "number" && Number.isFinite(answer)) ||
          (Array.isArray(answer) &&
            answer.length <= 30 &&
            answer.every((x) => typeof x === "string" && x.length <= 1000))
        )
      )
        fail("Invalid quiz answers");
    }
    const { score, max, percentage } = scoreQuestions(questions.rows, answers);
    const result = await client.query(
      "INSERT INTO quiz_attempts(user_id,quiz_id,score,max_score,percentage,answers) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING id,user_id,quiz_id,score,max_score,percentage,attempted_at AS created_at",
      [userId, quizId, score, max, percentage, JSON.stringify(answers)],
    );
    const passed = percentage >= quiz.passing_percentage;
    const rewarded =
      passed &&
      (await award(client, userId, "quiz_passed", quizId, 25, {
        quiz_id: String(quizId),
      }));
    if (passed) await issueCertificate(client, userId, quiz.course_id);
    return {
      ...result.rows[0],
      percentage,
      passed,
      xp_awarded: rewarded ? 25 : 0,
    };
  });
}
module.exports = { getQuiz, submitQuiz, normalizeAnswer, scoreQuestions };
