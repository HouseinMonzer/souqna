# SouqNa — Premium Overhaul Prompt

> Paste everything below the line into Claude Code (or any agentic coding tool) at the repo root.
> Run it **one phase per session**. Each phase ends green (build + lint + smoke test) and is committed before the next starts.

---

## ROLE

You are the full SouqNa product team in one agent:

- **Principal Engineer** — architecture, code quality, performance
- **Senior Product Designer (UI/UX)** — design system, flows, micro-interactions, RTL
- **Security Engineer** — auth, input validation, secrets, OWASP Top 10
- **DevOps / CI-CD Engineer** — pipelines, environments, observability
- **QA Lead** — tests, regression checks, acceptance criteria
- **SEO & Growth** — metadata, performance budgets, conversion

You ship production work, not demos. Keep going without asking for confirmation, except for decisions that can't be undone (dropping data, rotating secrets, changing payment logic). For those, stop and ask.

## PROJECT CONTEXT (verified from the repo)

SouqNa is a bilingual (Arabic/English, RTL/LTR) multi-vendor marketplace for Lebanon.

| Layer | Current state |
|---|---|
| Frontend | React 19 + TS + Vite 8, Tailwind v4 (installed but barely used), Zustand, react-router 7, i18next (`client/src/locales/{en,ar}.json`) |
| Backend | Express 4, a **single 1,931-line `server/index.js`**, Prisma 6, Neon Postgres |
| Auth | **Three overlapping systems:** native JWT cookie + bcrypt, Passport Google/Facebook, and leftover Clerk (`@clerk/react` pinned to `latest`, `@clerk/express`) |
| Uploads | **Three providers:** UploadThing on the server, ImgBB key in the client, Cloudinary in docs and env |
| Payments | Wish Money, OMT, cash on delivery, credit card (manual proof plus admin approval) |
| Deploy | API on Railway (Nixpacks), client on Vercel |
| Styling | **500+ inline `style={{}}` objects** (AdminDashboard 188, DashboardPage 105), and a palette of #F7F2E8 / #2D4A1E / #5C8A2E / #A3C46C |
| Known gaps (AUDIT_REPORT.md) | Mobile 5/10, no code splitting, no pagination, no wishlist, no order tracking, no subscription expiry job, no tests, no CI |

Red flags to fix first:
- `client/.env.local`, `server.log` and `server-output.txt` are committed to git.
- `CLAUDE_PROMPT.md` holds shared demo credentials.
- Money is stored as `Float` (`price`, `total`, `amount`). That causes rounding bugs.
- Zod is installed but not used to validate every route.

---

## NON-NEGOTIABLES

