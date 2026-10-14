# Join as a Partner — setup & operations

Partner onboarding (`/join-as-partner`), partner dashboard (`/partner/*`), admin review
(`/admin/partners`), public profiles (`/partners/{slug}`) and partner listings on the
existing `/{city}/{category}` and `/{city}/{brand}/{category}` pages.

## 1. How it maps onto the existing data

| Need | Uses |
|---|---|
| Categories | `category_tb` (a category shows in the form once it has an active row in `partner_service_types`) |
| Services per category | **new** `partner_service_types` (seeded for the 10 appliance categories; edit at Admin → Partners → Service catalogue) |
| Brands per category | `brand_tb` (each brand already belongs to one category). "Other" → custom name, admin approves before it shows publicly |
| States | `states` (matched to `city_tb.state` by name) |
| Cities **and** localities | `city_tb`. A locality is a `city_tb` row placed under a parent in **new** `city_parent_map` (seeded from the old, unused `related_city` table). Manage at Admin → Partners → Localities |

### Listing rule (exact)
A partner appears on `/{X}/{category}` (and `/{X}/{brand}/{category}` if they picked that brand) only when **all** hold:
`status = approved`, `is_listed = 1`, mobile OTP-verified, not deleted, offers ≥1 service in that category, and has a coverage row that is either
**"Entire city" for X** or **locality = X**.
City-wide partners are *not* shown on every locality page, and locality-only partners are *not* shown on the parent city page.
Nothing is created for localities that have no `city_tb` row — partners can request them; admins map requests to existing rows.

### Status machine
`draft → pending` (partner submits) · `pending → approved | rejected | info_requested` (admin) ·
`rejected / info_requested → pending` (partner resubmits) · `approved → suspended → approved` (admin) ·
`approved / pending → draft` (partner clicks *Edit profile*; profile is unlisted until re-approved, so stale data is never public).
Approval ≠ verification: ID, business and GST checks are separate admin checkboxes and separate public badges.

## 2. Environment variables

Already present and reused: `DB_*`, `AUTH_SECRET`, `AWS_S3_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `OTP_TOKEN`, `NEXT_PUBLIC_API_SEND_OTP`.

Optional overrides:
```
PARTNER_OTP_SEND_URL=     # default: NEXT_PUBLIC_API_SEND_OTP
PARTNER_OTP_VERIFY_URL=   # default: https://waterpurifierservicecenter.in/customer/ro_customer/service_otp_verify.php
```
Partner sessions are signed with a key derived from `AUTH_SECRET` (separate from admin sessions).

## 3. OTP provider
Uses the existing customer OTP API, **called only from the server**: send = `NEXT_PUBLIC_API_SEND_OTP` with `X-App-Token: OTP_TOKEN`;
verify = `service_otp_verify.php` with `{ phoneNumber, newOtp }`, success only when it returns `error: false`.
Our own `partner_otp_challenges` table enforces: 60 s resend cooldown, 5 sends/hour per number, 15/hour per IP, 10-min expiry, 5 attempts.
Note: the verify endpoint belongs to the customer app and may create/refresh a customer record for that number.

## 4. S3 storage
- Logo / shop photo → `partners/{partnerId}/logo|shop/…` (public read, same as `blogs/`, `services/`).
- Documents → `partner-docs/{partnerId}/{type}/…`, SSE-AES256, served only through 5-minute presigned links to the owning partner or an admin.
- **Required:** make sure the bucket policy does **not** grant public `s3:GetObject` on `partner-docs/*`. If the policy is `arn:aws:s3:::BUCKET/*`, change it to list the public prefixes only (e.g. `BUCKET/blogs/*`, `BUCKET/services/*`, `BUCKET/partners/*`).
- Uploads go through the Next server (type sniffed from file bytes, 5 MB max), so no CORS change is needed.

## 5. Database migration
```bash
mysqldump -u <user> -p <db> > backup-before-partners.sql   # 1. backup
node scripts/run-migrations.mjs                             # 2. dry run — lists pending files
node scripts/run-migrations.mjs --commit                    # 3. apply
```
Additive only (CREATE TABLE IF NOT EXISTS / INSERT IGNORE); no existing table is altered. Before the migration
is applied the service pages simply render without a partner section.

**Rollback:** `mysql -u <user> -p <db> < scripts/migrations/rollback/2026_10_14_001_partner_system.down.sql`
(drops partner tables only — deletes partner data), then redeploy the previous build.

## 6. Deploy (cPanel)
Push as usual (`.cpanel.yml` / `deploy.sh`), run the migration, restart the Node app.

## 7. Post-deploy checklist
1. `/join-as-partner` → OTP arrives → verify → draft created (Admin → Partners → Draft).
2. Complete steps 2–7, submit → status *Pending review*, no public listing.
3. Admin approves with "Publish" → partner shows on e.g. `/gurgaon/ro-water-purifier` (if Gurgaon "Entire city" selected) and at `/partners/{slug}`.
4. Unrelated city page → not shown. Suspend → disappears from pages, profile returns 404.
5. Upload a document → admin can view it; the raw S3 URL of `partner-docs/...` returns AccessDenied.

## 8. Tests
`node --test tests/partners.validation.test.mjs` — validator unit tests (no DB / network).
End-to-end scenarios (OTP, transitions, listing matching, IDOR, uploads) are covered by the checklist above; run them on staging data, never with real customer numbers.
