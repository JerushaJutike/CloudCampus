# Verification report

Date: 12 October 2026 (Asia/Kolkata).

## Result

The repaired local application passed nine automated tests with a complete PostgreSQL student/admin journey, browser checks and a bounded load check. The original project was upgraded after a private source/database backup. All 41 original rows across 22 original tables were verified retained, using original-column row signatures during the upgrade transaction. Original account data was not replaced by test fixtures.

Backup directory: `F:/Projects/CloudCampus_Backups/20261012-1791826204418`. The database backup and old source copy are private local recovery artifacts and are excluded from the shared ZIP. The original `.env` was retained.

Original course aliases (`dsa`, `dbms`, `java`, `web-development`) are reused. Four redundant course copies and one problem copy introduced by the initial seed pass were archived only when they had no student history; no rows were deleted. Six courses are active. Existing course IDs, names, descriptions and historical records remain intact.

## Automated checks

| Check | Result |
|---|---|
| Registration input boundaries | Pass |
| JWT signature/identity verification | Pass |
| XP level boundaries | Pass |
| PostgreSQL student/admin/security journey | Pass |
| File size/type/signature validation | Pass |
| ID/URL validation | Pass |
| Quiz answer types, point checks and exact code-output case | Pass |
| Bcrypt and legacy scrypt verification | Pass |
| Catalog load and authentication rate limit | Pass |

The database journey covers registration/login, ignored client admin roles, duplicate registration, unauthorized access, enrollment idempotency, lesson access/completion, 20 concurrent completion requests, one-time XP, quiz scoring/retries/history, code storage/history, project edits/evidence, badges, certificates, bookmarks, recommendations, leaderboard, analytics, profile/goals, notifications, mock interviews, file round-trip, admin content CRUD/archive, student disabling, role revocation, CORS, malformed JSON, liveness/readiness and frontend delivery.

Verification restores the legacy schema into a new `cloudcampus_verify_...` database. A representative legacy-alias fixture proves original course IDs can be reused. Every migration and both seed files run twice. The active catalog is asserted to have exactly six unique course titles. Verification databases and test files are retained locally for inspection; they are not included in the shared archive.

The final isolated load run used 100 catalog requests at concurrency eight: p95 108 ms, maximum 180 ms. These are observations on this Windows machine, not a production capacity guarantee. The authentication limiter accepted its first 30 unauthenticated requests and returned 429 on the next request.

## Browser checks

- Student registration and sign-in, dashboard and progress.
- DSA enrollment unlocks ordered lessons; completion updates state and awards XP.
- Quiz selection, answer submission, 100% result and earned XP.
- Coding submission and return to history/catalog.
- Guided project submission appears as real portfolio evidence with safe repository links.
- Completing all course lessons after passing its quiz issues a certificate; public ID verification works.
- Administrator sign-in and question authoring, including multiple-answer options and correct-answer sets.
- Mobile portfolio/settings and navigation at a 390 × 844 viewport override; drawer closes after navigation. Browser zoom affected effective CSS pixels, so no exact physical-device claim is made.
- Screenshots contain dummy verification accounts only. [Portfolio evidence](screenshots/verified-portfolio.png).

## Source and deployment checks

- JavaScript syntax checks pass for the complete source, scripts and test files.
- Source was formatted with Prettier for readability.
- Final npm audit reports zero known production dependency vulnerabilities.
- CloudFormation template passes `cfn-lint` with no reported diagnostics.
- Deployment PowerShell script passes PowerShell syntax parsing.
- Docker Desktop's engine was not running; the container build/runtime was not executed.
- AWS deployment, live RDS/S3 operation, secret rotation and CloudWatch/budget alerts are deferred to the owner and are not claimed verified.

## Original database smoke check

Read-only checks against upgraded `cloud_campus` passed for six active courses, course details, project catalog, process liveness, database readiness and frontend delivery. No real account was registered, enrolled or impersonated for that check. The user's pre-existing backend process was not terminated; it must be restarted to load the new source.

## Preservation evidence

| Original table | Original rows | Original fields/rows retained |
|---|---:|---|
| achievements | 4 | Yes |
| bookmarks | 0 | Yes |
| coding_problems | 3 | Yes |
| courses | 4 | Yes |
| enrollments | 0 | Yes |
| interview_questions | 4 | Yes |
| lesson_progress | 0 | Yes |
| lessons | 8 | Yes |
| modules | 8 | Yes |
| notifications | 0 | Yes |
| project_submissions | 0 | Yes |
| projects | 2 | Yes |
| questions | 4 | Yes |
| quiz_attempts | 0 | Yes |
| quizzes | 2 | Yes |
| skills | 0 | Yes |
| streaks | 1 | Yes |
| submissions | 0 | Yes |
| user_achievements | 0 | Yes |
| user_skills | 0 | Yes |
| users | 1 | Yes |
| xp_transactions | 0 | Yes |

## Remaining scope boundaries

Stored code is not executed. Interview scores are self-assessed. Practice/project XP rewards participation, without proving correctness/completion. Recommendations and skills are basic course-level evidence. Notifications are in-app achievements; automatic email/push and streak reminders are not implemented. Files are private account attachments. A public production release still needs account-specific cloud deployment, shared/proxy-aware rate-limit testing, monitoring, backups and operational review.

## Restart and owner verification

In the original backend terminal press Ctrl+C, then run `npm start` from `F:\Projects\CloudCampus_Completed\backend`. Hard refresh the browser and sign in again. Follow [Windows setup](WINDOWS_SETUP.md) for verification/recovery; do not run `schema.sql` on the existing database.
