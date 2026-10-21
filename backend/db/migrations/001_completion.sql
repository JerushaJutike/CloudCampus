-- Additive migration for the existing CloudCampus PostgreSQL 18 database.
-- Retains legacy columns, IDs, timestamps, submissions and student history.
BEGIN;
SELECT pg_advisory_xact_lock(684231001);
SET LOCAL lock_timeout = '10s';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS resources jsonb NOT NULL DEFAULT '[]';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS module_id integer REFERENCES modules(id);
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS passing_percentage integer NOT NULL DEFAULT 60 CHECK (passing_percentage BETWEEN 1 AND 100);
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_order integer NOT NULL DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation text NOT NULL DEFAULT '';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}';
ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS starter_code jsonb NOT NULL DEFAULT '{}';
ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS milestones jsonb NOT NULL DEFAULT '[]';
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS coding_problems_slug_unique ON coding_problems(slug);
CREATE UNIQUE INDEX IF NOT EXISTS achievements_code_unique ON achievements(code);
CREATE INDEX IF NOT EXISTS modules_course_idx ON modules(course_id);
CREATE INDEX IF NOT EXISTS lessons_module_idx ON lessons(module_id);
CREATE INDEX IF NOT EXISTS quizzes_course_idx ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS questions_quiz_idx ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS xp_user_idx ON xp_transactions(user_id,created_at);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON quiz_attempts(user_id,quiz_id);
CREATE INDEX IF NOT EXISTS project_submissions_user_idx ON project_submissions(user_id,project_id);
CREATE TABLE IF NOT EXISTS reward_claims (
 user_id integer NOT NULL REFERENCES users(id), reason text NOT NULL, source_id text NOT NULL,
 PRIMARY KEY(user_id,reason,source_id)
);
-- Recognize historical rewards to prevent awarding the same evidence twice.
INSERT INTO reward_claims(user_id,reason,source_id)
SELECT user_id,reason,COALESCE(metadata->>'lesson_id',metadata->>'quiz_id',metadata->>'problem_id',metadata->>'project_id')
FROM xp_transactions WHERE user_id IS NOT NULL AND reason IN ('lesson_completed','quiz_passed','practice_submitted','project_submitted')
AND COALESCE(metadata->>'lesson_id',metadata->>'quiz_id',metadata->>'problem_id',metadata->>'project_id') IS NOT NULL
ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS certificates (
 id uuid PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), course_id integer NOT NULL REFERENCES courses(id),
 student_name text NOT NULL, course_name text NOT NULL, issued_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,course_id)
);
CREATE TABLE IF NOT EXISTS mock_interviews (
 id uuid PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), question_ids jsonb NOT NULL,
 answers jsonb NOT NULL DEFAULT '{}', ratings jsonb NOT NULL DEFAULT '{}', score integer,
 started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS learning_goals (
 user_id integer PRIMARY KEY REFERENCES users(id), lessons integer NOT NULL DEFAULT 2 CHECK(lessons BETWEEN 1 AND 20),
 problems integer NOT NULL DEFAULT 3 CHECK(problems BETWEEN 1 AND 20), quizzes integer NOT NULL DEFAULT 1 CHECK(quizzes BETWEEN 1 AND 20)
);
CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
INSERT INTO schema_migrations(version) VALUES ('001_completion') ON CONFLICT DO NOTHING;
COMMIT;
