# Supabase to Neon/Prisma/Clerk Migration

## What Changed

- Removed the browser database client and legacy database-check/seed scripts.
- Moved product, vendor, category, order, vendor dashboard, and admin data access behind the Express API.
- Replaced local JWT/password auth with Clerk-protected API routes and Clerk React sign-in/sign-up components.
- Rebuilt the Prisma schema for Neon PostgreSQL with local `User`, `Profile`, `Customer`, `Vendor`, `Product`, `Order`, and media metadata tables.
- Added Cloudinary configuration and `publicId` columns for image lifecycle support.
- Added `npm run check:no-supabase` to fail on old provider references.

## Environment

Required variables:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

For Vite, `client/vite.config.ts` exposes both `VITE_` and `NEXT_PUBLIC_` prefixes so the Clerk publishable key can keep the requested name.

## Database

- Prisma schema: `prisma/schema.prisma`
- Generated migration SQL: `prisma/migrations/20260519110000_init/migration.sql`
- Seed script: `prisma/seed.js`

Prisma Client generation and schema validation pass locally. Applying the migration to the configured Neon pooled URL failed with Prisma's schema engine returning an empty error, so apply the generated migration against a direct Neon connection string or retry after confirming the database connection.

## Verification

Completed:

- `npm.cmd install` in root and `client`
- `npm.cmd run prisma:generate`
- `npx.cmd prisma validate`
- `npm.cmd run lint` in `client`
- `npm.cmd run build` in `client`
- `npm.cmd run check:no-supabase`
- `node --check server/index.js`

Manual follow-up:

- Set Clerk and Cloudinary env vars locally/production.
- Apply the generated Prisma migration to Neon.
- Run `npm.cmd run seed` after the schema exists.
- Smoke-test Clerk sign-in, `/api/auth/me`, catalog pages, vendor product management, and admin routes with real Clerk users.
