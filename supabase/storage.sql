-- Run in the Supabase SQL editor for each independent client project.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-images',
    'product-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'branding',
    'branding',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon']
  ),
  (
    'dealer-assets',
    'dealer-assets',
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do nothing;

drop policy if exists "Public product images are readable" on storage.objects;
create policy "Public product images are readable"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "Catalog managers upload product images" on storage.objects;
create policy "Catalog managers upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active = true
      and profiles.role in ('OWNER', 'ADMIN', 'STAFF')
  )
);

drop policy if exists "Catalog managers update product images" on storage.objects;
create policy "Catalog managers update product images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active = true
      and profiles.role in ('OWNER', 'ADMIN', 'STAFF')
  )
)
with check (bucket_id = 'product-images');

drop policy if exists "Catalog managers delete product images" on storage.objects;
create policy "Catalog managers delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active = true
      and profiles.role in ('OWNER', 'ADMIN', 'STAFF')
  )
);

drop policy if exists "Public branding assets are readable" on storage.objects;
create policy "Public branding assets are readable"
on storage.objects for select
using (bucket_id = 'branding');

drop policy if exists "Admins upload branding assets" on storage.objects;
create policy "Admins upload branding assets"
on storage.objects for insert
with check (
  bucket_id = 'branding'
  and exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active = true
      and profiles.role in ('OWNER', 'ADMIN')
  )
);

drop policy if exists "Admins update branding assets" on storage.objects;
create policy "Admins update branding assets"
on storage.objects for update
using (
  bucket_id = 'branding'
  and exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active = true
      and profiles.role in ('OWNER', 'ADMIN')
  )
)
with check (bucket_id = 'branding');

drop policy if exists "Admins delete branding assets" on storage.objects;
create policy "Admins delete branding assets"
on storage.objects for delete
using (
  bucket_id = 'branding'
  and exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.active = true
      and profiles.role in ('OWNER', 'ADMIN')
  )
);
