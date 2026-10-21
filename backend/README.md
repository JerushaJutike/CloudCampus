# CloudCampus backend

This directory contains the Express API, PostgreSQL services, migrations and automated tests. The server also serves `../frontend` at the same origin.

See [Windows setup](../docs/WINDOWS_SETUP.md), [API contract](../docs/API.md), [verification](../docs/VERIFICATION_REPORT.md) and [AWS deployment](../docs/AWS_DEPLOYMENT.md).

Commands:

- `npm ci --ignore-scripts`: install locked dependencies.
- `npm run db:migrate`: apply additive migrations to an existing schema.
- `npm run db:seed`: add missing demonstration content.
- `npm start`: serve the application.
- `npm run check`: syntax validation.
- `npm test`: unit/security checks; database integration is skipped.
- `npm run verify`: create an isolated database and run the full verification suite.

Do not run `db/schema.sql` on an existing database. Keep `.env` private. Production requires a random JWT secret, TLS-verified PostgreSQL and S3 storage.
