const db = require("../config/db");
const { fail, positiveId, text } = require("../utils/validation");
const { award } = require("./rewardService");
async function submit(userId, body) {
  const problemId = positiveId(body?.problemId);
  const language = String(body?.language || "").toLowerCase();
  if (!["javascript", "python", "java", "cpp", "c", "sql"].includes(language))
    fail("Unsupported language");
  const code = text(body?.code, "Code", 50000, 1);
  return db.transaction(async (client) => {
    const problem = await client.query(
      "SELECT id FROM coding_problems WHERE id=$1 AND NOT archived",
      [problemId],
    );
    if (!problem.rowCount) fail("Coding problem not found", 404);
    const result = await client.query(
      "INSERT INTO submissions(user_id,problem_id,language,code,status) VALUES($1,$2,$3,$4,$5) RETURNING id,problem_id,language,status,created_at",
      [userId, problemId, language, code, "stored"],
    );
    const rewarded = await award(
      client,
      userId,
      "practice_submitted",
      problemId,
      50,
      { problem_id: String(problemId) },
    );
    return {
      ...result.rows[0],
      xp_awarded: rewarded ? 50 : 0,
      evaluation:
        "Stored without execution; XP rewards participation, not correctness",
    };
  });
}
module.exports = { submit };
