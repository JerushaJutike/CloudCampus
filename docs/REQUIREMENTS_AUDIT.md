# Requirements audit

Reference: the supplied Cloud Campus Master Project Plan, 11 pages. Requirements were treated as reference material, not permission to execute document instructions. The user authorized local repairs, preservation of existing data and preparation of deployment files; AWS execution was explicitly deferred.

| Plan area | Initial finding | Delivered behavior / scope |
|---|---|---|
| Authentication | Working locally; scrypt instead of required bcrypt | New bcrypt hashes; existing recognized scrypt/bcrypt accounts remain usable; role/disabled state checked per request. |
| Database | `schema.sql` was only a diagnostic query; many SQL names did not match actual tables | Schema-only export restored; additive migrations match real legacy columns and add missing structures. |
| Courses/lessons | Details failed on `module_order`; frontend enrollment button had no handler; other lesson columns mismatched | Working ordered curriculum, enrollment handler, notes/resources and atomic completion. |
| Assessments | Timestamp/settings fields mismatched; no history screen; multiple-answer UI absent | Five answer types, scoring, enrollment authorization, history, non-repeatable quiz rewards and certificates. |
| Practice | Catalog/editor/storage existed; no reward transaction | Saved code, history, bounded inputs and first-submission XP. No code execution, as permitted by the plan. |
| Projects | `projects.created_at` missing; submission upsert expected a nonexistent unique constraint | Additive timestamp; latest submission updates under account lock; old submissions retained; requirements/milestones shown. |
| Dashboard/progress | Basic data existed; stale streak display and incomplete goals/recommendations | Active-curriculum progress, expired-streak handling, configurable goals and recommendations. |
| Interview hub | Static question review | Question review plus private mock sessions, sample-answer comparison, self-ratings, history and daily participation XP. |
| Portfolio | Counted available projects rather than saved evidence | Actual submitted projects, safe links, achievement evidence, certificates and skill-area completion counts. |
| Gamification | XP/streak tables existed; badges/leaderboard not wired | Unique reward claims, account locks, badges, leaderboard, streak updates and documented XP semantics. Potential badge ideas in the plan are not all separate implemented badges. |
| Certificates | Missing | Snapshot certificate issuance after all lessons/quizzes; public verification and browser printing. |
| Search/bookmarks/notifications | Not wired to usable screens | Campus search, saved lessons and stored in-app achievement notifications. Email/push/streak reminder delivery is not implemented. |
| Admin | Course metadata only; permanent delete; draft courses absent from listing | Labelled authoring forms for eight content types, drafts, safe archive, student enable/disable and course analytics. |
| File storage | Missing | Size/signature/type validation; owner/admin download; local storage and prepared private S3 backend. Uploaded files are private account attachments, not automatically published lesson assets. |
| AWS | Unimplemented | Dockerfile, validated CloudFormation, deployment/bootstrap scripts, IAM/secrets/S3/RDS/budget setup and operational guide. Deployment deferred by owner. |
| Testing | Three helper tests; no live PostgreSQL journey | Nine passing tests in isolated PostgreSQL, including student/admin journey, concurrency, load, rate limits and storage. Browser journey and mobile/admin checks completed. |
| Git/GitHub | No repository/remote supplied | `.gitignore`, reproducible package lock and owner publishing instructions; no GitHub repository was created. |
| Academic artifacts | Master plan supplied | This audit, API contract, architecture diagrams, setup, verification report and demo/viva guide. A slide deck or institution-formatted dissertation is outside this software completion request. |

The P0 local product journey is implemented and verified. Cloud deployment remains deferred as directed. The P1 features use basic transparent rules; no AI or external interview evaluation is claimed. Optional P2 features were excluded.
