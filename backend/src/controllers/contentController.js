const db = require("../config/db");
const { fail, text, httpUrl, positiveId } = require("../utils/validation");
const difficulties = ["Beginner", "Intermediate", "Advanced"];
const enumValue = (values) => (value) => {
  if (!values.includes(value)) fail("Invalid selection");
  return value;
};
const string =
  (name, max = 10000, min = 0) =>
  (value) =>
    text(value, name, max, min);
const integer = (min, max) => (value) => {
  if (!Number.isInteger(value) || value < min || value > max)
    fail(`Integer must be ${min} to ${max}`);
  return value;
};
const boolean = (value) => {
  if (typeof value !== "boolean") fail("A boolean is required");
  return value;
};
const array = (value) => {
  if (!Array.isArray(value) || value.length > 100)
    fail("Supply an array of up to 100 items");
  return JSON.stringify(value);
};
const object = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("Supply an object");
  return JSON.stringify(value);
};
// SQL identifiers come only from this server-owned allowlist.
const schemas = {
  courses: {
    title: string("Title", 200, 2),
    slug: (value) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 200)
        fail("Invalid course slug");
      return value;
    },
    description: string("Description"),
    category: string("Category", 100, 1),
    difficulty: enumValue(difficulties),
    published: boolean,
    thumbnail_url: httpUrl,
  },
  modules: {
    course_id: positiveId,
    title: string("Title", 200, 2),
    description: string("Description"),
    order_index: integer(1, 1000),
  },
  lessons: {
    module_id: positiveId,
    title: string("Title", 200, 2),
    content: string("Content", 100000, 10),
    video_url: httpUrl,
    resources: (value) => {
      if (!Array.isArray(value) || value.length > 30)
        fail("Supply up to 30 resources");
      return JSON.stringify(
        value.map((resource) => {
          if (!resource || typeof resource !== "object")
            fail("Invalid resource");
          const title = text(
            resource.title || resource.label,
            "Resource title",
            200,
            1,
          );
          return { title, url: httpUrl(resource.url) };
        }),
      );
    },
    duration_minutes: integer(1, 1440),
    order_index: integer(1, 1000),
  },
  quizzes: {
    course_id: positiveId,
    module_id: (value) => (value === null ? null : positiveId(value)),
    title: string("Title", 200, 2),
    description: string("Description"),
    difficulty: enumValue(difficulties),
    passing_percentage: integer(1, 100),
  },
  questions: {
    quiz_id: positiveId,
    question_text: string("Question", 10000, 2),
    question_type: enumValue([
      "mcq",
      "true_false",
      "multiple_answer",
      "code_output",
      "scenario",
    ]),
    options: array,
    correct_answer: (value) => {
      if (Array.isArray(value)) return JSON.stringify(value);
      return text(String(value), "Correct answer", 10000, 1);
    },
    explanation: string("Explanation"),
    points: integer(1, 100),
    question_order: integer(1, 1000),
  },
  "coding-problems": {
    title: string("Title", 200, 2),
    slug: string("Slug", 200, 2),
    category: string("Category", 100, 1),
    difficulty: enumValue(["Easy", "Medium", "Hard"]),
    statement: string("Statement", 50000, 10),
    examples: (value) => {
      if (!Array.isArray(value) || value.length > 30)
        fail("Supply up to 30 examples");
      return JSON.stringify(
        value.map((example) => {
          if (!example || typeof example !== "object") fail("Invalid example");
          return {
            input: text(example.input, "Example input", 10000),
            output: text(example.output, "Example output", 10000),
          };
        }),
      );
    },
    constraints: string("Constraints"),
    starter_code: (value) => {
      object(value);
      for (const [language, code] of Object.entries(value)) {
        if (
          !["javascript", "python", "java", "cpp", "c", "sql"].includes(
            language,
          )
        )
          fail("Unsupported starter code language");
        text(code, "Starter code", 50000);
      }
      return JSON.stringify(value);
    },
  },
  "interview-questions": {
    category: string("Category", 100, 1),
    difficulty: enumValue(difficulties),
    question: string("Question", 10000, 2),
    answer: string("Answer", 10000, 2),
  },
  projects: {
    title: string("Title", 200, 2),
    description: string("Description", 10000, 10),
    difficulty: enumValue(difficulties),
    technologies: (value) => {
      array(value);
      value.forEach((item) => text(item, "Technology", 80, 1));
      return JSON.stringify(value);
    },
    requirements: (value) => {
      array(value);
      value.forEach((item) => text(item, "Requirement", 2000, 1));
      return JSON.stringify(value);
    },
    milestones: (value) => {
      array(value);
      value.forEach((item) => text(item, "Milestone", 2000, 1));
      return JSON.stringify(value);
    },
  },
};
const required = {
  courses: ["title", "slug", "category", "difficulty", "published"],
  modules: ["course_id", "title", "order_index"],
  lessons: ["module_id", "title", "content", "order_index", "duration_minutes"],
  quizzes: ["course_id", "title", "difficulty", "passing_percentage"],
  questions: [
    "quiz_id",
    "question_text",
    "question_type",
    "correct_answer",
    "points",
    "options",
  ],
  "coding-problems": ["title", "slug", "category", "difficulty", "statement"],
  "interview-questions": ["category", "difficulty", "question", "answer"],
  projects: [
    "title",
    "description",
    "difficulty",
    "technologies",
    "requirements",
  ],
};
function entity(req) {
  const schema = schemas[req.params.entity];
  if (!schema) fail("Content type not found", 404);
  return { schema, table: req.params.entity.replaceAll("-", "_") };
}
exports.list = async (req, res, next) => {
  try {
    const { table } = entity(req);
    const result = await db.query(
      `SELECT * FROM ${table} WHERE NOT archived ORDER BY id LIMIT 500`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
exports.save = async (req, res, next) => {
  try {
    const { schema, table } = entity(req),
      body = req.body || {},
      editing = Boolean(req.params.id);
    if (!editing)
      for (const key of required[req.params.entity])
        if (!Object.hasOwn(body, key)) fail(`${key} is required`);
    const values = [],
      keys = [];
    for (const [key, value] of Object.entries(body)) {
      if (!schema[key]) fail(`Unknown field: ${key}`);
      keys.push(key);
      values.push(schema[key](value));
    }
    if (!keys.length) fail("No fields supplied");
    if (table === "questions") {
      const old = editing
        ? (
            await db.query("SELECT * FROM questions WHERE id=$1", [
              req.params.id,
            ])
          ).rows[0]
        : {};
      const merged = { ...old, ...body };
      if (
        ["mcq", "true_false", "multiple_answer"].includes(merged.question_type)
      ) {
        if (
          !Array.isArray(merged.options) ||
          merged.options.length < 2 ||
          merged.options.some((x) => typeof x !== "string" || x.length > 1000)
        )
          fail("Provide at least two text options");
        let answers = merged.correct_answer;
        if (typeof answers === "string") {
          try {
            answers = JSON.parse(answers);
          } catch {}
        }
        const list = Array.isArray(answers) ? answers : [answers];
        if (
          !list.length ||
          list.some((answer) => !merged.options.includes(String(answer)))
        )
          fail("Correct answers must match the options");
      }
    }
    if (table === "quizzes" && body.module_id) {
      const module = await db.query(
        "SELECT course_id FROM modules WHERE id=$1 AND NOT archived",
        [body.module_id],
      );
      const old = editing
        ? (
            await db.query("SELECT course_id FROM quizzes WHERE id=$1", [
              req.params.id,
            ])
          ).rows[0]
        : null;
      if (
        !module.rowCount ||
        module.rows[0].course_id !== Number(body.course_id || old?.course_id)
      )
        fail("Module must belong to this course");
    }
    const result = editing
      ? await db.query(
          `UPDATE ${table} SET ${keys.map((key, i) => `${key}=$${i + 1}`).join(",")} WHERE id=$${values.length + 1} AND NOT archived RETURNING *`,
          [...values, positiveId(req.params.id)],
        )
      : await db.query(
          `INSERT INTO ${table}(${keys.join(",")}) VALUES(${values.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING *`,
          values,
        );
    if (!result.rowCount) fail("Content not found", 404);
    res
      .status(editing ? 200 : 201)
      .json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
exports.archive = async (req, res, next) => {
  try {
    const { table } = entity(req);
    const result = await db.query(
      `UPDATE ${table} SET archived=true WHERE id=$1 RETURNING id`,
      [positiveId(req.params.id)],
    );
    if (!result.rowCount) fail("Content not found", 404);
    res.json({
      success: true,
      data: result.rows[0],
      message: "Archived; student history retained",
    });
  } catch (error) {
    next(error);
  }
};
exports.students = async (req, res, next) => {
  try {
    const result =
      await db.query(`SELECT u.id,u.name,u.email,u.role,u.disabled,u.created_at,
   (SELECT COUNT(*)::int FROM enrollments e WHERE e.user_id=u.id) enrollments,
   (SELECT COALESCE(SUM(amount),0)::int FROM xp_transactions x WHERE x.user_id=u.id) xp FROM users u ORDER BY id LIMIT 500`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
exports.updateStudent = async (req, res, next) => {
  try {
    const id = positiveId(req.params.id);
    if (id === req.user.id) fail("You cannot disable your own account");
    const disabled = boolean(req.body?.disabled);
    const result = await db.query(
      "UPDATE users SET disabled=$1 WHERE id=$2 AND role='student' RETURNING id,disabled",
      [disabled, id],
    );
    if (!result.rowCount) fail("Student not found", 404);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
exports.analytics = async (req, res, next) => {
  try {
    const result =
      await db.query(`SELECT c.id,c.title,COUNT(DISTINCT e.id)::int enrollments,COUNT(DISTINCT a.id)::int quiz_attempts,ROUND(AVG(a.percentage))::int average_score
 FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id LEFT JOIN quizzes q ON q.course_id=c.id LEFT JOIN quiz_attempts a ON a.quiz_id=q.id GROUP BY c.id ORDER BY c.id`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
