const db = require("../config/db");
const { httpUrl, text, fail } = require("../utils/validation");
const { award } = require("../services/rewardService");
exports.list = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id,title,description,difficulty,technologies,requirements,milestones,created_at FROM projects WHERE NOT archived ORDER BY id",
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
exports.submit = async (req, res, next) => {
  try {
    const body = req.body || {};
    const github = httpUrl(body.githubUrl),
      demo = httpUrl(body.liveDemoUrl);
    if (!github && !demo) fail("Provide a repository or live demo URL");
    if (github && new URL(github).hostname !== "github.com")
      fail("Repository URL must be on github.com");
    const description = text(body.description, "Description", 10000, 10);
    const technologies = body.technologies || [];
    if (
      !Array.isArray(technologies) ||
      technologies.length > 30 ||
      technologies.some((x) => typeof x !== "string" || x.length > 80)
    )
      fail("Supply up to 30 technology names");
    const data = await db.transaction(async (client) => {
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        req.user.id,
      ]);
      const project = await client.query(
        "SELECT id FROM projects WHERE id=$1 AND NOT archived",
        [req.params.id],
      );
      if (!project.rowCount) fail("Project not found", 404);
      // Keep all historical submissions; edit only the latest record for this student/project.
      const existing = await client.query(
        "SELECT id FROM project_submissions WHERE user_id=$1 AND project_id=$2 ORDER BY submitted_at DESC,id DESC LIMIT 1",
        [req.user.id, req.params.id],
      );
      const values = [
        req.user.id,
        req.params.id,
        github,
        demo,
        description,
        JSON.stringify(technologies),
      ];
      const result = existing.rowCount
        ? await client.query(
            "UPDATE project_submissions SET github_url=$3,live_demo_url=$4,description=$5,technologies=$6::jsonb,updated_at=now() WHERE user_id=$1 AND project_id=$2 AND id=$7 RETURNING *",
            [...values, existing.rows[0].id],
          )
        : await client.query(
            "INSERT INTO project_submissions(user_id,project_id,github_url,live_demo_url,description,technologies) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING *",
            values,
          );
      const rewarded = await award(
        client,
        req.user.id,
        "project_submitted",
        req.params.id,
        200,
        { project_id: String(req.params.id) },
      );
      return { ...result.rows[0], xp_awarded: rewarded ? 200 : 0 };
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
