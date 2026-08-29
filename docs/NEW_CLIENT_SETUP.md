# New Client Setup

Use this when creating a completely independent deployment for another shop.

1. Copy the master template to a new folder.
2. Create a new Git repository and first commit.
3. Create a new Supabase project.
4. Add `DATABASE_URL`, Supabase URL, publishable key, and service-role key.
5. Run `npm run db:generate` and `npm run db:migrate`.
6. Run `npm run db:seed` for starter catalogue data.
7. Create Supabase Storage buckets.
8. Configure Supabase Auth redirect URLs.
9. Visit `/setup` and create the first owner user/profile.
10. Sign in at `/login`.
11. Update shop settings, branding, WhatsApp number, currency, timezone, and feature flags.
12. Create dealers and verify referral codes.
13. Create a Vercel project and set production env vars.
14. Add the client's custom domain.
15. Test referral tracking, enquiries, dealer access, product updates, notifications, and build.

No deployment should depend on any other client's database, storage, auth, analytics, notifications, or domain.
