BEGIN;
CREATE TABLE IF NOT EXISTS file_uploads (
 id uuid PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), object_key text NOT NULL UNIQUE,
 filename text NOT NULL, content_type text NOT NULL, size integer NOT NULL CHECK(size BETWEEN 1 AND 5242880),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS file_uploads_user_idx ON file_uploads(user_id);
INSERT INTO schema_migrations(version) VALUES('002_files') ON CONFLICT DO NOTHING;
COMMIT;
