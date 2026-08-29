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

drop policy if exists "Public branding assets are readable" on storage.objects;
create policy "Public branding assets are readable"
on storage.objects for select
using (bucket_id = 'branding');
