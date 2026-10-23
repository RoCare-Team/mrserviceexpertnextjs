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

## 9. Booking leads, wallet & reviews (migration 003)

**Flow.** "Book now" on a partner card / profile → compact popup (category, brand and city pre-filled from the page; name + mobile from the customer's OTP-verified session; saved addresses) → lead saved in `partner_leads` → shown on that partner's dashboard for **30 minutes**.
- Accept → 50% of the service price is debited in coins (1 coin = ₹1); the customer's phone and full address become visible. Not enough coins → accept is blocked.
- Reject, or no action in 30 min → the lead is forwarded to the CRM (`AddLead_new.php`, `site_url` gets `?partner=<slug>`).
- Prices/brands are re-read from the CRM APIs on the server — a tampered price is ignored.
- One open booking per customer + partner + category per day (duplicates blocked).
- Partners can "Report a problem"; admins refund coins from **Admin → Partner Leads** (once per lead).

**Customer login.** Booking and reviews need an OTP-verified customer session (`mse_customer_session` cookie), issued after the existing customer OTP API confirms the code on our server. Name / number are pre-filled from the site's existing login.

**Reviews.** Any verified customer, one per partner (editable), published immediately; removable by admin (partner detail page) or the partner (dashboard).

**Wallet recharge (Easebuzz).** Minimum ₹500, credited 1:1 as coins only after the response hash is valid **and** the Transaction Retrieve API confirms success for the same amount.
```
NEXT_PUBLIC_EASEBUZZ_MODE=test        # or live — keep test until verified
EASEBUZZ_TEST_KEY / EASEBUZZ_TEST_SALT / EASEBUZZ_LIVE_KEY / EASEBUZZ_LIVE_SALT
SITE_URL=https://www.mrserviceexpert.com   # production only: Easebuzz return URL base
CRON_SECRET=<long random string>
```
Return URL: `{SITE_URL}/api/payments/easebuzz/return` (surl and furl).

**Cron (cPanel → Cron Jobs, every 2 minutes):**
```
*/2 * * * * curl -s "https://www.mrserviceexpert.com/api/cron/partner-leads?key=YOUR_CRON_SECRET" > /dev/null
```
Expires 30-minute-old leads and forwards them (and rejected ones) to the CRM, retrying failures up to 3 times. Dashboards also trigger this when opened, so leads still move if the cron is late.

**Admin badge.** The sidebar shows counts for new applications + locality requests (Partners) and problem reports + failed CRM forwards (Partner Leads), refreshed every minute.

**Rollback:** `scripts/migrations/rollback/2026_10_22_003_partner_leads_wallet_reviews.down.sql` (drops only these new tables).

## 10. Partner dashboard (migration 004)

`/partner/dashboard?tab=overview|leads|wallet|profile|reviews|settings` — sidebar on desktop, bottom nav on mobile.
- **Overview:** today's leads, accepted / completed / missed this month, 30-day acceptance rate, coins, booked value, recorded earnings, rating, 6-month chart, profile-strength checklist.
- **Leads:** New / Accepted / Completed / Missed / All, search, date range, Call / WhatsApp / Directions after accepting, private notes, completion record (final amount + work done), report a problem.
- **Wallet:** balance, low-balance alert threshold, Easebuzz recharge, full payment history (success / failed / pending with method, UPI / masked card, bank ref, failure reason), printable receipt (`/partner/receipt/{id}` → Save as PDF), coin ledger with filters. Pending payments older than 10 min are re-checked with Easebuzz automatically; not found after 30 min → marked failed (abandoned).
- **Profile:** instant edits (description, hours, experience, email, logo, shop photo, 8-photo gallery, address & service areas, documents); business name / type / GSTIN / categories / services / brands go through a **change request** — live profile unchanged until an admin approves (Admin → partner detail).
- **Reviews:** rating distribution, public replies, remove.
- **Settings:** Online/Offline (offline hides "Book now" and blocks bookings), browser push alerts per device, log out / log out of all devices, rules & support.
- **Notifications:** bell with unread count — new / missed leads, refunds, payments, reviews, status and change-request decisions.

**Web push env (production too):** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=https://www.mrserviceexpert.com` — generate once with `npx web-push generate-vapid-keys`; changing them invalidates existing subscriptions. Service worker: `public/partner-sw.js` (scope `/partner/`). Needs HTTPS (localhost works for testing). iPhone: only after "Add to Home Screen".

**Admin:** Partner Payments page (all attempts + raw gateway response), change-request review on partner detail, sidebar badge includes pending change requests.

**Payments are in TEST mode** (`NEXT_PUBLIC_EASEBUZZ_MODE=test`) until switched to `live`.
