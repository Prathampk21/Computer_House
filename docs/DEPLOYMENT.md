# Deployment

The target production host is Vercel.

## Vercel

1. Create a new Vercel project from the client repository.
2. Set all public and server-only environment variables.
3. Set `APP_DEMO_MODE=false`.
4. Run migrations against the production Supabase PostgreSQL database.
5. Configure custom domain.
6. Add Supabase Auth redirect URLs for the production domain.
7. Visit `/setup` once to create the first owner account.
8. Verify product image domains and Storage bucket policies.
9. Run a production build before launch.

This template includes `vercel.json` and npm scripts:

```bash
npm run deploy:preview
npm run deploy:production
```

These scripts call `npx --yes vercel@latest`. The CLI requires either an interactive Vercel login on this machine or a `VERCEL_TOKEN`.

## Cron Jobs

`vercel.json` includes a daily cron:

```json
{
  "path": "/api/jobs/notifications",
  "schedule": "0 3 * * *"
}
```

Set `CRON_SECRET` in Vercel. Vercel sends it as a bearer token for cron invocations, and the route rejects unauthenticated production requests. Hobby Vercel projects are limited to daily cron frequency, so this template uses one daily run by default.

## Supabase Storage

Create buckets for:

- `product-images`
- `branding`
- `dealer-assets`

Uploads should validate file type, size, and ownership server-side. Public product images may be served from public buckets or signed URLs depending on shop requirements.

You can run the starter SQL in:

- `supabase/storage.sql`
- `supabase/rls.sql`

## Required Checks

- Browse catalogue without login.
- Open `/?ref=DEALER-A` and confirm clean homepage redirect.
- Create product enquiry and confirm dealer attribution.
- Confirm Dealer B cannot access Dealer A data.
- Change product price and confirm a product-change event plus notification jobs.
- Mark a lead WON, record sale, and confirm commission eligibility.
- Open `/setup` and create the first owner before visiting protected admin pages.
