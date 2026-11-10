# Careers & Recruitment — setup

## 1. Database
```
node scripts/run-migrations.mjs            # dry run — should list 2026_11_05_008_careers.sql
node scripts/run-migrations.mjs --commit
```
Creates `career_jobs`, `career_applications`, `career_application_notes`, `career_interviews`,
`career_application_logs`, `career_settings`, `career_resume_uploads`, `career_admin_activity`.
Rollback: `scripts/migrations/rollback/2026_11_05_008_careers.down.sql` (destroys data).

## 2. S3 (resumes)
Uses the existing `AWS_S3_REGION / AWS_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY`.
Resumes go to `career-resumes/` and must stay **private**:
- The bucket policy must not grant public `s3:GetObject` on `career-resumes/*` (or on `*`).
- Bucket CORS must allow `PUT` with header `Content-Type` from every site origin
  (`https://www.mrserviceexpert.com`, `https://mrserviceexpert.com`, `http://localhost:3000`).
- The IAM key needs `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `career-resumes/*`.

## 3. Email (SMTP)
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587            # 465 → also SMTP_SECURE=1
SMTP_USER=careers@mrserviceexpert.com
SMTP_PASS=…
MAIL_FROM="Mr. Service Expert Careers <careers@mrserviceexpert.com>"
CAREERS_ADMIN_EMAIL=hr@mrserviceexpert.com   # fallback if Settings has no recruitment email
```
Without SMTP, applications still save; the activity log records "Email not sent".

## 4. Cron (hourly)
```
curl -s "https://www.mrserviceexpert.com/api/cron/careers?key=$CRON_SECRET" > /dev/null
```
Closes expired jobs, deletes resumes uploaded but never submitted (> 24 h), applies the
optional retention policy. Expiry is also enforced on every request.

## 5. Tests
`npm run test:careers` — validation / sanitizing / file-check logic (no DB or network).
