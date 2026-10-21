# Windows and PostgreSQL 18 setup

CloudCampus serves the frontend and API together at `http://localhost:5000`. The existing database is `cloud_campus`, with the local PostgreSQL account `postgres`.

## Upgrade the existing project

1. Stop the old backend in its terminal with **Ctrl+C**. Keep its `.env` file private.
2. Back up the project folder and take a PostgreSQL backup before applying migrations. From PowerShell:

   ```powershell
   $postgresBin = 'C:\Program Files\PostgreSQL\18\bin'
   & "$postgresBin\pg_dump.exe" -h localhost -U postgres -d cloud_campus -Fc -f 'F:\Projects\cloud_campus_before_upgrade.backup'
   if ($LASTEXITCODE -ne 0) { throw 'Backup failed; stop here.' }
   ```

   Enter your password at the PostgreSQL prompt. Do not put it into a shared script. The backup contains account data and belongs in private storage.

3. Extract the repaired archive into a separate folder first. Copy its contents into `F:\Projects\CloudCampus_Completed`, retaining the original `backend\.env`. Never replace the database with `schema.sql` during an upgrade.
4. Open PowerShell in the backend folder:

   ```powershell
   Set-Location 'F:\Projects\CloudCampus_Completed\backend'
   npm ci --ignore-scripts
   npm run db:migrate
   npm run db:seed
   npm run check
   npm test
   npm start
   ```

   If any command fails, stop and resolve it before continuing. `db:migrate` adds fields and tables; it retains existing IDs, legacy columns and historical rows. `db:seed` adds missing demonstration content and connects known achievement names to their codes. It does not reset student history or replace existing lesson content.

5. Confirm the private `.env` has the correct values:

   ```dotenv
   PORT=5000
   CORS_ORIGIN=http://localhost:5000
   DBHOST=localhost
   DBPORT=5432
   DBNAME=cloud_campus
   DBUSER=postgres
   DBPASSWORD=your-local-password
   JWT_SECRET=your-generated-random-secret
   DATABASE_SSL=false
   ```

   `DATABASE_URL`, if present, overrides the separate database settings. Preserve the existing JWT secret unless you intentionally want to invalidate all previous sessions. Generate a new secret for a fresh installation using `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and store it only in `.env`.

6. Visit `/api/health` and `/api/ready`, then open the homepage. Hard refresh the browser so it loads the repaired JavaScript. Old browser tokens are no longer read from persistent local storage; sign in again. New sessions live in session storage.

## Fresh installation

Install Node.js 24 LTS, npm and PostgreSQL 18. PostgreSQL must be running. From the extracted project's backend directory:

```powershell
Copy-Item .env.example .env
# Edit .env with local credentials and a random JWT secret.
$postgresBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$postgresBin\createdb.exe" -h localhost -U postgres cloud_campus
if ($LASTEXITCODE -ne 0) { throw 'Database creation failed.' }
& "$postgresBin\psql.exe" -h localhost -U postgres -d cloud_campus -v ON_ERROR_STOP=1 -f .\db\schema.sql
if ($LASTEXITCODE -ne 0) { throw 'Schema creation failed.' }
npm ci --ignore-scripts
npm run db:migrate
npm run db:seed
npm start
```

`schema.sql` is the restored PostgreSQL 18 schema for a **new empty database**. It is not an upgrade or reset script. In pgAdmin, omit psql-only `\restrict` / `\unrestrict` lines; using PostgreSQL 18's psql is recommended.

## Verification

`npm test` runs unit/security checks and skips the database journey unless explicitly enabled. `npm run verify` creates a uniquely named `cloudcampus_verify_...` database, restores the legacy schema, runs each migration and seed twice, and runs the complete database journey. The configured database account needs `CREATE DATABASE`. The verification database and its test uploads are retained for inspection; no test mutations run against `cloud_campus`.

## Administrator account

Register a trusted account in the UI. In pgAdmin, run a reviewed update for that specific email:

```sql
UPDATE users SET role='admin' WHERE email='your-actual-admin-email';
```

Sign in and select **Admin tools** from the dashboard. Roles and disabled status are checked against the database on every protected request. There are no shared seeded administrator passwords.

## Common issues

| Symptom | Action |
|---|---|
| Port 5000 is already in use | Stop the old backend terminal, then restart. Do not terminate unrelated processes. |
| Course detail or project query fails | Confirm the repaired source is loaded and both migrations ran against `cloud_campus`. |
| CORS rejected | Use the same frontend/API origin. Confirm port and `CORS_ORIGIN`; do not use `*`. |
| Authentication fails after upgrade | Sign in again. Existing bcrypt and recognized legacy scrypt hashes remain usable. |
| Migration times out waiting for a lock | Stop application traffic, verify the backup, and retry the migration. |
| File upload rejected | Use PNG, JPEG, WebP or PDF under 5 MB. The file content must match its declared type. |
| Rate limit reached | Wait for the 15-minute window to reset. Authentication has a separate lower limit. |

## Recovery

The upgrade takes no destructive database action. Keep the pre-upgrade backup until you have verified the real account and course history. If recovery is needed, restore into a **different database name** with `pg_restore`, inspect it, and change the private database configuration to that restored copy. Do not drop or overwrite `cloud_campus` as an automatic rollback step.
