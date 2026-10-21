# API contract and implementation notes

All JSON responses use `success`, optional `data`, and an error `message`. Protected calls require `Authorization: Bearer <token>`. Secrets, password hashes and quiz answer keys are omitted from student responses.

## Error responses

| Status | Meaning |
|---|---|
| 400 | Invalid input, malformed JSON, unsupported URL/type or invalid relationship |
| 401 | Missing/expired token, disabled account or incorrect login |
| 403 | Missing enrollment, insufficient role or rejected origin |
| 404 | Missing/unavailable content or file |
| 409 | Duplicate account/slug, already-completed mock or unavailable assessment content |
| 413 | Request/upload exceeds its size limit |
| 429 | Rate limit reached |
| 500 / 503 | Unexpected failure or unavailable database/storage; internal detail is not sent to clients |

## Authentication and learning

| Method | Route | Input / result |
|---|---|---|
| POST | `/api/auth/register` | `{name,email,password}`; student identity and token. Name 2–100 chars, email max 254, password at least 8 chars and max 72 UTF-8 bytes. Client roles ignored. |
| POST | `/api/auth/login` | `{email,password}`; identity/token. Existing scrypt accounts upgrade after a successful supported-password login. |
| GET | `/api/auth/me` | Current identity; protected. |
| POST | `/api/auth/logout` | Client removes its session token. This does not revoke a copied token; tokens expire after seven days. |
| GET | `/api/courses` | Public published, active course catalog and counts. |
| GET | `/api/courses/:id` | Protected course/modules/lessons; indicates enrollment. |
| POST | `/api/courses/:id/enroll` | Protected, idempotent enrollment. |
| GET | `/api/courses/:id/quizzes` | Protected course quiz catalog. |
| GET | `/api/lessons/:id` | Enrolled account; content, resources, completion state. |
| POST | `/api/lessons/:id/complete` | Enrolled account; saved progress and `xp_awarded`. Transaction includes unique reward claim, streak and certificate check. |
| GET | `/api/quizzes/:id` | Enrolled account; questions without answer keys. |
| POST | `/api/quizzes/:id/submit` | `{answers:{"questionId": answer}}`; score, percentage, passed, `xp_awarded`. Arrays for multiple answers; exact text case for code-output questions. |
| GET | `/api/questions?quizId=ID` | Questions accessible through the student's enrollments; no keys. |
| GET | `/api/quiz-attempts` | Current account's latest 100 scored attempts. |

IDs must be positive PostgreSQL integers; unknown question IDs and malformed answer values are rejected. Scores use question points. A passing quiz awards XP once per user/quiz; repeat attempts remain in history. Certificates require every active lesson to be completed and every active course quiz to be passed.

## Practice, projects and career

| Method | Route | Input / result |
|---|---|---|
| GET | `/api/coding-problems` | Filters: `difficulty`, `category`, `search`; active catalog. Alias `/api/practice/problems`. |
| POST | `/api/submissions` | `{problemId,language,code}`; code max 50,000 chars; saved submission and one-time participation XP. Alias `/api/practice/submissions`. |
| GET | `/api/submissions` | Current account's latest 100 submissions. |
| GET | `/api/interview-questions` | Optional `category`; question/answer preparation material. |
| GET | `/api/projects` | Guided descriptions, requirements, technologies and milestones. |
| POST | `/api/projects/:id/submit` | `{githubUrl,liveDemoUrl,description,technologies}`. At least one HTTP(S) evidence link, GitHub host for repository URL, description 10–10,000 chars, up to 30 technology names. Edits latest submission and retains older rows. |
| POST | `/api/mock-interviews` | Start a private 5-question session where content permits. |
| GET | `/api/mock-interviews/:uuid/review` | Session owner's questions and sample answers. |
| POST | `/api/mock-interviews/:uuid/complete` | `{answers:{id:text},ratings:{id:1..5}}`; self-assessed percentage and weak-question IDs. One-time completion, max one rewarded interview per UTC day. |
| GET | `/api/mock-interviews` | Current account's latest 50 sessions. |

Languages: JavaScript, Python, Java, C++, C and SQL (API codes `javascript,python,java,cpp,c,sql`). Submitted code is stored without execution or correctness grading. XP rewards evidence/participation: lesson 10, first quiz pass 25, first problem submission 50, first project submission 200, first daily mock 100. There is no automatic validation that a linked GitHub project is complete.

