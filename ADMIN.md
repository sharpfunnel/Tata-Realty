# Admin Panel

Analytics and lead capture for the Ghansoli landing page. Everything lives under
`/admin` on the same domain — no separate deployment.

| Route             | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `/admin/login`    | Email + password sign-in (the only public admin route) |
| `/admin`          | Redirects to `/admin/sessions`              |
| `/admin/sessions` | 100 most recent visits, 14 columns          |
| `/admin/leads`    | Every Enquire Now submission                |
| `/admin/heatmap`  | Click / hover overlay on a live page preview |

Public, ungated (the landing page must reach them): `POST /api/track`,
`POST /api/lead`.

---

## 1. Create the Neon database

1. Go to <https://console.neon.tech> and sign in (GitHub login is quickest).
2. **New Project** → name it `tata-realty` → pick region
   **AWS ap-south-1 (Mumbai)** so latency matches your Vercel region and your
   visitors. Postgres version: leave the default.
3. When it finishes, Neon shows a **Connection string** panel. You need two
   strings from it:

   - **Pooled** — the default. Its host contains `-pooler`, e.g.
     `ep-cool-name-12345678-pooler.ap-south-1.aws.neon.tech`.
     This is `DATABASE_URL`, used by the running app.
   - **Direct** — toggle **Connection pooling** *off* (or pick "Direct
     connection") and the `-pooler` disappears from the host.
     This is `DIRECT_URL`, used only by `prisma migrate` and `prisma db seed`.

   Both end in `/neondb?sslmode=require`. Keep `sslmode=require`.

   > Why two: `prisma migrate` takes a Postgres advisory lock, which the
   > connection pooler cannot hold. Migrating through the pooled URL hangs or
   > errors. The app itself *wants* the pooler, because Vercel opens many
   > short-lived lambda connections.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill it in:

```bash
DATABASE_URL="<Neon pooled string>"
DIRECT_URL="<Neon direct string>"

# 32+ chars. Generate one:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_SESSION_SECRET="<random hex>"

ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="<12+ characters>"

NEXT_PUBLIC_SITE_URL="https://tata-realty.vercel.app"
```

## 3. Create the tables and the admin user

```bash
npm run db:migrate     # applies prisma/migrations to Neon
npm run db:seed        # creates the admin login from ADMIN_EMAIL/ADMIN_PASSWORD
```

`db:seed` is idempotent — re-run it any time to change the password.

## 4. Add the same variables in Vercel

Project → **Settings → Environment Variables**, for **Production** and
**Preview**:

`DATABASE_URL`, `DIRECT_URL`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`.

`ADMIN_EMAIL` / `ADMIN_PASSWORD` are only needed where you run the seed
(locally is fine) — they are not read at runtime.

Then redeploy. `npm run build` runs `prisma generate` first, so the client is
always built against the current schema.

## 5. Verify

- `https://tata-realty.vercel.app/admin` → bounces to `/admin/login`
- Sign in → lands on `/admin/sessions`
- Open the landing page in another browser, scroll, click, submit the form
- Refresh `/admin/sessions` — the visit appears; `/admin/leads` shows the enquiry

---

## How tracking works

`public/tracker.js` loads on the landing page (injected in `app/layout.tsx`,
`afterInteractive`) and posts to `/api/track`.

| Field | Where it comes from |
| --- | --- |
| Visitor / session id | `localStorage` (visitor) + `sessionStorage` (session) |
| New vs returning | Whether a visitor id already existed at load |
| Device | `navigator.userAgentData.mobile`, falling back to a width + UA check |
| Source / medium / campaign | `utm_*` params → referrer host → `gclid`/`fbclid` |
| **IP, Location** | **Server-side only**, from request headers — never sent by the client |
| Scroll depth | Max % reached, rAF-throttled, flushed on heartbeat and page hide |
| Clicks / hovers | Normalised `xPct`/`yPct` (0-1) against the full document |
| **Duration** | **Server-side**: `now − arrivedAt` on each heartbeat |
| **Bounce** | **Server-side**: ≤1 interaction *and* <10s *and* <25% scroll, and no form submission |

Hover events fire only after the pointer rests for 450ms, so ordinary mouse
sweeps do not flood the heatmap. Tracking is skipped entirely when Do Not Track
is on, and on `/admin` itself.

Location comes from Vercel's `x-vercel-ip-city` / `x-vercel-ip-country` edge
headers — free, no third-party geo-IP call. Locally those headers are absent, so
Location shows `–`.

## Notes / limits

- **Replay** is a column in the schema and renders a "⊙ Watch" link when
  `replayUrl` is set, but nothing writes it — session recording is a separate
  product (rrweb, or a paid tool) and was not in scope. The column shows `–`.
- **Rate limiting** is in-process (`app/lib/rate-limit.ts`). On Vercel each
  lambda has its own counter, so the real ceiling is *limit × warm instances*.
  That stops a browser or casual script; for a hard global cap, swap the body
  for Upstash Redis — the function signature is designed to stay the same.
- **Session cookies last 8 hours** and are not re-checked against the database.
  Deleting the admin row does not immediately kill a live session; rotate
  `ADMIN_SESSION_SECRET` to invalidate every cookie at once.
- The heatmap loads the landing page in a same-origin iframe and measures its
  real height. If `NEXT_PUBLIC_SITE_URL` ever points at a different origin, the
  measurement is blocked and it falls back to an estimated height (the header
  says so when that happens).
- The heatmap plots the **5,000 most recent** events per mode; the count line
  tells you when that cap is in effect.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:migrate:dev` | Create + apply a migration after a schema edit |
| `npm run db:seed` | Create/update the admin user |
| `npm run db:studio` | Browse the data in Prisma Studio |
