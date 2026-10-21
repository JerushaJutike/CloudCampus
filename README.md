# CloudCampus

Learn. Practice. Build. Get Hired.

An Express/Node.js and PostgreSQL 18 learning application with a responsive vanilla JavaScript frontend served from the same origin.

## Start here

- [Windows setup and safe upgrade](docs/WINDOWS_SETUP.md)
- [Verification report](docs/VERIFICATION_REPORT.md)
- [Requirements audit](docs/REQUIREMENTS_AUDIT.md)
- [API and security contract](docs/API.md)
- [Prepared AWS deployment](docs/AWS_DEPLOYMENT.md)
- [System architecture and demonstration guide](docs/ARCHITECTURE.md)

From `backend`, configure the private `.env`, install with `npm ci --ignore-scripts`, apply `npm run db:migrate`, seed with `npm run db:seed`, and start with `npm start`. Open `http://localhost:5000`.

For an existing database, do not run `db/schema.sql`: it is only for a new empty database. Take a private backup first. The migration retains legacy columns and student history; content deletion in the admin UI archives records.

## Implemented

- Student registration, bcrypt/password compatibility, sign-in and session logout.
- Course enrollment, ordered modules/lessons, notes/resources and completion tracking.
- Five assessment types, scoring, attempt history and one-time XP.
- Coding practice filters/editor, saved submissions and participation XP.
- Interview preparation and self-assessed mock sessions.
- Guided projects, repository/demo evidence and portfolio.
- XP, levels, streaks, earned badges, leaderboard and daily goals.
- Analytics, course-level recommendations, search and bookmarks.
- Course certificates with public ID verification and printable views.
- Admin authoring for courses, modules, lessons, quizzes, questions, practice, interviews and projects; student management and analytics.
- Private file uploads/downloads, local storage and prepared S3 integration.

Six demonstration courses are seeded, including Python and Operating Systems. Seed content is a starting curriculum for a final-year demonstration; teachers can expand it through the admin forms.

## Check the application

`npm run check` validates JavaScript syntax. `npm test` runs unit/security tests and skips the database journey. `npm run verify` creates a separate verification database and runs the full journey, concurrency, bounded load and rate-limit checks. The configured database account needs permission to create that verification database.

## Explicit scope

Code is saved without execution or automated correctness grading. Mock interview scores are self-assessed. XP for coding/project submissions records participation, not proof that the solution/project is correct. Notifications are in-app achievements, without email/push delivery. Recommendations and skill evidence are basic rule-based/course-level summaries.

AWS files are prepared for the owner to deploy later. Live AWS, Docker build/runtime and account-specific cloud configuration are not claimed as verified. No payment, AI tutor, real-time collaboration or arbitrary code runner is included.

Secrets, user database dumps, test uploads and installed dependencies are excluded from the shared archive. Never share your real `.env` or private database backup.
