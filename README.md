# Computer House

A single-tenant, reusable Next.js template for Computer House and future computer/electronics retailers. Each client copy gets its own repository, Supabase project, PostgreSQL database, Supabase Auth, Storage buckets, Vercel project, environment variables, domain, products, dealers, leads, analytics, and notification data.

This project intentionally does not use `tenant_id` or a shared multi-tenant database.

## Stack

- Next.js App Router, React, TypeScript, Server Components, Server Actions
- Supabase Auth, PostgreSQL, Storage, and `@supabase/ssr`
- Drizzle ORM and Drizzle Kit migrations
- Tailwind CSS, shadcn/ui-style components, Lucide icons
- Zod validation, React Hook Form-ready dependencies, Recharts dashboards
- Vercel-compatible deployment

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app can run in demo mode without secrets. Production deployments should set `APP_DEMO_MODE=false` and configure Supabase and database variables.

## Environment

Public variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `WHATSAPP_PHONE_NUMBER`

Never expose service-role keys, database credentials, or provider tokens in Client Components.

## Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The Drizzle schema lives in `src/db/schema.ts` and covers profiles, shop settings, feature flags, catalogue, dynamic specs, dealers, visitor sessions, referral clicks, product analytics, customers, leads, lead items, sales, commissions, subscriptions, product change events, notification jobs/logs, and audit logs.

## Supabase Setup

1. Create a new Supabase project for each client.
2. Copy the project URL and publishable key into Vercel and `.env.local`.
3. Add the service-role key only to server runtime environments.
4. Run Drizzle migrations against the new database.
5. Create Storage buckets for product images and branding assets.
6. Configure Supabase Auth redirect URLs for local and production domains.
7. Create the first `OWNER` profile after the first auth user exists.

## Portals

- Public catalogue: `/`
- Product details: `/products/[slug]`
- Comparison: `/compare`
- Offers: `/offers`
- Quote request: `/enquiry`
- Admin: `/admin`
- Dealer: `/dealer`
- Login: `/login`
- First owner setup: `/setup`

## Referral Flow

Dealer links use the homepage only:

```text
https://clientdomain.com/?ref=DEALER-A
```

The proxy sends referral visits to `/api/referral`, validates the non-sequential referral code, records the click, sets secure visitor and attribution cookies, preserves active first-touch attribution, and redirects back to the clean homepage. Product enquiries later read the current attribution cookie and should persist the dealer on the lead.

Clicks are analytics events. Leads are created only after meaningful enquiry actions.

## Notification Architecture

Product updates create `product_change_events`; eligible subscriptions become `notification_jobs`; providers write `notification_logs`. The `/api/jobs/notifications` route processes the outbox and is protected by `CRON_SECRET` in production. The included Vercel cron runs once daily by default so it is safe for Hobby projects; Pro projects can increase frequency later.

## Creating A New Client Deployment

1. Copy this master template to a new folder.
2. Create a new Git repository.
3. Create a new Supabase project.
4. Configure database, Auth, and Storage.
5. Copy `.env.example` to `.env.local` and fill values.
6. Run migrations and seed data.
7. Visit `/setup` once to create the first owner user/profile.
8. Update Admin -> Settings for branding and contact details.
9. Create a new Vercel project.
10. Set production environment variables.
11. Add the client domain.
12. Test auth, referral tracking, enquiries, dealer isolation, and production build.

See `docs/` for detailed architecture, database, referral, deployment, and new-client setup notes.

## Vercel Deploy

```bash
npm run deploy:preview
npm run deploy:production
```

These scripts use `npx --yes vercel@latest` so the Vercel CLI is not committed into the app dependency tree. Deployment requires either an interactive Vercel login on the machine or a `VERCEL_TOKEN`.

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

`npm audit --audit-level=moderate` currently reports a dev-only Drizzle Kit transitive `esbuild` advisory. The suggested force fix downgrades Drizzle Kit and is intentionally not applied.