## Progress, profile and discovery

| Method | Route | Input / result |
|---|---|---|
| GET | `/api/dashboard` | Profile, XP/level, valid current streak, attempt count and enrolled course progress. |
| GET | `/api/analytics` | Daily XP transaction counts for 30 days; UI displays the last 14. |
| GET | `/api/recommendations` | Courses with average quiz scores below 60%, or unexplored courses. Rule-based, course-level recommendations. |
| GET | `/api/portfolio` | Current profile, all submitted project evidence, badges, skill-area lesson counts and certificates. |
| GET | `/api/leaderboard` | Top 50 active students by XP; public names only within the authenticated campus. |
| GET | `/api/certificates/:uuid/verify` | Public certificate ID, stored student/course names and issue date. UI supports printing. |
| PATCH | `/api/profile` | `{name,bio,githubUrl}`; bio max 2,000 chars. |
| GET / PUT | `/api/goals` | Targets plus today's rewarded milestones; update `{lessons,problems,quizzes}`, each integer 1–20. |
| GET | `/api/search?q=text` | 2–100 chars; up to 50 matching active courses, lessons, problems, quizzes and interview questions. |
| GET | `/api/notifications` | Latest 100 stored in-app achievement notifications. No email/push delivery. |
| PATCH | `/api/notifications/:id` | Mark only current account's notification read. |
| GET | `/api/bookmarks` | Current account's saved active lessons. |
| POST / DELETE | `/api/bookmarks/:lessonId` | Add/remove a bookmark; adding requires enrollment. |

## File storage

`POST /api/files` takes a raw body with an exact supported `Content-Type` and optional `X-File-Name`. It validates size (1 byte–5 MB) and the file signature for PNG, JPEG, WebP or PDF. `GET /api/files` lists the owner's latest 100 uploads. `GET /api/files/:uuid` downloads only for the owner or an administrator, with an attachment disposition and no-cache policy. Signature checks are not malware scanning.

Development stores files under `backend/data/uploads` (or `STORAGE_DIR`). Production requires `S3_BUCKET` and `AWS_REGION` and uses its IAM role. No bucket object is made public; credentials stay in environment/Secrets Manager. Storage failures return 503. The UI exposes file upload/download in Profile & Settings.

## Administration

Every `/api/admin/*` route requires an active administrator, verified against the database on every request.

- `GET /stats`: platform counts.
- `GET /students`: account metadata and enrollment/XP totals; no hashes.
- `PATCH /students/:id` with `{disabled:boolean}`: enable/disable a student; cannot disable self or another administrator.
- `GET /analytics`: course enrollment and assessment totals/average scores.
- `GET/POST /content/:entity`, `PATCH/DELETE /content/:entity/:id`: content listing, creation, update and archive. `DELETE` archives and retains student history.
- `/courses` provides compatible aliases for course management.

Entities: `courses,modules,lessons,quizzes,questions,coding-problems,interview-questions,projects`. Fields are allowlisted in `contentController.js`; unrecognized fields are rejected. Parent IDs, bounded text, enums, integer ranges, URL protocols, resource/example shapes and quiz-option membership are validated. The UI offers labelled forms for all entities. Supported question types: `mcq,true_false,multiple_answer,code_output,scenario`.

Archived courses/curriculum are unavailable to students. Historical attempts, XP, submissions and certificates remain. Certificate names are snapshots taken at issuance; subsequent profile/course edits do not rewrite issued certificates.

## Architecture and operations

Routes call controllers/services; database values are parameterized. Transactions cover registration, completion/rewards, scoring/rewards, practice/rewards and project/rewards. Unique `reward_claims` plus per-user row locks prevent duplicated XP under concurrency. Legacy reward metadata is recognized during migration.

Passwords use bcrypt with cost 12; recognized scrypt hashes remain verifiable. CORS allows the current server origin and explicit configured origins. Bearer tokens live in browser session storage, so cookie-based CSRF is not the authentication model. Helmet supplies security headers, request limits apply, and logged errors omit request bodies/credentials. SSL certificate verification is enabled for remote PostgreSQL.

`GET /api/health` indicates process liveness; `GET /api/ready` verifies the latest migration against the database. The server shuts down on SIGINT/SIGTERM and closes its connection pool. Database queries have a 15-second statement timeout. Production requires a JWT secret of at least 32 characters.