1. **No regressions.** Every existing route, page and API contract keeps working, or gets migrated along with its callers.
2. **RTL-first.** Every component works in `dir="rtl"` and `dir="ltr"`. Use logical CSS (`ms-*`, `me-*`, `ps-*`, `start-*`, `text-start`). Never use `left`/`right`.
3. **No hardcoded UI strings.** Every user-facing string goes through i18next with both `en` and `ar` keys.
4. **Type-safe end to end.** No new `any`. Shared Zod schemas generate both the API validation and the frontend types.
5. **Accessible.** WCAG 2.2 AA: keyboard navigation, visible focus, 4.5:1 contrast, labeled inputs, `prefers-reduced-motion` respected.
6. **Small commits.** Use conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`, `ci:`), one logical change each.
7. **Verify before claiming done.** Run `npm run build`, run lint, and click through the changed flows in a real browser (Playwright). Report any failure honestly.

---

## PHASE 0 — Security & Hygiene (do first, blocks everything)

- [ ] Remove `client/.env.local`, `server.log` and `server-output.txt` from git (`git rm --cached`) and extend `.gitignore` (`*.log`, `.env*`, `!.env.example`).
- [ ] **Stop and tell me** which keys need rotating (ImgBB, Clerk, anything in git history). Do not rewrite history without my approval.
- [ ] Move demo credentials out of `CLAUDE_PROMPT.md` into a seed script that reads them from env. Delete the stale prompt and report files (`FIX_PROMPT.md`, `FIX_REPORT.md`, `CLAUDE_PROMPT.md`) or move them to `docs/archive/`.
- [ ] **Consolidate auth into one system:** keep native JWT (httpOnly, `Secure`, `SameSite=Lax` cookie) plus Passport OAuth. Remove Clerk completely, including packages, `ApiTokenBridge`, the `clerkId` column (via migration) and env vars.
- [ ] **Consolidate uploads into one provider** (recommended: Cloudinary, using signed server-side uploads plus transformation URLs). Remove the ImgBB key from the client: **no third-party secret may reach the browser.**
- [ ] Add a Zod schema to **every** route body, query and param, plus a central error handler that never leaks stack traces in production.
- [ ] Add authorization checks: customers can read only their own orders, vendors can touch only their own products and order items, admins only on `/api/admin/*`. Write a test per rule.
- [ ] Harden Helmet with a strict CSP, set CORS to an allowlist from env, apply rate limits to auth, upload and order routes, and enforce file type and size on uploads (magic-byte check, not just the extension).
- [ ] Add a startup env check with a Zod schema over `process.env`, so the server fails fast if config is missing.

**Acceptance:** the security checklist passes, `npm audit --omit=dev` shows no high or critical issues, and no secrets are in the tree.

---

## PHASE 1 — Backend Architecture

Split the monolith into a layered, testable structure (TypeScript; migrate gradually if needed):

```
server/
  src/
    app.ts              # express app factory (no listen)
    index.ts            # bootstrap + listen
    config/env.ts       # zod-validated env
    lib/{prisma,logger,mailer,storage}.ts
    middleware/{auth,rbac,validate,error,rateLimit,requestId}.ts
    modules/
      auth/      {routes,controller,service,schema}.ts
      vendors/   ...
      products/  ...
      orders/    ...
      admin/     ...
      subscriptions/ ...
    jobs/subscriptionExpiry.ts
  test/
```

- [ ] **Money:** migrate every money `Float` column to `Decimal @db.Decimal(12,2)`, or store integer cents. Write a migration that converts the existing data safely.
- [ ] **Order creation in one `prisma.$transaction`:** lock and decrement stock, recompute prices on the server (never trust client prices), and write an idempotency key to prevent duplicate orders.
- [ ] Add cursor or offset pagination with `limit` capped at 50 to every list endpoint (products, vendors, admin lists).
- [ ] Add product search with Postgres full-text search (`tsvector`, with Arabic and English config) or `pg_trgm`, plus filters for category, price range, vendor and rating, and sort by newest, price or popularity.
- [ ] Add new models and endpoints: `Review` (verified purchase only), `Wishlist`, `Address`, `Notification`, and `OrderStatusHistory` for tracking.
- [ ] Add a subscription expiry job (node-cron or a Railway cron): expire subscriptions past their end date, hide those vendors' products, and email a warning 7 days before.
- [ ] Add structured logging (pino) with a request ID, plus `/api/health` (liveness) and `/api/ready` (database ping).
- [ ] Use Zod plus `zod-to-openapi` to generate OpenAPI docs and serve them at `/api/docs` in non-production environments.

**Acceptance:** all existing client calls still work, and new endpoints are covered by integration tests (Vitest + Supertest against a test database).

---

## PHASE 2 — Design System (Senior Product Designer)

Brand direction: **"Modern Levantine Souq"**. Warm, earthy and trustworthy, with editorial typography and generous whitespace. Think Aesop × Shopify × Etsy, with a local soul.

- [ ] **Tokens** in Tailwind v4 `@theme` (`client/src/index.css`):
  - Colors: evolve the current palette into a full scale. `brand-50…950` (olive green from #2D4A1E), `sand-50…950` (from #F7F2E8), `accent` (warm terracotta or saffron for CTAs), plus semantic `success`, `warning`, `danger` and `info`. Include dark-mode tokens.
  - Type: **Inter** or **Geist** for Latin, **IBM Plex Sans Arabic** or **Cairo** for Arabic, loaded with `font-display: swap`. A fluid type scale using `clamp()`.
  - Spacing on a 4px grid, radius (`sm 6`, `md 10`, `lg 16`, `xl 24`, `full`), and three shadow elevations.
  - Motion: 150ms, 250ms and 400ms durations with a standard easing curve, all disabled under `prefers-reduced-motion`.
- [ ] **Remove every inline `style={{}}`** and replace it with Tailwind utilities and tokens. Use `cn()` (clsx + tailwind-merge, already installed).
- [ ] **Component library** in `client/src/components/ui/`, with one file per component, accessible, RTL-safe and variant-driven with `cva`:
  `Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Label, FormField, Card, Badge, Avatar, Dialog, Drawer, Sheet, DropdownMenu, Tabs, Tooltip, Toast, Skeleton, EmptyState, Pagination, Breadcrumbs, Rating, PriceTag, QuantityStepper, ImageGallery, DataTable`
  (Radix UI primitives or shadcn/ui as the base are recommended.)
- [ ] Icons: **lucide-react**, used consistently with no emoji as UI icons.
- [ ] Use a `/design` dev-only route or Storybook to showcase every component in LTR, RTL, light and dark.

---

## PHASE 3 — UX & Page Redesign

Design every page mobile-first (360px, then 768px, then 1280px and up), then enhance for larger screens.

| Page | Must have |
|---|---|
| **Navbar** | Sticky with a blur backdrop, command-style search with live suggestions (debounced at 250ms), an animated cart badge, a language toggle, an account menu, and a mobile drawer plus a **bottom tab bar** on mobile |
| **Home** | Hero with a clear value proposition and two CTAs, a category rail, featured vendors, trending products, trust signals (verified vendors, local payment methods, delivery), a "Become a vendor" band, and a footer with a newsletter signup |
| **Shop** | Filters in a sidebar on desktop and a sheet on mobile, chips for active filters, URL-synced state, a sort dropdown, infinite scroll or "Load more", skeletons, and an empty state that suggests next steps |
| **Product** | Gallery with zoom and swipe, a sticky buy box on desktop and a sticky add-to-cart bar on mobile, a variant selector, quantity stepper, stock indicator, vendor card, reviews with a rating breakdown, related products, and JSON-LD `Product` markup |
| **Vendor storefront** | Cover, logo, verified badge, rating, social links, WhatsApp CTA, tabs (Products / About / Reviews), and in-store search |
| **Cart → Checkout** | Grouped by vendor, a 3-step checkout (Address → Payment → Review), saved addresses, clear instructions for each payment method (Wish/OMT proof upload), order summary, and an optimistic loading state |
| **Account** | Orders with a status timeline (tracking), wishlist, addresses, profile and security settings |
| **Vendor dashboard** | KPI cards, a sales chart (Recharts), product CRUD with a drag-and-drop image uploader, order fulfilment, subscription status, and storefront settings |
| **Admin** | Data tables with server-side pagination, search and bulk actions, an analytics overview with charts, an approvals queue, an audit log and site settings |
| **Auth** | Split-screen layout, social buttons, inline validation, a password strength meter, and a polished verify-email flow |
| **System pages** | Branded 404 and 500 pages, a maintenance-mode page, and offline-aware toasts |

Microcopy: friendly, short and action-led, in both languages. Have a native Arabic speaker review the `ar.json` tone; avoid literal machine translation.

---

## PHASE 4 — Frontend Engineering

- [ ] **TanStack Query** for all server state (caching, retries, optimistic cart and wishlist). Zustand holds only UI and cart state.
- [ ] **React Hook Form + Zod**, reusing the shared schemas from the backend in a `packages/shared` workspace (npm workspaces).
- [ ] Route-level code splitting with `React.lazy` and `Suspense`, an error boundary per route, and prefetch on link hover.
- [ ] **Images:** responsive `srcset` through Cloudinary transforms, `loading="lazy"`, explicit width and height (zero CLS), AVIF/WebP, and blur placeholders.
- [ ] **Performance budget:** initial JS under 170KB gzipped, LCP under 2.5s, INP under 200ms and CLS under 0.1 on a mid-range mobile device over 4G.
- [ ] Use `@tailwindcss/vite` only and drop unused CSS (`App.css`). Pin `@clerk/react` before deleting it, and never use `latest` in package.json again.
- [ ] Make it a PWA: manifest, icons, an offline fallback, and add-to-home-screen support (most traffic in Lebanon is mobile).

---

## PHASE 5 — SEO & Growth

- [ ] Per-route `<title>`, meta description, canonical URL, Open Graph and Twitter tags (react-helmet-async), with `hreflang` for ar and en.
- [ ] JSON-LD for `Organization`, `WebSite` + `SearchAction`, `Product`, `BreadcrumbList` and `LocalBusiness` (vendors).
- [ ] A `sitemap.xml` generated from the database (products, vendors, categories) and a `robots.txt`.
- [ ] Clean slugs (`/p/:slug`, `/store/:slug`, `/c/:slug`), with 301 redirects from the old paths.
- [ ] Analytics: PostHog or Plausible, with events for `view_item`, `add_to_cart`, `begin_checkout`, `purchase` and `vendor_signup`.
- [ ] Consider pre-rendering or SSR for product and vendor pages (Vite SSR, or a future migration to Next.js or React Router framework mode). Write the trade-offs in `docs/adr/`.

---

## PHASE 6 — QA & Testing

- [ ] **Unit tests:** Vitest for utilities, stores and Zod schemas.
- [ ] **Component tests:** Testing Library for the UI kit, including RTL rendering snapshots.
- [ ] **API integration tests:** Supertest against an ephemeral Postgres (Neon branch or Docker) covering auth, RBAC, order transactions and subscriptions.
- [ ] **E2E tests:** Playwright for the critical paths: register, then verify, then log in, then browse, then add to cart, then check out, then see the order in the account. Also vendor onboarding through product creation and admin approval. Run both in `ar` and `en`, at mobile and desktop viewports.
- [ ] **Accessibility:** `@axe-core/playwright` on every page, with zero serious violations.
- [ ] **Visual regression:** Playwright screenshots of key pages.

---

## PHASE 7 — CI/CD & Ops

- [ ] **GitHub Actions** `ci.yml` on every PR: install with cache, then typecheck, then lint, then unit and integration tests, then build, then Playwright E2E against a preview build, then upload a Lighthouse CI report (fail if below the budget).
- [ ] `deploy.yml`: on merge to `main`, run `prisma migrate deploy` and deploy the API to Railway. The client deploys through Vercel preview and production environments.
- [ ] Use **separate environments** (dev, preview and production) with a Neon branch per preview. Keep secrets only in GitHub, Railway and Vercel, never in the repo.
- [ ] Set up Dependabot or Renovate, CodeQL, and secret scanning.
- [ ] Add Sentry to both frontend and backend with source maps, uptime monitoring on `/api/ready`, and daily database backups (Neon point-in-time restore verified).
- [ ] Add pre-commit hooks with Husky + lint-staged (ESLint, Prettier, typecheck on changed files) and commitlint.
- [ ] Write `README.md` as a real onboarding doc: architecture diagram (Mermaid), local setup in 5 minutes, env reference, scripts and a deploy runbook.

---

## OUTPUT FORMAT FOR EACH PHASE

At the end of each phase, report:

1. **Summary:** what changed and why, in 3–6 bullets.
2. **Files:** created, modified and deleted.
3. **Verification:** the exact commands you ran and their results (build, lint, tests, Lighthouse scores).
4. **Screenshots:** key pages before and after, mobile and desktop, AR and EN.
5. **Risks and follow-ups:** anything deferred, with a reason.
6. **Action needed from me:** secrets to rotate, env vars to add, decisions to make.

Start with **Phase 0**. Read `AUDIT_REPORT.md`, `prisma/schema.prisma`, `server/index.js` and `client/src/App.tsx` first, then propose a 10-line plan, then execute.
