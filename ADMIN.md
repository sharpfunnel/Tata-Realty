# Admin Panel

Analytics and lead capture for the Ghansoli landing page. Everything lives under
`/admin` on the same domain — no separate deployment.

| Route             | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `/admin/login`    | Email + password sign-in (the only public admin route) |
| `/admin`          | Redirects to `/admin/sessions`              |
| `/admin/sessions` | 100 most recent visits, 18 columns          |
| `/admin/leads`    | Every Enquire Now submission                |
| `/admin/heatmap`  | Click / hover overlay on a page screenshot  |

Public, ungated (the landing page must reach them): `POST /api/track`,
`POST /api/lead`, `PATCH /api/lead`.

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
| Source / medium / campaign | `utm_*` params → referrer host → `gclid`/`fbclid`/`msclkid` |
| Acquisition detail | Captured once per session — see below |
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

## Acquisition / UTM tracking

The landing URL's query string is captured **once per session** and cached in
`sessionStorage` (`tr_smeta`). Reading it on every pageview would be wrong: a
visitor who lands on `/?utm_source=meta` and then clicks through to a page with
no query string would have their attribution overwritten with nulls.

Three tiers, most-structured first:

1. **UTM params** — `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`,
   `utmTerm`.
2. **Click ids and ad hierarchy** — `gclid` (Google), `fbclid` (Meta),
   `msclkid` (Microsoft), plus `placement`, `metaCampaignId`, `metaAdsetId`,
   `metaAdId` when you tag your own Meta ads.
3. **`rawParams`** — every query param verbatim, as JSON. The safety net: a new
   ad platform or a custom param is never lost just because it has no column.
   You can backfill a named column from `rawParams` later; you can never
   recover data you never captured. It is `NULL` (not `{}`) for direct traffic.

`source`/`medium`/`campaign` remain the *derived* view shown in the Sessions
table; the `utm*` columns are the raw tags. Keeping both means a change to the
derivation rules never rewrites history.

### Tagging Meta ads

Use Meta's dynamic URL parameters as the values — Meta fills them in per click:

```
?utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}
&utm_content={{ad.name}}&utm_term={{adset.name}}
&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}
&placement={{placement}}
```

If you later join this against Meta's spend data, **match on `metaCampaignId`,
not campaign name** — names get edited after launch and a rename silently
breaks the join. Both fields are indexed for that query.

### Where it shows

- **Sessions** — `Content (Ad)`, `Term (Adset)`, `Placement`, and a `Params`
  column showing a count, with the full list in the hover tooltip.
- **Leads** — an `Attribution` column per lead: `source/medium · campaign`, with
  ad / adset / placement on a second line. `Direct` when the session carried no
  tags; `Unknown` when the lead has no session at all (blocked script or DNT).

## Lead capture: short form + thank-you page

The landing page form asks for **name and phone only**. Everything else is
optional and collected afterwards on `/thank-you`.

```
Landing form (name + phone)
      │  POST /api/lead → creates the Lead, returns { leadId }
      ▼
/thank-you?leadId=…
      │  optional form (email, budget, configuration, message)
      │  PATCH /api/lead → { leadId, … }
      ▼
the SAME Lead row is enriched — never a second lead
```

Why: a two-field form converts better, the lead is captured even if the
visitor never adds anything else, and `/thank-you` is a **stable URL** you can
point Meta/Google Ads conversion tracking and GTM triggers at, instead of
depending on an inline success message.

- `PATCH` only writes fields that were actually filled in, so adding a budget
  later never blanks an email given earlier. `Lead.enrichedAt` records when it
  happened, so the sales team can tell an enriched lead from a bare one.
- `leadId` is the row's own cuid — unguessable, and the only thing authorising
  the update. Because it travels in a URL (and so can leak via history,
  referrers or a shared link), enrichment is refused **24 hours** after
  submission (`ENRICH_WINDOW_MS`).
- A direct visit to `/thank-you` with no `leadId` still shows the confirmation
  and contact links, just no optional form — there would be no row to attach
  answers to. The page is `noindex, follow`.

**WhatsApp still opens automatically on submit.** It is launched synchronously
inside the submit gesture, before the network call, or a popup blocker would
reject it. The thank-you page repeats the WhatsApp and call links for anyone
whose browser blocks it anyway.

**Trade-off worth knowing:** budget and configuration used to be required on
the landing page, so every lead had them. They are now optional, so expect a
lower fill rate on both in exchange for more leads overall. If the sales team
would rather have the data than the volume, move either field back into
`app/components/lead-form.tsx` and add it to `leadPayloadSchema`.

## Meta Conversions API

Server-side conversion events, so conversions still reach Meta when the browser
Pixel is blocked by an ad blocker, ITP, or a webview.

Two paths write to the same `Lead` columns, so the Sent/Failed badge on
`/admin/leads` always reflects whichever fired most recently:

- **Automatic** — a `Lead` event fires when an enquiry is submitted.
- **Manual** — the **Send** button on each row opens a modal where you pick the
  event (Purchase, Lead, Subscribe, Registration, Start Trial, or a custom
  name), optionally set a value + currency and an order/reference ID, review
  the exact JSON payload, then send.

### Setup

1. Events Manager → Data Sources → your pixel → **Settings** → *Generate access
   token*. Put it in `META_CAPI_ACCESS_TOKEN`.
2. `META_PIXEL_ID` is already set to `1330281962604710`.
3. Add both in Vercel → Settings → Environment Variables, then redeploy.

To rehearse safely, set `META_TEST_EVENT_CODE` (Events Manager → **Test
Events** tab). Events then appear only in that tab. **Clear it in production**
or your real conversions will not be counted.

### Deduplication

The form generates one id, passes it to the browser Pixel as `eventID` and to
the server as `eventId`, and it is stored on `Lead.metaEventId` and sent as the
CAPI `event_id`. Meta collapses the two deliveries into one conversion. In the
manual modal, the *Order / reference ID* field serves the same purpose.

The automatic `Lead` event fires on the short form's `POST`, so it carries name
and phone but not email — email only exists once someone enriches on the
thank-you page. Enrichment does **not** re-send (that would double-count); it
improves match quality for any later manual send instead.

### Match quality

Email, phone, first/last name, city and country are SHA-256 hashed after
normalisation (Meta's rules: trimmed, lowercased, phone with country code, city
stripped of spaces). Raw PII never leaves the server. IP and User-Agent are sent
unhashed, as Meta requires — this is why `Session.userAgent` stores the full
string rather than just the browser family. For paid Meta traffic the `fbc`
click cookie is reconstructed from the stored `fbclid`, which materially lifts
the match rate.

> **The browser Pixel base code is not installed on the landing page.** There is
> a `fbq("track", "Lead", …)` call in the form, but nothing defines `fbq`
> (GTM would have to inject it), so it is currently a no-op. CAPI works
> regardless — it is server-to-server. Install the Pixel only if you want
> browser-side events too; the dedup plumbing is already in place for it.

### Before credentials exist

With no access token in **development**, a send skips the Graph call and returns
a fake success (`preview: true`) purely so the UI can be reviewed. It does not
touch the lead's real status. In **production** a missing token is a real
failure and is recorded in `metaCapiError`, surfaced as the Failed badge's
tooltip. Once a real token is set, the preview path stops being hit — no
cleanup needed.

## Notes / limits

- **Replay** is recorded with rrweb into `ReplayChunk` rows; the Sessions table
  links to `/admin/sessions/<id>/replay` for any session that has chunks.
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
