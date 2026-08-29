# Architecture

The app is a single-tenant white-label template. A developer copies the master project once per client and connects that copy to a completely independent Supabase and Vercel deployment.

## Runtime Shape

- Public pages use Server Components where possible.
- Mutations use Server Actions for enquiries, quote requests, and admin catalogue changes.
- Route Handlers are reserved for HTTP entry points: referral landing, webhooks, and future jobs.
- Supabase Auth owns identity. Application roles live in `profiles`.
- Drizzle owns typed PostgreSQL access and migrations.

## Portals

- Public/customer: browse, search, filter, compare, request best price, enquire through WhatsApp, optional accounts.
- Admin: catalogue, CRM, dealers, marketing, analytics, settings, audit logs.
- Dealer: own referral link, QR code, referral analytics, leads, conversions, commissions, payouts.

## Server Boundaries

Client Components never receive database credentials, service-role keys, WhatsApp tokens, or internal dealer IDs. Protected data access must call central auth helpers and filter by the authenticated role/dealer server-side.

## White Labeling

Business settings and feature flags are stored in the database with safe defaults in `src/lib/shop-config.ts`. The intended workflow is to edit branding and operational values through Admin -> Settings after each client deployment is initialized.
