# Admin auth + new features — setup

This adds **login/security to the admin panel**, **switches on the redirects engine**,
adds an **Add City** button, makes the **City Pages editor tab-based**, and wires the
**footer city lists to the database**.

## 1. Environment variables (`.env.local`)

Add a long random secret used to sign admin sessions (keep the DB vars you already have):

```bash
AUTH_SECRET="paste-a-long-random-string-here-min-32-chars"
```

Generate one quickly:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 2. Run the database schema

```bash
mysql -u <user> -p <database> < scripts/auth_schema.sql
```

This creates the `admin_users` table and adds an optional `youtube_url` column to
`page_master_tb`. (If `youtube_url` already exists, ignore the duplicate-column error —
the APIs only write columns that actually exist, so nothing breaks either way.)

## 3. Create the first super admin

```bash
node scripts/create_admin.mjs --email you@company.com --password "ChangeMe123" --name "Your Name" --role super_admin
```

Only emails/passwords stored in `admin_users` can log in. The first super admin can then
create more admins from **Admin → Admins** (only super admins see that menu).

## 4. How it works

- **Login:** `/admin/login`. Sessions are signed (HMAC) httpOnly cookies, valid 12h.
- **Gate:** `src/middleware.js` blocks every `/admin/*` page unless signed in.
- **Roles:** `super_admin` can manage other admins (create / disable / reset password /
  delete); `admin` can use everything except the Admins screen. The last active super
  admin can't be deleted, demoted, or disabled.
- **Redirects:** the same middleware reads `redirects_tb` (via `/api/redirects?lookup=`)
  and applies 301/302/410/404 to public URLs — this is what makes the Redirects screen
  actually take effect.
- **Add City:** Cities screen → "Add city" (tabbed modal → `/api/admin/create_city`).
- **Tabbed pages:** City Pages edit + "New City Page" use Basic Info / SEO / Relations /
  FAQs / Timestamps tabs.
- **Footer cities:** `Footer` + `StateLinks` now pull active cities from `/api/cities`
  (hardcoded lists kept only as an offline fallback).

## Notes
- Password hashing uses Node's built-in `scrypt` — no extra dependency, no native build.
- If you deploy behind a CDN, session cookies are `secure` in production (HTTPS required).
