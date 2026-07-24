# CMS Forms & Admin Panel

## Goal

Replace every `mailto:` form with real server-handled submissions stored in a database, manageable through a staff admin panel at `/admin`. Approved trade/credit applications are pushed to Shopify as tagged customers with metafields. **All orders stay in Shopify** — the CMS only handles applications, inquiries, support requests, and (later) resources content.

## Locked Decisions

- **Shopify plan:** Plus (B2B features available as a future option).
- **Credit invoicing:** staff-issued invoice (credit customer builds a quote -> staff convert to a Shopify draft order with payment terms -> Shopify emails the invoice). Website only routes credit customers to the quote flow with tailored copy.
- **Trade pricing:** quote-based (standard prices online; special pricing agreed per quote via the existing `/quote` draft-order flow).
- **Database:** Postgres + Drizzle ORM (pure-JS `postgres` driver bundles cleanly into Nitro `.output`; Coolify one-click provisioning; `DATABASE_URL` already anticipated). SQLite + `better-sqlite3` is the documented fallback if zero external services is required (needs Nitro `externals` + Docker build tools).
- **Admin auth:** per-staff accounts (email + scrypt-hashed password) with a TanStack cookie session mirroring the existing customer-login pattern; first admin seeded from env on first boot.
- **Email notifications:** pluggable `notify.server.ts` supporting Resend (recommended) or SMTP/nodemailer via env config. Needs client credentials (see Assumptions).

## Data Model (Drizzle, `src/lib/db/schema.ts`)

- `staff_users`: id, email (unique), password_hash, name, role (`admin`|`staff`), created_at
- `submissions`: id, type (`part_inquiry`|`trade_account`|`credit_account`|`support_tracking`|`support_resources`|`support_question`|`unsubscribe`), status (`new`|`in_review`|`approved`|`rejected`|`completed`), payload (json text), contact_email, contact_name, company, reference, shopify_customer_id (nullable), shopify_synced_at (nullable), created_by_staff (nullable), reviewed_by (fk staff, nullable), reviewed_at, created_at, updated_at
- `submission_notes`: id, submission_id (fk), staff_id (fk), body, created_at
- `attachments`: id, submission_id (fk), filename, mime, size, path, created_at (schema now; uploads implemented in Phase 5)

## Phase 1 — Data Foundation

- Add deps: `drizzle-orm`, `postgres`, `drizzle-kit` (dev). Add `drizzle.config.ts`.
- Create `src/lib/db/schema.ts` (tables above) and `src/lib/db/index.server.ts` (drizzle client; reads `DATABASE_URL` inside function per `config.server.ts` convention).
- Add `databaseUrl`, `adminSeedEmail`, `adminSeedPassword`, `resendApiKey`/SMTP vars to `getServerConfig()` in `src/lib/config.server.ts` and to `.env.example`.
- Run migrations on server boot via a small `src/lib/db/migrate.server.ts` invoked from `src/server.ts` (idempotent), or `drizzle-kit migrate` in the Docker build.
- Generate initial migration with `drizzle-kit generate`.

## Phase 2 — Submission Ingestion (public forms)

- Create `src/lib/api/cms.functions.ts` with one `createServerFn({ method: "POST" })` per form type, each with a zod `inputValidator`, a hidden honeypot field (`z.string().max(0)`, matching the quote form pattern), and a simple in-memory per-IP rate limiter (single-container deploy).
- Create `src/lib/notify.server.ts`: `notifySalesDesk(subject, htmlBody)` — Resend if `RESEND_API_KEY` set, else nodemailer SMTP; logs a warning if neither configured (never crashes the submission).
- Each handler: validate -> insert submission (status `new`) -> email sales desk -> return `{ ok: true, reference }` or `{ ok: false, errors }`.
- Migrate existing `mailto:` forms to call these server functions with success/error states (mirror `login.tsx` status pattern):
  - Homepage part inquiry (inline form in `src/routes/index.tsx`)
  - `src/components/shopify/TradeAccountApplicationForm.tsx`
  - `src/components/shopify/SupportRequestForm.tsx` (covers tracking, resources, question, unsubscribe used by `track-order`, `resources`, `contact-us`, `got-a-question`, `unsubscribe`)
- Add a new **credit account application** form + route `src/routes/credit-account.tsx` (extra fields: requested credit limit, bank/trade references, company number, VAT). Link it from the trade/account pages.

## Phase 3 — Admin Panel

- Create `src/lib/admin/auth.server.ts`: scrypt password hashing/verify, `getAdminSession`/`setAdminSession`/`clearAdminSession` using `useSession` from `@tanstack/react-start/server` with a separate cookie (`sa_admin_session`) and `APP_SESSION_SECRET`. Seed first admin from env if `staff_users` is empty.
- Create `src/lib/api/admin.functions.ts` (all guarded by a `requireAdmin()` session check): list submissions (filter by type/status, search, paginate), get submission detail + notes, set status, add internal note, mark reviewed.
- Routes (no public nav link; `noindex`):
  - `src/routes/admin/login.tsx` — staff email/password.
  - `src/routes/admin/index.tsx` — dashboard: filterable/searchable submission table with status badges and counts.
  - `src/routes/admin/submissions.$id.tsx` — detail view: full payload, status workflow buttons (new -> in review -> approved/rejected/completed), internal notes thread, and (for trade/credit) a "Sync to Shopify" action.
