(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const state = {
    token: sessionStorage.getItem("cc_token") || "",
    user: null,
    dashboard: null,
    courses: [],
    practice: [],
    projects: [],
    interviews: [],
    analytics: [],
    route: "home",
    authMode: "login",
    interviewCategory: "All",
    search: "",
    difficulty: "All",
    selectedCourse: sessionStorage.getItem("cc_course"),
    selectedQuiz: sessionStorage.getItem("cc_quiz"),
    currentLesson: sessionStorage.getItem("cc_lesson"),
    selectedProblem: sessionStorage.getItem("cc_problem"),
  };
  const labels = {
    home: "Welcome",
    dashboard: "My learning",
    courses: "My learning",
    course: "Course details",
    lesson: "Lesson",
    quiz: "Assessment",
    practice: "Practice arena",
    problem: "Coding problem",
    interview: "Mock tests & interview prep",
    projects: "Project lab",
    portfolio: "Portfolio",
    analytics: "Analytics",
    admin: "Admin dashboard",
    auth: "Sign in",
    leaderboard: "Leaderboard",
    settings: "Settings",
    history: "Assessment history",
    search: "Search",
    bookmarks: "Saved lessons",
    verify: "Certificate verification",
  };
  const e = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const initials = (name) =>
    String(name || "Guest")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0] || "")
      .join("")
      .toUpperCase() || "G";
  const num = (value) => Number(value || 0).toLocaleString();
  const pct = (value) => `${Math.max(0, Math.min(100, Number(value || 0)))}%`;
  const symbolClass = (index) =>
    ["symbol-purple", "symbol-mint", "symbol-amber", "symbol-blue"][index % 4];
  const bannerClass = (index) =>
    ["", "green-bg", "amber-bg", "blue-bg"][index % 4];
  const iconFor = (course = {}) => {
    const identity = `${course.slug || ""} ${course.title || ""} ${course.category || ""}`.toLowerCase();
    const svg = (paths) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${paths}</svg>`;
    if (/python/.test(identity)) return svg('<path d="M24 5c-8 0-8 3-8 7v5h11v2H12a6 6 0 0 0-6 6v5c0 4 3 7 8 7h4v-6c0-4 3-7 7-7h7c3 0 5-2 5-5v-7c0-4-4-7-8-7h-5Z" fill="#176bd7"/><circle cx="20" cy="10" r="1.5" fill="#fff"/><path d="M24 43c8 0 8-3 8-7v-5H21v-2h15a6 6 0 0 0 6-6v-5c0-4-3-7-8-7h-4v6c0 4-3 7-7 7h-7c-3 0-5 2-5 5v7c0 4 4 7 8 7h5Z" fill="#008f83"/><circle cx="28" cy="38" r="1.5" fill="#fff"/>');
    if (/database|dbms/.test(identity)) return svg('<ellipse cx="24" cy="11" rx="14" ry="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 11v24c0 3 6 6 14 6s14-3 14-6V11M10 22c0 3 6 6 14 6s14-3 14-6M10 33c0 3 6 6 14 6s14-3 14-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    if (/java/.test(identity)) return svg('<path d="M18 24h16v9a8 8 0 0 1-8 8h0a8 8 0 0 1-8-8v-9ZM34 26h3a4 4 0 0 1 0 8h-3M20 18c3-2-2-4 1-7M27 18c3-2-2-4 1-7M14 43h26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    if (/web development|web-development|html|javascript/.test(identity)) return svg('<rect x="6" y="8" width="36" height="31" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M6 16h36M12 12h1M17 12h1M22 12h1M24 20v14M17 27h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>');
    if (/operating system|operating-systems/.test(identity)) return svg('<rect x="7" y="8" width="34" height="25" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M4 39h40M18 33l-2 6M30 33l2 6M14 15h8v8h-8zM27 15h7M27 21h7M14 27h20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    if (/data structures|algorithm|\bdsa\b/.test(identity)) return svg('<path d="M24 12v10M24 22 12 34M24 22l12 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="9" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="10" cy="36" r="5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="38" cy="36" r="5" fill="none" stroke="currentColor" stroke-width="3"/>');
    return svg('<path d="M9 9h24a6 6 0 0 1 6 6v24H15a6 6 0 0 1-6-6V9ZM9 33a6 6 0 0 1 6-6h24M17 17h14M17 22h10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
  };
  const toast = (message, kind = "") => {
    const node = document.createElement("div");
    node.className = `toast ${kind}`;
    node.textContent = message;
    $("#toast-region").append(node);
    setTimeout(() => node.remove(), 3600);
  };
  async function api(path, options = {}) {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    };
    let response;
    try {
      response = await fetch(`/api${path}`, { ...options, headers });
    } catch {
      throw new Error(
        "Could not reach Cloud Campus API. Check that the backend is running.",
      );
    }
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok || payload.success === false) {
      if (response.status === 401 && state.token) {
        state.token = "";
        state.user = null;
        sessionStorage.removeItem("cc_token");
      }
      throw new Error(payload.message || `Request failed (${response.status})`);
    }
    return payload.data;
  }
  const setRoute = (route, extra = {}) => {
    Object.assign(state, extra);
    state.route = route;
    if (location.hash !== `#${route}`)
      history.replaceState(null, "", `#${route}`);
    render();
  };
  const navTo = (route) => {
    closeModal();
    sessionStorage.setItem("cc_course", state.selectedCourse || "");
    sessionStorage.setItem("cc_lesson", state.currentLesson || "");
    sessionStorage.setItem("cc_problem", state.selectedProblem || "");
    sessionStorage.setItem("cc_quiz", state.selectedQuiz || "");
    if (location.hash !== `#${route}`) location.hash = route;
    else {
      state.route = route;
      render();
    }
    $("#sidebar").classList.remove("open");
  };
  const pageHeading = (title, subtitle, actions = "") =>
    `<div class="page-heading"><div><div class="eyebrow">CLOUD CAMPUS / ${e(title)}</div><h1>${e(title)}</h1><p>${e(subtitle)}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</div>`;
  const empty = (title, detail, action = "") =>
    `<div class="empty-state"><strong>${e(title)}</strong>${e(detail)}${action ? `<div style="margin-top:14px">${action}</div>` : ""}</div>`;
  const button = (text, action, cls = "btn-primary", attrs = "") =>
    `<button class="btn ${cls}" data-action="${e(action)}" ${attrs}>${e(text)}</button>`;
  const panelHead = (title, subtitle = "", action = "") =>
    `<div class="panel-header"><div><h2>${e(title)}</h2>${subtitle ? `<p>${e(subtitle)}</p>` : ""}</div>${action}</div>`;
  const progressBar = (progress, green = false) =>
    `<div class="progress-track ${green ? "green" : ""}"><span style="width:${pct(progress)}"></span></div>`;
  const courseCard = (course, i = 0) =>
    `<article class="course-card"><div class="course-banner ${bannerClass(i)}"><span class="tag ${i % 3 === 1 ? "green" : i % 3 === 2 ? "amber" : ""}">${e(course.category || "General")}</span><span class="course-illustration">${iconFor(course)}</span></div><div class="course-card-body"><span class="tag gray">${e(course.difficulty || "Beginner")}</span><h3>${e(course.title)}</h3><p>${e(course.description || "Explore lessons, practice questions and assessments.")}</p><div class="card-meta"><span>▤ ${num(course.lesson_count || 0)} lessons</span><span>▦ ${num(course.module_count || 0)} modules</span></div><div class="card-bottom"><small>${course.enrolled ? `${pct(course.progress)} complete` : `${num(course.enrollment_count || 0)} learners`}</small>${button(course.enrolled ? "Continue →" : "Explore course →", `course:${course.id}`, "btn-quiet")}</div>${course.enrolled ? progressBar(course.progress || 0) : ""}</div></article>`;
  const loading = () =>
    '<div class="loading-state"><span class="spinner"></span><p>Loading your campus…</p></div>';
  async function ensureUser() {
    if (!state.token) return null;
    try {
      state.user = await api("/auth/me");
    } catch {
      state.user = null;
    }
    return state.user;
  }
  function syncUserChrome() {
    const name = state.user?.name || "Guest learner";
    const shell = $("#app-shell");
    if (shell) shell.classList.toggle("welcome-only", state.route === "home" && !state.user);
    const role =
      state.user?.role === "admin"
        ? "Campus administrator"
        : state.user
          ? "Student account"
          : "Sign in to sync progress";
    $("#sidebar-name").textContent = name;
    $("#sidebar-role").textContent = role;
    const adminLink = $("#admin-nav");
    if (adminLink) adminLink.hidden = state.user?.role !== "admin";
    $("#sidebar-avatar").textContent = initials(name);
    $("#top-avatar").textContent = initials(name);
    $("#top-name").textContent = state.user ? name.split(/\s+/)[0] : "Guest";
    $$(".nav-list a").forEach((a) =>
      a.classList.toggle(
        "active",
        a.dataset.route ===
          (state.route === "course" ||
          state.route === "lesson" ||
          state.route === "quiz"
            ? "courses"
            : state.route),
      ),
    );
    $("#page-label").textContent = labels[state.route] || "Overview";
  }
  let renderVersion = 0;
  async function render() {
    const version = ++renderVersion;
    syncUserChrome();
    const liveRoot = $("#app-content");
    const root = document.createElement("div");
    liveRoot.innerHTML = loading();
    try {
      if (await features.render(state.route, root)) {
        syncUserChrome();
        return;
      }
      switch (state.route) {
        case "home":
          await renderHome(root);
          break;
        case "auth":
          renderAuth(root);
          break;
        case "dashboard":
          await renderDashboard(root);
          break;
        case "courses":
          await renderCourses(root);
          break;
        case "course":
          await renderCourse(root);
          break;
        case "lesson":
          await renderLesson(root);
          break;
        case "quiz":
          await renderQuiz(root);
          break;
        case "practice":
          await renderPractice(root);
          break;
        case "problem":
          await renderProblem(root);
          break;
        case "interview":
          await renderInterview(root);
          break;
        case "projects":
          await renderProjects(root);
          break;
        case "analytics":
          await renderAnalytics(root);
          break;
        default:
          state.route = "dashboard";
          await renderDashboard(root);
      }
      await features.enrich(root);
    } catch (err) {
      root.innerHTML = `<div class="panel">${empty("Something went wrong", err.message, button("Try again", "refresh", "btn-secondary"))}</div>`;
    } finally {
      if (version === renderVersion) {
        liveRoot.replaceChildren(...root.childNodes);
        syncUserChrome();
      }
    }
  }
  async function renderHome(root) {
    const courses = await api("/courses").catch(() => []);
    state.courses = courses || [];
    const courseCount = state.courses.length;
    root.innerHTML = `<section class="welcome-splash"><img class="brand-lockup welcome-lockup" src="/assets/cloud-campus-lockup.png" alt="CloudCampus — Learn Beyond Limits"><h1>A place to learn, practice and grow.</h1><p>Build your Computer Science skills one clear lesson at a time.</p><div class="welcome-actions">${button("Register", "welcome-auth:register", "btn-primary")}${button("Login / Sign in", "welcome-auth:login", "btn-secondary")}</div><button class="welcome-explore" data-action="go:courses">Explore courses without an account <span>→</span></button></section><section class="home-courses"><div class="home-section-head"><div><div class="eyebrow">START LEARNING</div><h2>Courses</h2><p>Pick a subject and see its syllabus before you begin.</p></div><span class="course-count">${courseCount} courses</span></div><div class="course-grid grid">${courses.slice(0, 3).map(courseCard).join("") || empty("Courses are getting ready", "The course catalog will appear here once it is available.")}</div><div class="home-more">${button("See all courses →", "go:courses", "btn-secondary")}</div></section>`;
  }
  function renderAuth(root) {
    root.innerHTML = `<div class="auth-wrap"><div class="panel auth-card"><img class="brand-lockup auth-brand-lockup" src="/assets/cloud-campus-lockup.png" alt="CloudCampus — Learn Beyond Limits"><div class="eyebrow">YOUR STUDENT ACCOUNT</div><h2>${state.authMode === "login" ? "Pick up where you left off." : "Start building your future."}</h2><p>${state.authMode === "login" ? "Sign in to keep your learning progress in sync." : "Create a student account and start your learning journey."}</p><div class="auth-tabs"><button class="${state.authMode === "login" ? "active" : ""}" data-action="auth-mode:login">Sign in</button><button class="${state.authMode === "register" ? "active" : ""}" data-action="auth-mode:register">Create account</button></div><form id="auth-form">${state.authMode === "register" ? `<div class="field"><label for="auth-name">Full name</label><input id="auth-name" name="name" required minlength="2" maxlength="100" autocomplete="name" placeholder="Your name"></div>` : ""}<div class="field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com"></div><div class="field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" required minlength="${state.authMode === "register" ? "8" : "1"}" maxlength="72" autocomplete="${state.authMode === "login" ? "current-password" : "new-password"}" placeholder="${state.authMode === "register" ? "At least 8 characters" : "Enter your password"}"></div><button class="btn btn-primary full-width" type="submit">${state.authMode === "login" ? "Sign in to campus →" : "Create student account →"}</button></form><div style="margin-top:18px;text-align:center;font-size:10px;color:#9aa3b4">Use your account to track learning and portfolio evidence.</div></div></div>`;
  }
  async function renderDashboard(root) {
    if (!state.user && !(await ensureUser())) {
      root.innerHTML = `<div class="auth-wrap panel" style="padding:28px">${empty("Your campus is waiting", "Sign in or create a student account to track progress.", button("Sign in / Register", "go:auth"))}</div>`;
      return;
    }
    const d = await api("/dashboard");
    state.dashboard = d;
    const courses = d.courses || [];
    const xp = Number(d.xp || 0);
    const next =
      xp < 200
        ? 200
        : xp < 500
          ? 500
          : xp < 1000
            ? 1000
            : xp < 2000
              ? 2000
              : xp + 1000;
    const levelBase =
      xp < 200 ? 0 : xp < 500 ? 200 : xp < 1000 ? 500 : xp < 2000 ? 1000 : 2000;
    const encouragements = [
      "Every small step you take today builds the skills you will use tomorrow.",
      "You do not have to know everything yet. Keep learning, one idea at a time.",
      "Progress grows when you keep showing up. Your next lesson is a fresh start.",
      "Stay curious, keep practising, and give yourself credit for how far you have come.",
      "The effort you put into learning today opens doors for your future self.",
      "A challenging topic is just a skill you have not mastered yet. Keep going.",
    ];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    root.innerHTML = `<section class="welcome-banner dashboard-welcome" aria-labelledby="dashboard-welcome-heading"><div class="dashboard-hero-copy"><div class="eyebrow">YOUR LEARNING OVERVIEW</div><h1 id="dashboard-welcome-heading">Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${e((state.user.name || "learner").split(/\s+/)[0])}.</h1><p>Find your way forward. Keep building skills, one small step at a time.</p><div class="level-progress"><div class="progress-track"><span style="width:${pct(((xp - levelBase) / (next - levelBase)) * 100)}"></span></div><small><span>${e(d.level || "Beginner")} · ${num(xp)} XP</span><span>${num(Math.max(0, next - xp))} XP to next level</span></small></div><div class="welcome-actions">${button("Browse courses →", "go:courses", "btn-secondary")}${state.user.role === "admin" ? button("Admin tools", "go:admin", "btn-primary") : ""}</div></div><div class="dashboard-hero-visual"><img class="dashboard-hero-art" src="/assets/cloudcampus-learning-hero.svg" alt="A graduation cap floating above an open book, surrounded by clouds and stars" width="460" height="360" fetchpriority="high"></div></section><section class="daily-encouragement"><span class="encouragement-mark" aria-hidden="true">✦</span><div><div class="eyebrow">A NOTE FOR YOUR LEARNING JOURNEY</div><blockquote>“${e(encouragement)}”</blockquote><p>Take it one lesson at a time. You are making progress.</p></div></section><div class="stats-grid grid"><div class="stat-card"><div class="stat-top">Current streak <span class="stat-icon amber">✦</span></div><div class="stat-value">${num(d.streak?.current_streak)} <span style="font-size:13px;color:#8d96a8">days</span></div><div class="stat-foot">Longest: ${num(d.streak?.longest_streak)} days</div></div><div class="stat-card"><div class="stat-top">Experience points <span class="stat-icon purple">✧</span></div><div class="stat-value">${num(xp)} XP</div><div class="stat-foot">Level · ${e(d.level)}</div></div><div class="stat-card"><div class="stat-top">Enrolled courses <span class="stat-icon green">▤</span></div><div class="stat-value">${num(courses.length)}</div><div class="stat-foot">Your active learning paths</div></div><div class="stat-card"><div class="stat-top">Quiz attempts <span class="stat-icon blue">✓</span></div><div class="stat-value">${num(d.quizAttempts)}</div><div class="stat-foot">Every attempt is progress</div></div></div><div class="grid dashboard-grid"><div class="panel">${panelHead("Continue learning", "Pick up from where you left off", button("All courses →", "go:courses", "btn-secondary"))}<div class="course-list">${
      courses.length
        ? courses
            .slice(0, 4)
            .map(
              (c, i) =>
                `<div class="course-row"><div class="course-symbol ${symbolClass(i)}">${iconFor(c)}</div><div class="course-copy"><strong>${e(c.title)}</strong><small>${e(c.category || "Computer Science")} · ${Number(c.progress || 0) ? `${c.progress}% complete` : "Ready to begin"}</small>${progressBar(c.progress || 0, i % 2 === 1)}</div><span class="course-percent">${pct(c.progress || 0)}</span><button class="btn btn-quiet course-continue" data-action="course:${c.id}">${Number(c.progress || 0) ? "Continue" : "Start course"}</button></div>`,
            )
            .join("")
        : empty(
            "No enrolled courses yet",
            "Explore the catalog and enroll in a course.",
            button("Explore courses", "go:courses", "btn-quiet"),
          )
    }</div></div><div class="panel">${panelHead("Quick actions", "Make the next session count")}<div class="quick-grid"><button class="quick-link" data-action="go:practice"><span class="quick-icon">⌘</span><strong>Solve a problem</strong><small>Practice core CS skills</small></button><button class="quick-link" data-action="go:interview"><span class="quick-icon">◉</span><strong>Prep for interviews</strong><small>Review common questions</small></button><button class="quick-link" data-action="go:projects"><span class="quick-icon">▧</span><strong>Build a project</strong><small>Show what you can do</small></button><button class="quick-link" data-action="go:analytics"><span class="quick-icon">↗</span><strong>View analytics</strong><small>See recent activity</small></button></div></div></div>`;
  }
  async function renderCourses(root) {
    if (!state.courses.length) state.courses = await api("/courses");
    let list = state.courses;
    if (state.user) {
      const dashboard = await api("/dashboard").catch(() => null);
      const enrolled = new Map(
        (dashboard?.courses || []).map((c) => [String(c.id), c]),
      );
      list = list.map((c) =>
        enrolled.has(String(c.id))
          ? {
              ...c,
              enrolled: true,
              progress: enrolled.get(String(c.id)).progress,
            }
          : c,
      );
    }
    if (state.search)
      list = list.filter((c) =>
        `${c.title} ${c.description} ${c.category}`
          .toLowerCase()
          .includes(state.search.toLowerCase()),
      );
    if (state.difficulty !== "All")
      list = list.filter((c) => c.difficulty === state.difficulty);
    root.innerHTML = `${pageHeading("My learning", "Structured courses to strengthen your Computer Science foundations.", state.user ? "" : button("Sign in to save progress", "go:auth", "btn-secondary"))}<div class="filters"><div class="search-wrap"><span>⌕</span><input class="search-input" id="course-search" value="${e(state.search)}" placeholder="Search courses, topics…" aria-label="Search courses"></div><select class="filter-select" id="course-difficulty" aria-label="Filter by difficulty">${["All", "Beginner", "Intermediate", "Advanced"].map((x) => `<option ${state.difficulty === x ? "selected" : ""}>${x}</option>`).join("")}</select><span style="font-size:11px;color:#9aa3b4">${list.length} courses</span></div><div class="course-grid grid">${list.map(courseCard).join("") || empty("No matching courses", "Try another search or difficulty.")}</div>`;
  }
  async function renderCourse(root) {
    const id = state.selectedCourse;
    if (!id) {
      setRoute("courses");
      return;
    }
    const c = await api(`/courses/${encodeURIComponent(id)}`);
    state.courseDetail = c;
    const totalLessons = (c.modules || []).reduce(
      (n, m) => n + (m.lessons || []).length,
      0,
    );
    const totalMinutes = (c.modules || []).reduce(
      (n, m) => n + (m.lessons || []).reduce((sum, lesson) => sum + Number(lesson.estimated_minutes || 10), 0),
      0,
    );
    root.innerHTML = `${pageHeading("Course details", c.category || "Computer Science", button("← All courses", "go:courses", "btn-secondary"))}<div class="welcome-banner"><div><span class="tag">${e(c.difficulty)}</span><h1>${e(c.title)}</h1><p>${e(c.description)}</p><div class="level-progress"><small><span>${(c.modules || []).length} modules</span><span>${totalLessons} lessons</span><span>${totalMinutes} min total</span></small></div></div><div class="welcome-actions">${c.enrolled ? '<span class="tag green">✓ Enrolled</span>' : button(state.user ? "Enroll in course" : "Sign in to enroll", state.user ? "enroll-course" : "go:auth", "btn-primary")}</div></div><div class="grid course-detail-layout"><div class="panel">${panelHead("Course syllabus", c.enrolled ? "Open a lesson and read to the end; the software saves your progress automatically" : "Preview the modules and lesson topics before enrolling")}<div class="module-list">${(c.modules || []).map((m, i) => `<section class="module-item"><div class="module-head"><span class="module-number">${String(i + 1).padStart(2, "0")}</span><div><strong>${e(m.title)}</strong><small>${(m.lessons || []).length} lessons · Module ${i + 1}${m.description ? ` · ${e(m.description)}` : ""}</small></div></div><div class="lesson-list">${(m.lessons || []).map((l) => `<div class="lesson-item"><span class="lesson-state">▤</span><div class="lesson-copy"><strong>${e(l.title)}</strong><small>${num(l.estimated_minutes || 10)} min lesson</small></div>${c.enrolled ? `<button class="lesson-open" data-action="lesson:${l.id}">Read notes →</button>` : '<span class="tag gray">Enroll to read notes</span>'}</div>`).join("") || '<div class="empty-state">Lessons will appear here.</div>'}</div></section>`).join("") || empty("Curriculum coming soon", "The course has no modules yet.")}</div></div><aside class="panel">${panelHead("About this course")}<p style="font-size:12px;color:#7f899c;line-height:1.8">${e(c.description)}</p><div class="card-meta" style="justify-content:space-between;margin:17px 0"><span>Category</span><strong>${e(c.category)}</strong></div><div class="card-meta" style="justify-content:space-between;margin:17px 0"><span>Difficulty</span><strong>${e(c.difficulty)}</strong></div><div class="card-meta" style="justify-content:space-between;margin:17px 0"><span>Students enrolled</span><strong>${num(c.enrollment_count)}</strong></div>${c.enrolled ? button("Take a quiz →", `quiz-list:${c.id}`, "btn-primary full-width") : button(state.user ? "Enroll to read course notes" : "Sign in to enroll", state.user ? "enroll-course" : "go:auth", "btn-primary full-width")}<div style="margin-top:12px">${button("Browse practice arena", "go:practice", "btn-secondary full-width")}</div></aside></div>`;
  }
  async function renderLesson(root) {
    state.lessonAutoCompleteCleanup?.();
    state.lessonAutoCompleteCleanup = null;
    if (!state.currentLesson) {
      setRoute("courses");
      return;
    }
    const lesson = await api(
      `/lessons/${encodeURIComponent(state.currentLesson)}`,
    );
    state.lessonDetail = lesson;
    root.innerHTML = `${pageHeading("Lesson", `${lesson.course_title} / ${lesson.module_title}`, button("← Back to course", `course:${lesson.course_id}`, "btn-secondary"))}<div class="grid course-detail-layout"><article class="panel"><div class="eyebrow">LESSON ${num(lesson.lesson_order)}</div><h1 style="font:600 25px 'Space Grotesk',sans-serif;margin:8px 0 15px">${e(lesson.title)}</h1><div class="card-meta"><span>${num(lesson.estimated_minutes)} minutes</span><span id="lesson-state-label">${lesson.completed ? "✓ Completed" : "In progress"}</span></div><div class="lesson-content" data-lesson-notes style="margin-top:22px">${e(lesson.content || "Lesson content is being prepared.")}</div>${lesson.video_url && /^https?:\/\//i.test(lesson.video_url) ? `<p style="margin-top:20px"><a class="text-link" target="_blank" rel="noopener noreferrer" href="${e(lesson.video_url)}">Open learning resource ↗</a></p>` : ""}${
      Array.isArray(lesson.resources) && lesson.resources.length
        ? `<h3 class="section-title">Resources</h3>${lesson.resources
            .filter((r) => /^https?:\/\//i.test(r.url || ""))
            .map(
              (r) =>
                `<p><a class="text-link" href="${e(r.url || "#")}" target="_blank" rel="noopener noreferrer">${e(r.title || r.label || "Resource")} ↗</a></p>`,
            )
            .join("")}`
        : ""
    }<div style="border-top:1px solid var(--line);padding-top:18px;margin-top:24px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span id="lesson-completion-chip" class="tag ${lesson.completed ? "green" : "gray"}">${lesson.completed ? "✓ Topic completed · +10 XP" : "In progress"}</span><small id="lesson-auto-note" style="color:var(--muted)">${lesson.completed ? "Your progress is saved." : "This topic completes automatically after you read to the end of the notes."}</small></div></article><aside class="panel">${panelHead("Learning tip")}<p style="font-size:12px;color:#828da1;line-height:1.8">Work through the notes at your own pace. Your progress is saved automatically when you reach the end of the topic.</p>${button("Go to practice →", "go:practice", "btn-quiet full-width")}${button("View dashboard", "go:dashboard", "btn-secondary full-width", 'style="margin-top:9px"')}</aside></div>`;
    if (!lesson.completed && lesson.enrollment_id) {
      const startedAt = Date.now();
      let reachedEnd = false;
      let saved = false;
      let saving = false;
      const cleanup = () => {
        window.removeEventListener("scroll", checkEnd);
        clearInterval(autoMarkTimer);
      };
      const completeAutomatically = async () => {
        if (saved || saving || !reachedEnd || Date.now() - startedAt < 12000 || document.visibilityState !== "visible") return;
        saving = true;
        try {
          const result = await api(`/lessons/${state.currentLesson}/complete`, { method: "POST" });
          saved = true;
          cleanup();
          const chip = $("#lesson-completion-chip", root);
          const note = $("#lesson-auto-note", root);
          const stateLabel = $("#lesson-state-label", root);
          if (chip) { chip.className = "tag green"; chip.textContent = `✓ Topic completed · +${num(result.xp_awarded)} XP`; }
          if (note) note.textContent = "Your progress is saved.";
          if (stateLabel) stateLabel.textContent = "✓ Completed";
          toast(`Topic completed automatically. ${num(result.xp_awarded)} XP earned.`, "success");
        } catch (err) {
          saving = false;
          toast(err.message, "error");
        }
      };
      const checkEnd = () => {
        const notes = $("[data-lesson-notes]", root);
        if (!notes || state.route !== "lesson" || state.currentLesson !== String(lesson.id)) {
          cleanup();
          return;
        }
        reachedEnd ||= notes.getBoundingClientRect().bottom <= window.innerHeight + 40;
        completeAutomatically();
      };
      const autoMarkTimer = setInterval(checkEnd, 1000);
      state.lessonAutoCompleteCleanup = cleanup;
      window.addEventListener("scroll", checkEnd, { passive: true });
      setTimeout(checkEnd, 0);
    }
  }
  async function renderQuiz(root) {
    if (!state.selectedQuiz) {
      root.innerHTML = `<div class="panel">${empty("Choose an assessment", "Open a course and select its quiz to begin.", button("Browse courses", "go:courses"))}</div>`;
      return;
    }
    const q = await api(`/quizzes/${encodeURIComponent(state.selectedQuiz)}`);
    state.quizDetail = q;
    root.innerHTML = `${pageHeading("Assessment", q.title, button("← Back to course", `course:${state.selectedCourse}`, "btn-secondary"))}<form id="quiz-form"><div class="panel">${panelHead(q.title, `${q.questions.length} questions · ${e(q.difficulty)} · pass mark ${q.passing_percentage}%`)}${q.questions.map((item, i) => `<section class="quiz-question"><h3>${i + 1}. ${e(item.question_text)} <span class="tag gray">${num(item.points)} pt</span></h3>${(Array.isArray(item.options) ? item.options : []).map((opt, j) => `<label class="option-label"><input type="${item.question_type === "multiple_answer" ? "checkbox" : "radio"}" name="q_${item.id}" value="${e(opt)}" ${item.question_type === "multiple_answer" ? "" : "required"}> <span>${e(opt)}</span></label>`).join("") || `<div class="field"><input name="q_${item.id}" placeholder="Your answer" required></div>`}</section>`).join("")}<div style="display:flex;justify-content:flex-end;padding-top:20px">${button("Submit assessment →", "submit-quiz", "btn-primary", 'type="submit"')}</div></div></form>`;
  }
  async function renderPractice(root) {
    if (!state.user && !(await ensureUser())) {
      root.innerHTML = `<div class="panel">${empty("Sign in to practice", "Your submissions are associated with your student account.", button("Sign in", "go:auth"))}</div>`;
      return;
    }
    const params = new URLSearchParams();
    if (state.search) params.set("search", state.search);
    if (state.difficulty !== "All") params.set("difficulty", state.difficulty);
    const problems = await api(`/coding-problems?${params.toString()}`);
    state.practice = problems;
    root.innerHTML = `${pageHeading("Practice arena", "Solve deliberately. Save submissions. Build confidence.", button("Submission history", "submission-history", "btn-secondary"))}<div class="filters"><div class="search-wrap"><span>⌕</span><input class="search-input" id="practice-search" value="${e(state.search)}" placeholder="Search problems…"></div><select id="practice-difficulty" class="filter-select"><option ${state.difficulty === "All" ? "selected" : ""}>All</option><option ${state.difficulty === "Easy" ? "selected" : ""}>Easy</option><option ${state.difficulty === "Medium" ? "selected" : ""}>Medium</option><option ${state.difficulty === "Hard" ? "selected" : ""}>Hard</option></select><span style="font-size:11px;color:#9aa3b4">${problems.length} problems</span></div><div class="practice-list">${problems.map((p) => `<article class="practice-row"><div class="difficulty-dot ${p.difficulty === "Hard" ? "hard" : p.difficulty === "Medium" ? "medium" : ""}">${p.difficulty === "Easy" ? "✓" : p.difficulty === "Medium" ? "◈" : "▲"}</div><div><h3>${e(p.title)}</h3><p>${e(p.category)} · <span class="tag ${p.difficulty === "Easy" ? "green" : p.difficulty === "Medium" ? "amber" : "gray"}">${e(p.difficulty)}</span></p></div><div class="practice-meta"><span style="font-size:10px;color:#98a1b1">Code challenge</span>${button("Solve →", `problem:${p.id}`, "btn-quiet")}</div></article>`).join("") || empty("No problems found", "Try a different search or difficulty.")}</div><div class="notice" style="margin-top:18px">Submissions are saved for your history. Code is not executed on the API server; an isolated code runner is required for automated evaluation.</div>`;
  }
  async function renderProblem(root) {
    const id = state.selectedProblem;
    if (!id) {
      setRoute("practice");
      return;
    }
    const p = (
      state.practice.length ? state.practice : await api("/coding-problems")
    ).find((x) => String(x.id) === String(id));
    if (!p) {
      root.innerHTML = `<div class="panel">${empty("Problem not found", "Return to the practice catalog.", button("Back to practice", "go:practice"))}</div>`;
      return;
    }
    state.problemDetail = p;
    const starter = p.starter_code?.javascript || "";
    root.innerHTML = `${pageHeading("Coding problem", p.category, button("← Practice arena", "go:practice", "btn-secondary"))}<div class="grid course-detail-layout"><div class="panel"><div class="question-top"><span class="tag ${p.difficulty === "Easy" ? "green" : p.difficulty === "Medium" ? "amber" : "gray"}">${e(p.difficulty)}</span><span class="tag gray">${e(p.category)}</span></div><h1 style="font:600 24px 'Space Grotesk',sans-serif;margin:15px 0 8px">${e(p.title)}</h1><div class="lesson-content">${e(p.statement)}</div>${Array.isArray(p.examples) ? p.examples.map((x, i) => `<div style="background:#f7f8fb;border-radius:10px;padding:13px;margin-top:10px;font-size:11px"><strong>Example ${i + 1}</strong><p><b>Input:</b> ${e(x.input)}</p><p><b>Output:</b> ${e(x.output)}</p></div>`).join("") : ""}<h3 class="section-title">Constraints</h3><p style="font-size:12px;color:#7f899c">${e(p.constraints || "Consider edge cases and input size.")}</p></div><div class="panel"><form id="submission-form"><div class="panel-header"><div><h2>Your solution</h2><p>Submission is saved, not executed.</p></div></div><div class="field"><label for="code-language">Language</label><select id="code-language" name="language"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option><option value="c">C</option><option value="sql">SQL</option></select></div><div class="field"><label for="source-code">Code editor</label><textarea class="code-editor" id="source-code" name="code" maxlength="50000" required spellcheck="false" placeholder="Write your solution here…">${e(starter)}</textarea></div><button class="btn btn-primary full-width" type="submit">Save submission →</button></form></div></div>`;
  }
  async function renderInterview(root) {
    if (!state.user && !(await ensureUser())) {
      root.innerHTML = `<div class="panel">${empty("Sign in to prepare", "Track your interview preparation from your account.", button("Sign in", "go:auth"))}</div>`;
      return;
    }
    const q = await api("/interview-questions");
    state.interviews = q;
    const cats = ["All", ...new Set(q.map((x) => x.category))];
    const list =
      state.interviewCategory === "All"
        ? q
        : q.filter((x) => x.category === state.interviewCategory);
    root.innerHTML = `${pageHeading("Interview prep", "Practice concise explanations for technical and HR interviews.")}<div class="grid interview-layout"><aside class="panel">${panelHead("Categories")}<div class="category-list">${cats.map((c) => `<button data-action="interview-category:${e(c)}" class="${state.interviewCategory === c ? "active" : ""}">${e(c)} <span>${q.filter((x) => c === "All" || x.category === c).length}</span></button>`).join("")}</div></aside><div class="question-list">${list.map((item) => `<article class="question-card"><div class="question-top"><span class="tag">${e(item.category)}</span><span class="tag ${item.difficulty === "Advanced" ? "amber" : "gray"}">${e(item.difficulty)}</span></div><h3>${e(item.question)}</h3><button class="answer-toggle" data-action="toggle-answer:${item.id}">Reveal sample answer ↓</button><div class="answer-copy" id="answer-${item.id}" hidden>${e(item.answer || "Prepare an answer using a clear example and explain your reasoning.")}</div></article>`).join("") || empty("No questions in this category", "Choose another category.")}</div></div>`;
  }
  async function renderProjects(root) {
    if (!state.user && !(await ensureUser())) {
      root.innerHTML = `<div class="panel">${empty("Sign in to use Project Lab", "Submit projects to build your portfolio.", button("Sign in", "go:auth"))}</div>`;
      return;
    }
    const projects = await api("/projects");
    state.projects = projects;
    root.innerHTML = `${pageHeading("Project lab", "Build real artifacts. Document your work. Show what you can do.", button("My portfolio →", "go:portfolio", "btn-secondary"))}<div class="notice">Project submissions save your GitHub repository, live demo and project description. Use public HTTP(S) links only.</div><div class="project-grid grid">${projects.map((p, i) => `<article class="project-card"><div class="project-card-top"><span class="project-symbol">${i % 2 ? "◇" : "▧"}</span><span class="tag ${p.difficulty === "Intermediate" ? "amber" : "green"}">${e(p.difficulty)}</span></div><h3>${e(p.title)}</h3><p>${e(p.description)}</p><div class="chip-list">${(p.technologies || []).map((t) => `<span class="chip">${e(t)}</span>`).join("")}</div><div class="card-bottom"><small>${(p.requirements || []).length} requirements</small>${button("Submit project →", `submit-project:${p.id}`, "btn-quiet")}</div></article>`).join("") || empty("No projects yet", "Seed the database to load guided projects.")}</div>`;
  }
  async function renderAnalytics(root) {
    if (!state.user && !(await ensureUser())) {
      root.innerHTML = `<div class="panel">${empty("Sign in to view analytics", "Your learning activity is tracked to your account.", button("Sign in", "go:auth"))}</div>`;
      return;
    }
    const [d, rows] = await Promise.all([api("/dashboard"), api("/analytics")]);
    state.dashboard = d;
    state.analytics = rows;
    const byDay = new Map(
      rows.map((r) => [String(r.day).slice(0, 10), Number(r.activity || 0)]),
    );
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        key,
        label: date
          .toLocaleDateString(undefined, { weekday: "short" })
          .slice(0, 2),
        value: byDay.get(key) || 0,
      });
    }
    const max = Math.max(1, ...days.map((x) => x.value));
    root.innerHTML = `${pageHeading("Analytics", "Understand your consistency and learning momentum.", button("Refresh data", "refresh", "btn-secondary"))}<div class="stats-grid grid"><div class="stat-card"><div class="stat-top">Total experience <span class="stat-icon purple">✧</span></div><div class="stat-value">${num(d.xp)} XP</div><div class="stat-foot">${e(d.level)}</div></div><div class="stat-card"><div class="stat-top">Current streak <span class="stat-icon amber">✦</span></div><div class="stat-value">${num(d.streak?.current_streak)} days</div><div class="stat-foot">Longest ${num(d.streak?.longest_streak)} days</div></div><div class="stat-card"><div class="stat-top">Course progress <span class="stat-icon green">▤</span></div><div class="stat-value">${d.courses?.length ? Math.round(d.courses.reduce((s, c) => s + Number(c.progress || 0), 0) / d.courses.length) : 0}%</div><div class="stat-foot">Average across enrolled courses</div></div><div class="stat-card"><div class="stat-top">Quiz attempts <span class="stat-icon blue">✓</span></div><div class="stat-value">${num(d.quizAttempts)}</div><div class="stat-foot">Assessments submitted</div></div></div><div class="grid dashboard-grid"><div class="panel">${panelHead("Daily learning activity", "XP transactions over the last 14 days")}<div class="chart-bars">${days.map((x) => `<div class="chart-bar-col"><strong>${x.value || ""}</strong><div class="chart-bar" title="${x.value} activity points" style="height:${Math.max(3, (x.value / max) * 76)}%"></div><small>${x.label}</small></div>`).join("")}</div><div style="font-size:10px;color:#9aa3b4;margin-top:13px">Activity reflects XP transactions; days without transactions show zero.</div></div><div class="panel">${panelHead("Course progress", "Completed lessons vs. course curriculum")}<div class="course-list">${(d.courses || []).map((c, i) => `<div class="course-copy"><div style="display:flex;justify-content:space-between;gap:10px"><strong>${e(c.title)}</strong><small>${pct(c.progress)}</small></div>${progressBar(c.progress || 0, i % 2 === 1)}</div>`).join("") || empty("No course data yet", "Enroll in a course to see progress.")}</div></div></div>`;
  }
  function openModal(content) {
    $("#modal-content").innerHTML = content;
    if (!$("#modal").open) $("#modal").showModal();
  }
  function closeModal() {
    $("#modal").close();
  }
  function projectModal(id) {
    const p = state.projects.find((x) => String(x.id) === String(id));
    if (!p) return;
    openModal(
      `<div class="modal-header"><div><div class="eyebrow">PROJECT SUBMISSION</div><h2>${e(p.title)}</h2><p>Share the repository and demo for review.</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div><div class="notice"><h3>Project requirements</h3><p>${e(p.description)}</p><ul>${(Array.isArray(p.requirements) ? p.requirements : []).map((item) => `<li>${e(item)}</li>`).join("")}</ul>${p.milestones?.length ? `<h3>Milestones</h3><ol>${p.milestones.map((item) => `<li>${e(item)}</li>`).join("")}</ol>` : ""}</div><form id="project-form" data-project-id="${e(id)}"><div class="field"><label for="github-url">GitHub repository URL</label><input id="github-url" name="githubUrl" type="url" placeholder="https://github.com/you/project"></div><div class="field"><label for="demo-url">Live demo URL</label><input id="demo-url" name="liveDemoUrl" type="url" placeholder="https://your-demo.example"></div><div class="field"><label for="project-description">What did you build?</label><textarea id="project-description" name="description" maxlength="10000" placeholder="Summarize your approach, decisions and what you learned."></textarea></div><div class="field"><label for="project-technologies">Technologies (comma-separated)</label><input id="project-technologies" name="technologies" placeholder="JavaScript, Node.js, PostgreSQL"></div><button class="btn btn-primary full-width" type="submit">Save project submission →</button></form>`,
    );
  }
  const features = window.CampusFeatures({
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
  });
  async function handleAction(action) {
    if (await features.action(action)) return;
    if (action.startsWith("go:")) {
      const route = action.slice(3);
      state.search = "";
      state.difficulty = "All";
      navTo(route);
      return;
    }
    if (action.startsWith("course:")) {
      const id = action.slice(7);
      state.selectedCourse = id;
      state.selectedQuiz = null;
      navTo("course");
      return;
    }
    if (action.startsWith("lesson:")) {
      state.currentLesson = action.slice(7);
      navTo("lesson");
      return;
    }
    if (action.startsWith("problem:")) {
      state.selectedProblem = action.slice(8);
      navTo("problem");
      return;
    }
    if (action.startsWith("quiz-list:")) {
      const courseId = action.slice(10);
      const quizzes = await api(
        `/courses/${encodeURIComponent(courseId)}/quizzes`,
      );
      if (!quizzes.length) {
        toast("No quizzes have been added to this course yet.");
        return;
      }
      openModal(
        `<div class="modal-header"><div><div class="eyebrow">COURSE ASSESSMENTS</div><h2>Choose a quiz</h2><p>Assess your understanding and earn XP for a passing score.</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="practice-list">${quizzes.map((q) => `<div class="practice-row"><div class="difficulty-dot">✓</div><div><h3>${e(q.title)}</h3><p>${e(q.difficulty)} · Pass mark ${q.passing_percentage}%</p></div><div>${button("Start →", `start-quiz:${q.id}:${courseId}`, "btn-quiet")}</div></div>`).join("")}</div>`,
      );
      return;
    }
    if (action.startsWith("start-quiz:")) {
      const parts = action.split(":");
      state.selectedQuiz = parts[1];
      state.selectedCourse = parts[2];
      closeModal();
      navTo("quiz");
      return;
    }
    if (action.startsWith("welcome-auth:")) {
      state.authMode = action.slice("welcome-auth:".length);
      navTo("auth");
      return;
    }
    if (action.startsWith("auth-mode:")) {
      state.authMode = action.slice(10);
      render();
      return;
    }
    if (action.startsWith("interview-category:")) {
      state.interviewCategory = action.slice(19);
      render();
      return;
    }
    if (action.startsWith("toggle-answer:")) {
      const el = $(`#answer-${CSS.escape(action.slice(14))}`);
      if (el) {
        el.hidden = !el.hidden;
      }
      return;
    }
    if (action.startsWith("submit-project:")) {
      if (!state.user) {
        navTo("auth");
        return;
      }
      projectModal(action.slice(15));
      return;
    }
    switch (action) {
      case "enroll-course":
        await api(`/courses/${state.selectedCourse}/enroll`, {
          method: "POST",
        });
        toast("Course enrolled.", "success");
        await render();
        break;
      case "refresh":
        await render();
        break;
      case "close-modal":
        closeModal();
        break;
      case "noop":
        break;
      case "sidebar-profile":
        navTo(state.user ? "portfolio" : "auth");
        break;
      case "complete-lesson": {
        const lesson = await api(`/lessons/${state.currentLesson}/complete`, {
          method: "POST",
        });
        toast(`Lesson completed. ${lesson.xp_awarded} XP earned.`, "success");
        await render();
        break;
      }
      case "submission-history": {
        const history = await api("/submissions");
        openModal(
          `<div class="modal-header"><div><div class="eyebrow">PRACTICE ARENA</div><h2>Submission history</h2><p>Your latest saved code submissions.</p></div><button class="modal-close" data-action="close-modal">×</button></div>${history.length ? `<div class="practice-list">${history.map((s) => `<div class="practice-row"><div class="difficulty-dot">⌘</div><div><h3>${e(s.problem_title)}</h3><p>${e(s.language)} · ${e(s.status)} · ${e(new Date(s.created_at).toLocaleString())}</p></div></div>`).join("")}</div>` : empty("No submissions yet", "Solve a problem and save your first submission.")}`,
        );
        break;
      }
      default:
        break;
    }
  }
  document.addEventListener("click", async (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    try {
      await handleAction(action);
    } catch (err) {
      toast(err.message, "error");
    }
  });
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (
      ![
        "auth-form",
        "quiz-form",
        "submission-form",
        "project-form",
        "content-form",
        "profile-form",
        "goals-form",
        "global-search-form",
        "mock-answers-form",
        "mock-ratings-form",
        "file-form",
      ].includes(form.id)
    )
      return;
    event.preventDefault();
    const submit = $('button[type="submit"]', form);
    if (submit) {
      submit.disabled = true;
      submit.dataset.original = submit.textContent;
      submit.textContent = "Working…";
    }
    try {
      if (await features.submit(form)) return;
      if (form.id === "auth-form") {
        const body = Object.fromEntries(new FormData(form).entries());
        const mode = state.authMode;
        const data = await api(
          `/auth/${mode === "login" ? "login" : "register"}`,
          { method: "POST", body: JSON.stringify(body) },
        );
        state.token = data.token;
        sessionStorage.setItem("cc_token", state.token);
        state.user = data.user;
        toast(
          mode === "login"
            ? "Signed in successfully."
            : "Student account created.",
          "success",
        );
        navTo("dashboard");
      } else if (form.id === "quiz-form") {
        const answers = {};
        for (const item of state.quizDetail.questions) {
          const selected = $(`[name="q_${item.id}"]:checked`, form);
          const text = $(`[name="q_${item.id}"]`, form);
          answers[item.id] =
            item.question_type === "multiple_answer"
              ? $$(`[name="q_${item.id}"]:checked`, form).map(
                  (input) => input.value,
                )
              : selected
                ? selected.value
                : text?.value || "";
        }
        const result = await api(`/quizzes/${state.selectedQuiz}/submit`, {
          method: "POST",
          body: JSON.stringify({ answers }),
        });
        openModal(
          `<div class="result-banner"><div class="eyebrow">ASSESSMENT COMPLETE</div><div class="result-score">${num(result.percentage)}%</div><h2>${result.passed ? "Passed — well done." : "Keep practicing."}</h2><p>You scored ${num(result.score)} out of ${num(result.max_score)} points.${result.xp_awarded ? ` ${result.xp_awarded} XP earned.` : ""}</p><div style="margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${button("Back to course", `course:${state.selectedCourse}`, "btn-primary")}${button("Dashboard", "go:dashboard", "btn-secondary")}</div></div>`,
        );
        toast("Assessment submitted.", "success");
      } else if (form.id === "submission-form") {
        const body = Object.fromEntries(new FormData(form).entries());
        body.problemId = state.selectedProblem;
        const result = await api("/submissions", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast(
          result.status === "stored"
            ? "Submission saved to your history."
            : "Submission saved.",
          "success",
        );
        navTo("practice");
      } else if (form.id === "project-form") {
        const body = Object.fromEntries(new FormData(form).entries());
        body.technologies = String(body.technologies || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const result = await api(`/projects/${form.dataset.projectId}/submit`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        closeModal();
        toast("Project submission saved.", "success");
        navTo("portfolio");
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      if (submit && submit.isConnected) {
        submit.disabled = false;
        submit.textContent = submit.dataset.original || "Submit";
      }
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.id === "course-search") {
      state.search = event.target.value;
      const cursor = event.target.selectionStart;
      render()
        .then(() => {
          const input = $("#course-search");
          if (input) {
            input.focus();
            input.setSelectionRange(cursor, cursor);
          }
        })
        .catch((err) => toast(err.message, "error"));
    }
    if (event.target.id === "practice-search") {
      state.search = event.target.value;
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(
        () => render().catch((err) => toast(err.message, "error")),
        250,
      );
    }
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "course-difficulty") {
      state.difficulty = event.target.value;
      render().catch((err) => toast(err.message, "error"));
    }
    if (event.target.id === "practice-difficulty") {
      state.difficulty = event.target.value;
      render().catch((err) => toast(err.message, "error"));
    }
  });
  window.addEventListener("hashchange", () => {
    $("#sidebar").classList.remove("open");
    const hash = location.hash.slice(1) || "home";
    const route = hash.split("/")[0];
    state.certificateId = hash.split("/")[1];
    state.route = route;
    state.search = "";
    state.difficulty = "All";
    render().catch((err) => toast(err.message, "error"));
  });
  $("#mobile-menu").addEventListener("click", () =>
    $("#sidebar").classList.toggle("open"),
  );
  $("#sidebar-profile").addEventListener("click", () =>
    navTo(state.user ? "portfolio" : "auth"),
  );
  $("#top-user").addEventListener("click", () =>
    navTo(state.user ? "portfolio" : "auth"),
  );
  $("#notifications-btn").addEventListener("click", () =>
    features
      .action("notifications")
      .catch((error) => toast(error.message, "error")),
  );
  $("#modal").addEventListener("click", (event) => {
    if (event.target === $("#modal")) closeModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  async function boot() {
    await ensureUser();
    const hash = location.hash.slice(1);
    state.route = hash.split("/")[0] || (state.user ? "dashboard" : "home");
    state.certificateId = hash.split("/")[1];
    if (!labels[state.route]) state.route = "home";
    render().catch((err) => toast(err.message, "error"));
  }
  boot();
})();


