const test = require("node:test");
const assert = require("node:assert/strict");
const enabled = process.env.RUN_INTEGRATION === "true";
test(
  "PostgreSQL student journey, concurrency and admin security",
  { skip: !enabled },
  async (t) => {
    assert.match(
      process.env.DBNAME || new URL(process.env.DATABASE_URL).pathname,
      /cloudcampus_verify_/,
    );
    const db = require("../src/config/db"),
      app = require("../src/app");
    const server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    t.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await db.pool.end();
    });
    async function request(path, method = "GET", body, token, status = 200) {
      const response = await fetch(origin + "/api" + path, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await response.json();
      assert.equal(
        response.status,
        status,
        `${method} ${path}: ${JSON.stringify(json)}`,
      );
      return json.data;
    }
    const email = `student-${Date.now()}@example.test`,
      password = "correct-horse-battery";
    const student = await request(
      "/auth/register",
      "POST",
      { name: "Test Student", email, password, role: "admin" },
      null,
      201,
    );
    assert.equal(student.user.role, "student");
    assert.match(
      (
        await db.query("SELECT password_hash FROM users WHERE id=$1", [
          student.user.id,
        ])
      ).rows[0].password_hash,
      /^\$2/,
    );
    const token = (await request("/auth/login", "POST", { email, password }))
      .token;
    await request(
      "/auth/login",
      "POST",
      { email, password: "wrong" },
      null,
      401,
    );
    await request(
      "/auth/register",
      "POST",
      { name: "Test Student", email, password },
      null,
      409,
    );
    await request("/admin/stats", "GET", null, token, 403);
    const courses = await request("/courses");
  assert.equal(courses.length,6);
  assert.equal(new Set(courses.map(course=>course.title.toLowerCase())).size,6);
    const course = await request(
      `/courses/${courses[0].id}`,
      "GET",
      null,
      token,
    );
    assert.ok(course.modules.length);
    const lessonId = course.modules[0].lessons[0].id;
    await request(`/lessons/${lessonId}`, "GET", null, token, 403);
    const quizzes = await request(
      `/courses/${course.id}/quizzes`,
      "GET",
      null,
      token,
    );
    assert.ok(quizzes.length);
    await request(`/quizzes/${quizzes[0].id}`, "GET", null, token, 403);
    await request(`/courses/${course.id}/enroll`, "POST", null, token, 201);
    await request(`/courses/${course.id}/enroll`, "POST", null, token, 201);
    await request(`/lessons/${lessonId}`, "GET", null, token);
    const concurrent = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(`/lessons/${lessonId}/complete`, "POST", null, token),
      ),
    );
    assert.equal(
      concurrent.reduce((sum, x) => sum + x.xp_awarded, 0),
      10,
    );
    assert.equal(
      (
        await db.query(
          "SELECT COUNT(*)::int count FROM xp_transactions WHERE user_id=$1 AND reason='lesson_completed'",
          [student.user.id],
        )
      ).rows[0].count,
      1,
    );
    for (const module of course.modules)
      for (const lesson of module.lessons)
        await request(`/lessons/${lesson.id}/complete`, "POST", null, token);
    const quiz = await request(`/quizzes/${quizzes[0].id}`, "GET", null, token);
    assert.equal("correct_answer" in quiz.questions[0], false);
    const key = await db.query(
      "SELECT id,correct_answer FROM questions WHERE quiz_id=$1 AND NOT archived",
      [quiz.id],
    );
    const answers = Object.fromEntries(
      key.rows.map((q) => {
        let answer = q.correct_answer;
        try {
          answer = JSON.parse(answer);
        } catch {}
        return [q.id, answer];
      }),
    );
    const result = await request(
      `/quizzes/${quiz.id}/submit`,
      "POST",
      { answers },
      token,
    );
    assert.equal(result.percentage, 100);
    assert.equal(result.xp_awarded, 25);
    const repeated = await request(
      `/quizzes/${quiz.id}/submit`,
      "POST",
      { answers },
      token,
    );
    assert.equal(repeated.xp_awarded, 0);
    await request(
      `/quizzes/${quiz.id}/submit`,
      "POST",
      { answers: { 999999: "invalid" } },
      token,
      400,
    );
    const history = await request("/quiz-attempts", "GET", null, token);
    assert.equal(history.length, 2);
    const problems = await request("/coding-problems", "GET", null, token);
    assert.ok(problems.length);
    const code = {
      problemId: problems[0].id,
      language: "javascript",
      code: "function solve() { return 1; }",
    };
    assert.equal(
      (await request("/submissions", "POST", code, token, 201)).xp_awarded,
      50,
    );
    assert.equal(
      (await request("/submissions", "POST", code, token, 201)).xp_awarded,
      0,
    );
    await request("/submissions", "POST", { ...code, code: "" }, token, 400);
    assert.equal((await request("/submissions", "GET", null, token)).length, 2);
    const projects = await request("/projects", "GET", null, token);
    assert.ok(projects.length);
    const submission = {
      githubUrl: "https://github.com/student/project",
      description: "Working test project with documented API.",
      technologies: ["JavaScript"],
    };
    assert.equal(
      (
        await request(
          `/projects/${projects[0].id}/submit`,
          "POST",
          submission,
          token,
          201,
        )
      ).xp_awarded,
      200,
    );
    assert.equal(
      (
        await request(
          `/projects/${projects[0].id}/submit`,
          "POST",
          submission,
          token,
          201,
        )
      ).xp_awarded,
      0,
    );
    await request(
      `/projects/${projects[0].id}/submit`,
      "POST",
      { ...submission, githubUrl: "javascript:alert(1)" },
      token,
      400,
    );
    await request(`/bookmarks/${lessonId}`, "POST", null, token);
    assert.equal((await request("/bookmarks", "GET", null, token)).length, 1);
    const portfolio = await request("/portfolio", "GET", null, token);
    assert.equal(portfolio.projects.length, 1);
    assert.ok(portfolio.badges.length >= 3);
    assert.equal(portfolio.certificates.length, 1);
    await request(`/certificates/${portfolio.certificates[0].id}/verify`);
    await request("/certificates/invalid/verify", "GET", null, null, 404);
    await request("/recommendations", "GET", null, token);
    await request("/leaderboard", "GET", null, token);
    await request("/analytics", "GET", null, token);
    await request("/search?q=Arrays", "GET", null, token);
    await request("/search?q=x", "GET", null, token, 400);
    await request(
      "/goals",
      "PUT",
      { lessons: 3, problems: 2, quizzes: 1 },
      token,
    );
    assert.equal(
      (await request("/goals", "GET", null, token)).targets.lessons,
      3,
    );
    await request(
      "/profile",
      "PATCH",
      {
        name: "Updated Student",
        bio: "Computer Science learner",
        githubUrl: "https://github.com/student",
      },
      token,
    );
    const notifications = await request("/notifications", "GET", null, token);
    assert.ok(notifications.length);
    const pdf = Buffer.from(
      "%PDF-1.7\nTest document for file storage validation",
    );
    const uploadResponse = await fetch(origin + "/api/files", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/pdf",
        "X-File-Name": "test.pdf",
      },
      body: pdf,
    });
    assert.equal(uploadResponse.status, 201);
    const upload = (await uploadResponse.json()).data;
    const downloaded = await fetch(origin + "/api/files/" + upload.id, {
      headers: { Authorization: "Bearer " + token },
    });
    assert.equal(downloaded.status, 200);
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), pdf);
    assert.equal((await request("/files", "GET", null, token)).length, 1);
    await request(
      `/notifications/${notifications[0].id}`,
      "PATCH",
      null,
      token,
    );
    const mock = await request("/mock-interviews", "POST", null, token);
    await request(`/mock-interviews/${mock.id}/review`, "GET", null, token);
    const mockResult = await request(
      `/mock-interviews/${mock.id}/complete`,
      "POST",
      {
        answers: Object.fromEntries(
          mock.questions.map((q) => [q.id, "A thoughtful interview answer."]),
        ),
        ratings: Object.fromEntries(mock.questions.map((q) => [q.id, 4])),
      },
      token,
    );
    assert.equal(mockResult.score, 80);
    await request(
      `/mock-interviews/${mock.id}/complete`,
      "POST",
      {},
      token,
      409,
    );
    const dashboard = await request("/dashboard", "GET", null, token);
    assert.equal(dashboard.courses[0].progress, 100);
    const admin = await request(
      "/auth/register",
      "POST",
      {
        name: "Test Admin",
        email: `admin-${Date.now()}@example.test`,
        password,
      },
      null,
      201,
    );
    await db.query("UPDATE users SET role='admin' WHERE id=$1", [
      admin.user.id,
    ]);
    // Role is loaded from the database, so a stale token cannot retain or invent permissions.
    const adminToken = admin.token;
    await request("/admin/stats", "GET", null, adminToken);
    const draft = await request(
      "/admin/content/courses",
      "POST",
      {
        title: "Draft Test Course",
        slug: `draft-test-${Date.now()}`,
        description: "Course test",
        category: "General",
        difficulty: "Beginner",
        published: false,
      },
      adminToken,
      201,
    );
    assert.ok(
      (await request("/admin/courses", "GET", null, adminToken)).some(
        (c) => c.id === draft.id,
      ),
    );
    assert.ok(!(await request("/courses")).some((c) => c.id === draft.id));
    await request(
      `/admin/content/courses/${draft.id}`,
      "PATCH",
      { published: "yes" },
      adminToken,
      400,
    );
    const module = await request(
      "/admin/content/modules",
      "POST",
      {
        course_id: draft.id,
        title: "Test Module",
        description: "Test module",
        order_index: 1,
      },
      adminToken,
      201,
    );
    const lesson = await request(
      "/admin/content/lessons",
      "POST",
      {
        module_id: module.id,
        title: "Test Lesson",
        content: "A complete lesson test body.",
        order_index: 1,
        duration_minutes: 10,
        resources: [],
      },
      adminToken,
      201,
    );
    const assessment = await request(
      "/admin/content/quizzes",
      "POST",
      {
        course_id: draft.id,
        module_id: module.id,
        title: "Test Assessment",
        difficulty: "Beginner",
        passing_percentage: 60,
      },
      adminToken,
      201,
    );
    const question = await request(
      "/admin/content/questions",
      "POST",
      {
        quiz_id: assessment.id,
        question_text: "Select the correct answers",
        question_type: "multiple_answer",
        options: ["A", "B", "C"],
        correct_answer: ["A", "B"],
        points: 2,
        question_order: 1,
      },
      adminToken,
      201,
    );
    await request(
      `/admin/content/questions/${question.id}`,
      "PATCH",
      { points: 3 },
      adminToken,
    );
    await request(
      `/admin/content/lessons/${lesson.id}`,
      "DELETE",
      null,
      adminToken,
    );
    await request(
      `/admin/content/courses/${draft.id}`,
      "DELETE",
      null,
      adminToken,
    );
    assert.ok(
      (await db.query("SELECT archived FROM courses WHERE id=$1", [draft.id]))
        .rows[0].archived,
    );
    await request("/admin/students", "GET", null, adminToken);
    await request("/admin/analytics", "GET", null, adminToken);
    await request(
      `/admin/students/${student.user.id}`,
      "PATCH",
      { disabled: true },
      adminToken,
    );
    await request("/dashboard", "GET", null, token, 401);
    await db.query("UPDATE users SET role='student' WHERE id=$1", [
      admin.user.id,
    ]);
    await request("/admin/stats", "GET", null, adminToken, 403);
    await request("/courses/0", "GET", null, token, 400);
    const cors = await fetch(origin + "/api/health", {
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(cors.status, 403);
    const malformed = await fetch(origin + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await fetch(origin)).status, 200);
    assert.equal((await fetch(origin + "/api/ready")).status, 200);
  },
);