- Components in `src/components/admin/`: `AdminShell`, `SubmissionTable`, `SubmissionDetail`, `StatusBadge`, `NotesThread`. Reuse existing `ui/` primitives and the site's industrial styling.

## Phase 4 — Shopify Customer Handoff

- Create `src/lib/shopify/customer-sync.server.ts` using the existing `shopifyAdmin` client:
  - `syncTradeCustomer(submission)`: look up customer by email; create if missing; set tag `trade-account` + metafields (`company_number`, `vat_number`, `account_type=trade`, `pricing_tier`). Optionally send account invite.
  - `syncCreditCustomer(submission)`: tag `credit-account` + metafields (`credit_limit`, `payment_terms`, `account_type=credit`).
  - On success, store `shopify_customer_id` + `shopify_synced_at` on the submission.
- Wire the "Approve & sync to Shopify" button in the admin detail view to these helpers.
- Credit-account-aware messaging: in `src/routes/quote.tsx` and `src/routes/account.tsx`, if the logged-in Shopify customer carries the `credit-account` tag, show "Request invoice / payment terms" copy instead of online-payment copy (light change; ordering itself stays in Shopify).

## Phase 5 — Hardening & Extras

- File uploads for part-inquiry photos: store on a persistent volume (`/app/data/uploads`) served via a protected server route; link to `attachments` table. (Phase 2 feature per earlier agreement.)
- Unsubscribe handler: additionally flip the Shopify customer's email-marketing consent via Admin API when the email matches a customer.
- Add Playwright tests: public form submission success/failure, admin login guard, admin status change.
- Update `README.md` runbook: env vars, migration command, admin seeding, volume mount.

## Deployment Changes

- `docker-compose.yml`: add a named volume for uploads/data if using local file storage (Postgres itself is a separate Coolify service; no volume needed for the DB).
- `.env.example`: document `DATABASE_URL`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `RESEND_API_KEY` (or SMTP vars).
- If SQLite fallback is chosen instead: add `python3 make g++` to the Docker build stage, set `nitro.externals.external = ['better-sqlite3']`, copy the built native module into the runtime image, and mount a persistent volume at the DB path.

## Files Summary

- New: `drizzle.config.ts`, `src/lib/db/{schema,index.server,migrate.server}.ts`, `src/lib/api/{cms.functions,admin.functions}.ts`, `src/lib/notify.server.ts`, `src/lib/admin/auth.server.ts`, `src/lib/shopify/customer-sync.server.ts`, `src/components/admin/*`, `src/routes/admin/{login,index}.tsx`, `src/routes/admin/submissions.$id.tsx`, `src/routes/credit-account.tsx`.
- Modify: `src/lib/config.server.ts`, `src/server.ts`, `src/routes/index.tsx`, `src/components/shopify/{TradeAccountApplicationForm,SupportRequestForm}.tsx`, `src/routes/{quote,account}.tsx`, `docker-compose.yml`, `.env.example`, `package.json`.

## Test Plan

- `bun run typecheck` and `bun run lint` pass.
- Unit/integration: each form server function validates, stores a row, and returns a reference; honeypot and rate limiter reject spam.
- Admin: unauthenticated access to `/admin/*` redirects to login; login works; status transitions persist; notes persist.
- Shopify handoff: approving a trade/credit submission creates/updates a customer with correct tags + metafields (verified against a Shopify dev store).
- Playwright e2e for the public form + admin login guard.
- `bun run build` passes; production smoke test of `/`, `/trade-account`, `/credit-account`, `/admin/login`.

## Assumptions / Needs Client Input

- **Email credentials:** a Resend API key (recommended) or SMTP host/user/pass for `trade@spares-automation.co.uk`. Until provided, submissions are stored but notification emails are skipped with a logged warning.
- **Database:** Postgres instance provisioned on Coolify (one click). Confirm before Phase 1, or opt for the SQLite fallback.
- **Admin seed:** initial staff email/password for first boot.
- Shopify Admin token already has (or will be granted) `write_customers` + `write_customer_metafields` scopes for the handoff.
- Final legal/privacy wording for the new credit-account form still pending client-approved copy (existing placeholder pattern reused).

## Out of Scope (future)

- Resources CMS (manage `/resources` PDFs/videos) — same admin shell, later phase.
- Native Shopify Plus B2B price lists / self-serve payment terms at checkout — upgrade path if the client later wants self-serve credit checkout.
- CRM/email-marketing provider integration beyond transactional notifications.