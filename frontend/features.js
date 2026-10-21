"use strict";
window.CampusFeatures = function ({
  state,
  api,
  e,
  button,
  pageHeading,
  panelHead,
  empty,
  openModal,
  closeModal,
  navTo,
  toast,
}) {
  const entities = [
    "courses",
    "modules",
    "lessons",
    "quizzes",
    "questions",
    "coding-problems",
    "interview-questions",
    "projects",
  ];
  const definitions = {
    courses: {
      title: "text",
      slug: "text",
      description: "textarea",
      category: "text",
      difficulty: ["Beginner", "Intermediate", "Advanced"],
      published: ["true", "false"],
    },
    modules: {
      course_id: "courses",
      title: "text",
      description: "textarea",
      order_index: "number",
    },
    lessons: {
      module_id: "modules",
      title: "text",
      content: "textarea",
      video_url: "url",
      duration_minutes: "number",
      order_index: "number",
      resources: "resources",
    },
    quizzes: {
      course_id: "courses",
      module_id: "modules-optional",
      title: "text",
      description: "textarea",
      difficulty: ["Beginner", "Intermediate", "Advanced"],
      passing_percentage: "number",
    },
    questions: {
      quiz_id: "quizzes",
      question_text: "textarea",
      question_type: [
        "mcq",
        "true_false",
        "multiple_answer",
        "code_output",
        "scenario",
      ],
      options: "lines",
      correct_answer: "answer",
      explanation: "textarea",
      points: "number",
      question_order: "number",
    },
    "coding-problems": {
      title: "text",
      slug: "text",
      category: "text",
      difficulty: ["Easy", "Medium", "Hard"],
      statement: "textarea",
      examples: "examples",
      constraints: "textarea",
      starter_code: "starter",
    },
    "interview-questions": {
      category: "text",
      difficulty: ["Beginner", "Intermediate", "Advanced"],
      question: "textarea",
      answer: "textarea",
    },
    projects: {
      title: "text",
      description: "textarea",
      difficulty: ["Beginner", "Intermediate", "Advanced"],
      technologies: "lines",
      requirements: "lines",
      milestones: "lines",
    },
  };
  const titles = {
    course_id: "Course",
    module_id: "Module",
    quiz_id: "Quiz",
    order_index: "Display order",
    question_order: "Question order",
    video_url: "Learning video URL",
    duration_minutes: "Estimated minutes",
    passing_percentage: "Pass percentage",
    question_text: "Question",
    question_type: "Answer type",
    correct_answer: "Correct answer",
    starter_code: "Starter code",
  };
  const safeLink = (url, label) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol) &&
        !parsed.username &&
        !parsed.password
        ? `<a class="text-link" href="${e(parsed.href)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`
        : "";
    } catch {
      return "";
    }
  };
  const list = (items, build) =>
    items.length
      ? items.map(build).join("")
      : empty("Nothing here yet", "Your activity will appear here.");
  const modalHeader = (title) =>
    `<div class="modal-header"><h2>${e(title)}</h2>${button("Close", "close-modal", "btn-quiet")}</div>`;
  async function protectedPage(root) {
    if (state.user) return true;
    root.innerHTML = `<div class="panel">${empty("Sign in to continue", "Your progress is saved to your account.", button("Sign in", "go:auth"))}</div>`;
    return false;
  }
  async function contentForm(entity, id) {
    const record = id
      ? state.adminRows.find((row) => String(row.id) === String(id))
      : {};
    const fields = [];
    for (const [key, type] of Object.entries(definitions[entity])) {
      let value =
        record?.[key] ??
        (["order_index", "question_order", "points"].includes(key)
          ? 1
          : key === "duration_minutes"
            ? 15
            : key === "passing_percentage"
              ? 60
              : "");
      const label = titles[key] || key.replaceAll("_", " "),
        name = `content-${key}`;
      let input;
      if (Array.isArray(type))
        input = `<select id="${name}" name="${key}">${type.map((item) => `<option value="${e(item)}" ${String(value) === item ? "selected" : ""}>${e(item.replaceAll("_", " "))}</option>`).join("")}</select>`;
      else if (entities.includes(type.replace("-optional", ""))) {
        const options = await api(
          "/admin/content/" + type.replace("-optional", ""),
        );
        input = `<select id="${name}" name="${key}" ${type.endsWith("optional") ? "" : "required"}>${type.endsWith("optional") ? '<option value="">Final assessment / no module</option>' : ""}${options.map((row) => `<option value="${row.id}" ${String(row.id) === String(value) ? "selected" : ""}>${e(row.title || row.question_text)} (#${row.id})</option>`).join("")}</select>`;
      } else if (
        [
          "textarea",
          "lines",
          "answer",
          "resources",
          "examples",
          "starter",
        ].includes(type)
      ) {
        if (type === "lines")
          value = Array.isArray(value) ? value.join("\n") : value;
        if (type === "answer") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) value = parsed.join("\n");
          } catch {}
        }
        if (type === "resources")
          value = Array.isArray(value)
            ? value
                .map(
                  (item) =>
                    `${item.title || item.label || "Resource"} | ${item.url}`,
                )
                .join("\n")
            : "";
        if (type === "examples")
          value = Array.isArray(value)
            ? value.map((item) => `${item.input} | ${item.output}`).join("\n")
            : "";
        if (type === "starter") value = value?.javascript || "";
        const hint =
          {
            lines: "One item per line",
            answer:
              "Multiple answers: one correct option per line; otherwise enter one answer",
            resources: "One resource per line: title | https://address",
            examples: "One example per line: input | output",
            starter: "JavaScript starter code",
          }[type] || "";
        input = `<textarea id="${name}" name="${key}" rows="4" maxlength="${key === "content" ? 100000 : 50000}">${e(value)}</textarea>${hint ? `<small>${e(hint)}</small>` : ""}`;
      } else
        input = `<input id="${name}" name="${key}" type="${type}" value="${e(value)}" ${type === "number" ? 'min="1" max="1440"' : type === "text" ? 'required maxlength="200"' : 'maxlength="2048"'}>`;
      fields.push(
        `<div class="field"><label for="${name}">${e(label)}</label>${input}</div>`,
      );
    }
    openModal(
      `${modalHeader(id ? "Edit content" : "Create content")}<form id="content-form" data-entity="${e(entity)}" data-id="${e(id || "")}">${fields.join("")}<button class="btn btn-primary" type="submit">Save content</button></form>`,
    );
  }
  async function renderAdmin(root) {
    if (!(await protectedPage(root))) return;
    if (state.user.role !== "admin") {
      root.innerHTML = `<div class="panel">${empty("Admin access required", "This account has student permissions.")}</div>`;
      return;
    }
    const entity = state.adminEntity || "courses";
    const [stats, rows] = await Promise.all([
      api("/admin/stats"),
      api("/admin/content/" + entity),
    ]);
    state.adminRows = rows;
    root.innerHTML = `${pageHeading("Admin dashboard", "Manage content and students. Archiving preserves student history.", button("Create content", "content-new", "btn-primary"))}<div class="stats-grid grid">${Object.entries(
      stats,
    )
      .map(
        ([key, value]) =>
          `<div class="stat-card"><div class="stat-top">${e(key)}</div><div class="stat-value">${value}</div></div>`,
      )
      .join(
        "",
      )}</div><div class="filters"><label for="content-type">Content type</label><select id="content-type">${entities.map((type) => `<option value="${type}" ${type === entity ? "selected" : ""}>${e(type.replaceAll("-", " "))}</option>`).join("")}</select>${button("Students", "admin-students", "btn-secondary")}${button("Course analytics", "admin-analytics", "btn-secondary")}</div><div class="panel"><div class="practice-list">${list(rows, (row) => `<div class="practice-row"><span>#${row.id}</span><div><h3>${e(row.title || row.question_text || row.question)}</h3><p>${e(row.category || row.difficulty || "")}${row.published === false ? " · Draft" : ""}</p></div><div class="practice-meta">${button("Edit", "content-edit:" + row.id, "btn-quiet")}${button("Archive", "content-archive:" + row.id, "btn-danger")}</div></div>`)}</div></div>`;
  }
  async function renderPortfolio(root) {
    if (!(await protectedPage(root))) return;
    const data = await api("/portfolio");
    root.innerHTML = `${pageHeading("Portfolio", "Your projects, certificates and evidence of learning.", button("Edit profile", "go:settings", "btn-secondary"))}<div class="profile-hero"><div><h2>${e(data.profile.name)}</h2><p>${e(data.profile.bio || "Computer Science learner")}</p>${safeLink(data.profile.github_url, "GitHub profile")}</div></div><div class="panel">${panelHead("Project evidence")}<div class="project-grid grid">${list(data.projects, (project) => `<article class="project-card"><h3>${e(project.title)}</h3><p>${e(project.description)}</p><div class="chip-list">${(project.technologies || []).map((item) => `<span class="chip">${e(item)}</span>`).join("")}</div>${safeLink(project.github_url, "Repository")} ${safeLink(project.live_demo_url, "Live demo")}</article>`)}</div></div><div class="panel section-gap">${panelHead("Certificates", "Download your course certificate after finishing its lessons, topic tests, and practice questions.")}<div class="practice-list">${list(data.certificates, (certificate) => `<div class="practice-row"><span class="certificate-list-icon" aria-hidden="true">✦</span><div><h3>${e(certificate.course_name)}</h3><p>Completed ${e(new Date(certificate.issued_at).toLocaleDateString())}</p><small>Verification ID: ${e(certificate.id)}</small></div><div><a class="btn btn-secondary" href="#verify/${e(certificate.id)}">Download certificate</a></div></div>`)}</div></div><div class="grid dashboard-grid section-gap"><div class="panel">${panelHead("Achievements")}<div class="badge-grid">${list(data.badges, (badge) => `<div class="stat-card"><h3>${e(badge.name)}</h3><p>${e(badge.description)}</p></div>`)}</div></div><div class="panel">${panelHead("Learning evidence by skill area")} ${list(data.skills, (skill) => `<p><strong>${e(skill.category)}</strong> · ${skill.lessons_completed} lessons completed</p>`)}</div></div>`;
  }
  async function render(route, root) {
    const supported = [
      "admin",
      "portfolio",
      "leaderboard",
      "settings",
      "history",
      "search",
      "bookmarks",
      "verify",
    ];
    if (!supported.includes(route)) return false;
    if (route === "admin") {
      await renderAdmin(root);
      return true;
    }
    if (route === "portfolio") {
      await renderPortfolio(root);
      return true;
    }
    if (route === "verify") {
      const certificate = await api(
        "/certificates/" + encodeURIComponent(state.certificateId) + "/verify",
      );
      root.innerHTML = `${pageHeading("Your course certificate", "Download or print a verified record of your achievement.", button("Download PDF", "print-certificate", "btn-primary"))}<article class="certificate" id="completion-certificate"><div class="certificate-inner"><header class="certificate-brand"><img src="/assets/cloud-campus-mark.png" alt=""><span><strong>CloudCampus</strong><small>LEARN BEYOND LIMITS</small></span></header><div class="certificate-kicker">OFFICIAL COURSE ACHIEVEMENT</div><h1>Certificate of Completion</h1><div class="certificate-rule"><span></span></div><p class="certificate-intro">This certificate is proudly presented to</p><h2 class="certificate-student">${e(certificate.student_name)}</h2><p class="certificate-copy">for successfully completing the course</p><h2 class="certificate-course">${e(certificate.course_name)}</h2><p class="certificate-copy">including all lessons, topic assessments, and required practice activities</p><div class="certificate-signatures"><div><strong>${e(new Date(certificate.issued_at).toLocaleDateString())}</strong><span>DATE OF COMPLETION</span></div><div><strong>CloudCampus Learning</strong><span>ISSUED BY</span></div></div><div class="certificate-seal" aria-label="Course completion seal"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 23 3 9l7 5 6-9 6 9 7-5-2 14H5Zm1 3h20v2H6v-2Z" fill="currentColor"/><circle cx="3.5" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="4" r="2" fill="currentColor"/><circle cx="28.5" cy="8" r="2" fill="currentColor"/></svg></div><small class="certificate-id">Verification ID: ${e(certificate.id)}</small></div></article>`;
      return true;
    }
    if (!(await protectedPage(root))) return true;
    if (route === "leaderboard") {
      const rows = await api("/leaderboard");
      root.innerHTML = `${pageHeading("Leaderboard", "Learning participation across the campus.")}<div class="panel">${list(rows, (row, index) => `<div class="practice-row"><strong>${index + 1}</strong><div><h3>${e(row.name)}</h3></div><strong>${Number(row.xp).toLocaleString()} XP</strong></div>`)}</div>`;
    } else if (route === "settings") {
      const [portfolio, goals] = await Promise.all([
        api("/portfolio"),
        api("/goals"),
      ]);
      root.innerHTML = `${pageHeading("Profile and settings", "Manage your profile and daily learning goals.", button("Sign out", "logout", "btn-secondary"))}<div class="grid dashboard-grid"><div class="panel"><form id="profile-form"><div class="field"><label for="profile-name">Name</label><input id="profile-name" name="name" value="${e(portfolio.profile.name)}" required minlength="2" maxlength="100"></div><div class="field"><label for="profile-bio">About you</label><textarea id="profile-bio" name="bio" maxlength="2000">${e(portfolio.profile.bio)}</textarea></div><div class="field"><label for="profile-github">GitHub profile</label><input id="profile-github" type="url" name="githubUrl" value="${e(portfolio.profile.github_url || "")}"></div><button class="btn btn-primary" type="submit">Save profile</button></form></div><div class="panel">${panelHead("Daily goals")}<form id="goals-form">${Object.entries(
        goals.targets,
      )
        .map(
          ([name, value]) =>
            `<div class="field"><label for="goal-${name}">${e(name)}</label><input id="goal-${name}" name="${name}" type="number" min="1" max="20" value="${value}" required></div>`,
        )
        .join(
          "",
        )}<button class="btn btn-primary" type="submit">Save daily goals</button></form></div></div>`;
      const files = await api("/files");
      root.insertAdjacentHTML(
        "beforeend",
        `<div class="panel section-gap">${panelHead("My files", "PNG, JPEG, WebP or PDF; maximum 5 MB")}<form id="file-form"><div class="field"><label for="upload-file">Choose file</label><input id="upload-file" type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf" required></div><button class="btn btn-primary" type="submit">Upload file</button></form><div class="practice-list">${list(files, (file) => `<div class="practice-row"><span>▤</span><div><strong>${e(file.filename)}</strong><p>${Math.ceil(file.size / 1024)} KB</p><small>File ID: ${e(file.id)}</small></div>${button("Download", "download-file:" + file.id, "btn-quiet")}</div>`)}</div></div>`,
      );
    } else if (route === "history") {
      const rows = await api("/quiz-attempts");
      root.innerHTML = `${pageHeading("Assessment history", "Review scores and focus your next practice session.")}<div class="panel">${list(rows, (row) => `<div class="practice-row"><strong>${Number(row.percentage)}%</strong><div><h3>${e(row.title)}</h3><p>${row.score}/${row.max_score} · ${e(new Date(row.attempted_at).toLocaleString())}</p></div></div>`)}</div>`;
    } else if (route === "bookmarks") {
      const rows = await api("/bookmarks");
      root.innerHTML = `${pageHeading("Saved lessons", "Return to your reference notes.")}<div class="panel">${list(rows, (row) => `<div class="practice-row"><span>▤</span><h3>${e(row.title)}</h3><div>${button("Open", "lesson:" + row.lesson_id, "btn-quiet")}${button("Remove", "unbookmark:" + row.lesson_id, "btn-quiet")}</div></div>`)}</div>`;
    } else if (route === "search") {
      root.innerHTML = `${pageHeading("Campus search", "Find courses, lessons, practice problems, quizzes and interview questions.")}<form id="global-search-form" class="filters"><label for="global-search">Search</label><input id="global-search" name="q" minlength="2" maxlength="100" required value="${e(state.globalSearch || "")}"><button class="btn btn-primary" type="submit">Search</button></form><div id="search-results" class="panel"></div>`;
      if (state.globalSearch) {
        const rows = await api(
          "/search?q=" + encodeURIComponent(state.globalSearch),
        );
        root.querySelector("#search-results").innerHTML = list(
          rows,
          (row) =>
            `<div class="practice-row"><span>${e(row.kind)}</span><h3>${e(row.title)}</h3>${button("Open", row.kind === "quiz" ? `start-quiz:${row.id}:${row.parent_id}` : row.kind === "interview" ? "go:interview" : `${row.kind}:${row.id}`, "btn-quiet")}</div>`,
        );
      }
    }
    return true;
  }
  async function enrich(root) {
    if (state.route === "dashboard" && state.user) {
      const [recommendations, goals] = await Promise.all([
        api("/recommendations"),
        api("/goals"),
      ]);
      root.insertAdjacentHTML(
        "beforeend",
        `<div class="grid dashboard-grid section-gap"><div class="panel">${panelHead("Recommended next steps")}${list(recommendations, (item) => `<p><strong>${e(item.title)}</strong><br>${e(item.reason)} ${button("Explore", "course:" + item.id, "btn-quiet")}</p>`)}</div><div class="panel">${panelHead("Daily progress", "Unique learning milestones rewarded today", button("Edit goals", "go:settings", "btn-quiet"))}${[
          ["Lessons", "lesson_completed", "lessons"],
          ["Practice submissions", "practice_submitted", "problems"],
          ["Quizzes passed", "quiz_passed", "quizzes"],
        ]
          .map(
            ([label, reason, key]) =>
              `<p>${label}: ${goals.completed[reason] || 0} / ${goals.targets[key]}</p>`,
          )
          .join("")}</div></div>`,
      );
    }
    if (state.route === "lesson")
      root.insertAdjacentHTML(
        "beforeend",
        `<div class="section-gap">${button("Save lesson", "bookmark:" + state.currentLesson, "btn-secondary")}</div>`,
      );
    if (state.route === "interview")
      root.insertAdjacentHTML(
        "afterbegin",
        `<div class="filters">${button("Start mock interview", "mock-start", "btn-primary")}${button("Interview history", "mock-history", "btn-secondary")}</div>`,
      );
  }
  async function action(name) {
    if (name.startsWith("download-file:")) {
      const response = await fetch(
        "/api/files/" + encodeURIComponent(name.split(":")[1]),
        { headers: { Authorization: "Bearer " + state.token } },
      );
      if (!response.ok) throw new Error("Download unavailable");
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      const encoded = response.headers
        .get("content-disposition")
        ?.split("UTF-8''")[1];
      link.download = encoded ? decodeURIComponent(encoded) : "download";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    }
    if (name === "logout") {
      await api("/auth/logout", { method: "POST" });
      state.token = "";
      state.user = null;
      sessionStorage.removeItem("cc_token");
      navTo("home");
      return true;
    }
    if (name === "print-certificate") {
      window.print();
      return true;
    }
    if (name === "content-new") {
      await contentForm(state.adminEntity || "courses");
      return true;
    }
    if (name.startsWith("content-edit:")) {
      await contentForm(state.adminEntity || "courses", name.split(":")[1]);
      return true;
    }
    if (name.startsWith("content-archive:")) {
      if (
        confirm(
          "Archive this content? Existing student records will be retained.",
        )
      ) {
        await api(
          `/admin/content/${state.adminEntity || "courses"}/${name.split(":")[1]}`,
          { method: "DELETE" },
        );
        navTo("admin");
      }
      return true;
    }
    if (name === "admin-students") {
      const rows = await api("/admin/students");
      openModal(
        `${modalHeader("Student management")}${list(rows, (row) => `<div class="practice-row"><span>#${row.id}</span><div><strong>${e(row.name)}</strong><p>${e(row.email)} · ${row.xp} XP · ${row.enrollments} enrollments</p></div>${row.role === "student" ? button(row.disabled ? "Enable" : "Disable", `student-toggle:${row.id}:${!row.disabled}`, "btn-secondary") : "Administrator"}</div>`)}`,
      );
      return true;
    }
    if (name.startsWith("student-toggle:")) {
      const [, id, disabled] = name.split(":");
      await api("/admin/students/" + id, {
        method: "PATCH",
        body: JSON.stringify({ disabled: disabled === "true" }),
      });
      await action("admin-students");
      return true;
    }
    if (name === "admin-analytics") {
      const rows = await api("/admin/analytics");
      openModal(
        `${modalHeader("Course analytics")}${list(rows, (row) => `<p><strong>${e(row.title)}</strong><br>${row.enrollments} enrollments · ${row.quiz_attempts} quiz attempts · ${row.average_score ?? "—"}% average score</p>`)}`,
      );
      return true;
    }
    if (name.startsWith("bookmark:")) {
      await api("/bookmarks/" + name.split(":")[1], { method: "POST" });
      toast("Lesson saved.", "success");
      return true;
    }
    if (name.startsWith("unbookmark:")) {
      await api("/bookmarks/" + name.split(":")[1], { method: "DELETE" });
      navTo("bookmarks");
      return true;
    }
    if (name === "notifications") {
      const rows = await api("/notifications");
      openModal(
        `${modalHeader("Notifications")}${list(rows, (row) => `<div class="panel section-gap"><h3>${e(row.title)}</h3><p>${e(row.message)}</p>${row.read ? "Read" : button("Mark read", "notification:" + row.id, "btn-quiet")}</div>`)}`,
      );
      return true;
    }
    if (name.startsWith("notification:")) {
      await api("/notifications/" + name.split(":")[1], { method: "PATCH" });
      await action("notifications");
      return true;
    }
    if (name === "mock-history") {
      const rows = await api("/mock-interviews");
      openModal(
        `${modalHeader("Mock interview history")}<p>Scores are self-assessed.</p>${list(rows, (row) => `<p>${e(new Date(row.started_at).toLocaleString())} · ${row.score ?? "In progress"}${row.score != null ? "%" : ""}</p>`)}`,
      );
      return true;
    }
    if (name === "mock-start") {
      state.mock = await api("/mock-interviews", { method: "POST" });
      openModal(
        `${modalHeader("Mock interview")}<p>Answer each question, then compare against sample answers and self-assess.</p><form id="mock-answers-form">${state.mock.questions.map((q) => `<div class="field"><label for="mock-${q.id}">${e(q.category)}: ${e(q.question)}</label><textarea id="mock-${q.id}" name="${q.id}" required minlength="10" maxlength="10000"></textarea></div>`).join("")}<button class="btn btn-primary" type="submit">Review answers</button></form>`,
      );
      return true;
    }
    return false;
  }
  async function submit(form) {
    const supported = [
      "content-form",
      "profile-form",
      "goals-form",
      "global-search-form",
      "mock-answers-form",
      "mock-ratings-form",
      "file-form",
    ];
    if (!supported.includes(form.id)) return false;
    const raw = Object.fromEntries(new FormData(form));
    if (form.id === "file-form") {
      const file = form.querySelector('input[type="file"]').files[0];
      if (!file || file.size > 5242880)
        throw new Error("Choose a file up to 5 MB");
      await api("/files", {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) },
      });
      toast("File uploaded.", "success");
      navTo("settings");
    } else if (form.id === "content-form") {
      const entity = form.dataset.entity,
        body = {};
      for (const [key, type] of Object.entries(definitions[entity])) {
        const value = raw[key] ?? "";
        if (type === "number" || entities.includes(type))
          body[key] = Number(value);
        else if (type === "modules-optional")
          body[key] = value ? Number(value) : null;
        else if (key === "published") body[key] = value === "true";
        else if (type === "lines")
          body[key] = value
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
        else if (type === "answer")
          body[key] =
            raw.question_type === "multiple_answer"
              ? value
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
              : value;
        else if (type === "resources")
          body[key] = value
            .split("\n")
            .filter((x) => x.trim())
            .map((line) => {
              const [title, ...url] = line.split("|");
              return { title: title.trim(), url: url.join("|").trim() };
            });
        else if (type === "examples")
          body[key] = value
            .split("\n")
            .filter((x) => x.trim())
            .map((line) => {
              const [input, ...output] = line.split("|");
              return { input: input.trim(), output: output.join("|").trim() };
            });
        else if (type === "starter") body[key] = { javascript: value };
        else body[key] = value;
      }
      await api(
        "/admin/content/" +
          entity +
          (form.dataset.id ? "/" + form.dataset.id : ""),
        {
          method: form.dataset.id ? "PATCH" : "POST",
          body: JSON.stringify(body),
        },
      );
      closeModal();
      toast("Content saved.", "success");
      navTo("admin");
    } else if (form.id === "profile-form") {
      await api("/profile", { method: "PATCH", body: JSON.stringify(raw) });
      state.user.name = raw.name;
      toast("Profile saved.", "success");
      navTo("settings");
    } else if (form.id === "goals-form") {
      await api("/goals", {
        method: "PUT",
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(raw).map(([key, value]) => [key, Number(value)]),
          ),
        ),
      });
      toast("Goals saved.", "success");
    } else if (form.id === "global-search-form") {
      state.globalSearch = raw.q;
      navTo("search");
    } else if (form.id === "mock-answers-form") {
      state.mockAnswers = raw;
      const questions = await api(
        "/mock-interviews/" + state.mock.id + "/review",
      );
      openModal(
        `${modalHeader("Review and self-assess")}<form id="mock-ratings-form">${questions.map((q) => `<div class="field"><h3>${e(q.question)}</h3><p><strong>Your response:</strong> ${e(raw[q.id])}</p><p><strong>Sample answer:</strong> ${e(q.answer)}</p><label for="rating-${q.id}">Self-rating</label><select id="rating-${q.id}" name="${q.id}">${[1, 2, 3, 4, 5].map((x) => `<option value="${x}">${x} / 5</option>`).join("")}</select></div>`).join("")}<button class="btn btn-primary" type="submit">Complete interview</button></form>`,
      );
    } else if (form.id === "mock-ratings-form") {
      const ratings = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [key, Number(value)]),
      );
      const result = await api(
        "/mock-interviews/" + state.mock.id + "/complete",
        {
          method: "POST",
          body: JSON.stringify({ answers: state.mockAnswers, ratings }),
        },
      );
      openModal(
        `${modalHeader("Mock interview complete")}<h2>${result.score}% self-assessed score</h2><p>${result.xp_awarded} XP earned. ${result.weak_questions.length} answers need more practice.</p><p>Review low-rated topics in Interview Prep before trying again.</p>`,
      );
    }
    return true;
  }
  document.addEventListener("change", (event) => {
    if (event.target.id === "content-type") {
      state.adminEntity = event.target.value;
      navTo("admin");
    }
  });
  return { render, enrich, action, submit };
};
