# Backend

Express 4 + Prisma 6 on PostgreSQL (Neon). Entry point `server/index.js`; the app
itself is built in `server/app.js` so tests can import it without listening.

## Layout

```
server/
  index.js                 # listen, start jobs, graceful shutdown
  app.js                   # middleware + module routers + error handler
  config/env.js            # zod-validated environment (fails fast in production)
  lib/                     # prisma, logger, mailer, storage, money, mappers, validation, router
  middleware/              # auth/RBAC, security (helmet/CORS/limits), request logging, errors
  modules/                 # one router per domain
    auth  catalog  vendor  orders  reviews  wishlist
    addresses  notifications  subscriptions  admin  system
  jobs/subscriptionExpiry.js
  test/                    # node:test + supertest against a real Postgres
```

Routes are declared with `createRouter()` (`lib/router.js`). Each route's zod
`params` / `query` / `body` schemas both validate the request and feed the
OpenAPI document, so the docs cannot drift from the code.

- Interactive docs: `GET /api/docs` (non-production only)
- Spec: `GET /api/docs/openapi.json`
- Liveness: `GET /api/health` · Readiness (pings the DB): `GET /api/ready`

## Conventions

- **Money** is `DECIMAL(12,2)`. Do arithmetic with `decimal()` / `sum()` from
  `lib/money.js`; mappers convert to numbers only at the API boundary.
- **Public products** must use `publicProductWhere` from `modules/catalog.js`
  (active, approved, vendor active, listings not hidden).
- **Errors**: throw `HttpError` (or `notFound`, `forbidden`, …) from `lib/errors.js`.
  Anything else becomes a logged, generic 500.
- **Pagination**: spread `pageQuery` into the query schema and call `paginate()`.
  Page size is clamped to 50.
- **Side effects** that must be consistent (stock, order status, ratings,
  notifications) happen inside one `prisma.$transaction`.
- **Orders** accept an `Idempotency-Key` header (8–100 chars `[A-Za-z0-9_-]`).
  A repeat with the same key returns the original order with `replayed: true`.

## Background jobs

`jobs/subscriptionExpiry.js` runs hourly in each API process:

1. Expires active subscriptions past `endDate` and sets `Vendor.listingsHidden`
   when the vendor has no other active plan (products disappear from the catalog).
2. Sends one reminder (in-app + email) 7 days before `endDate`.

Every state change is a conditional update, so several replicas can run it
safely. Set `DISABLE_JOBS=true` to turn it off for a process.

## Tests

```bash
eval "$(./scripts/test-db.sh start)"   # throwaway local Postgres (CI sets TEST_DATABASE_URL)
npm test
```

Each test file creates its own database, applies the real migrations with
`prisma migrate deploy`, and drops the database afterwards.

## Database migrations — production runbook

The original migration history did not match the live schema (production was
built with `prisma db push`). It has been replaced by a baseline
(`00000000000000_baseline`) that reproduces the schema as it was before the
Phase 0 changes. The old migrations are kept in `docs/archive/migrations/`.

**One-time, before deploying this version** (run against production with
`DATABASE_URL` / `DIRECT_URL` set):

```bash
# 1. Back up first (Neon: create a branch or confirm point-in-time restore).
# 2. Confirm production matches the baseline. This must print only an empty
#    script (or "-- This is an empty migration."); resolve any differences first:
git show ebe6933:prisma/schema.prisma > /tmp/baseline.prisma
npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel /tmp/baseline.prisma --script
# 3. If a _prisma_migrations table exists from the old history, clear the stale rows:
#    DELETE FROM "_prisma_migrations" WHERE migration_name IN
#      ('20260519110000_init', '20260526193000_native_auth');
# 4. Record the baseline as already applied:
npx prisma migrate resolve --applied 00000000000000_baseline
# 5. Apply the new migrations (drop clerkId, Phase 1):
npx prisma migrate deploy
```

Then deploy the code. Order matters: the Phase 1 code expects the new tables
and `DECIMAL` columns.

**From then on**, every deploy runs `npx prisma migrate deploy` before the new
code starts. On Railway, add it as the pre-deploy command once the baseline is
in place:

```json
{ "deploy": { "preDeployCommand": "npx prisma migrate deploy" } }
```

Never run `prisma db push` or `migrate reset` against production.
