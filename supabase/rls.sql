-- Run after Drizzle migrations in each independent Supabase project.
-- Server Actions enforce authorization as well; RLS is defense in depth for
-- authenticated browser access through Supabase.

alter table profiles enable row level security;
alter table shop_settings enable row level security;
alter table feature_flags enable row level security;
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table specification_definitions enable row level security;
alter table product_specification_values enable row level security;
alter table offers enable row level security;
alter table product_offers enable row level security;
alter table dealers enable row level security;
alter table visitor_sessions enable row level security;
alter table referral_clicks enable row level security;
alter table product_views enable row level security;
alter table comparison_events enable row level security;
alter table whatsapp_click_events enable row level security;
alter table customers enable row level security;
alter table leads enable row level security;
alter table lead_items enable row level security;
alter table lead_status_history enable row level security;
alter table lead_notes enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table commissions enable row level security;
alter table commission_payouts enable row level security;
alter table customer_subscriptions enable row level security;
alter table product_change_events enable row level security;
alter table notification_jobs enable row level security;
alter table notification_logs enable row level security;
alter table audit_logs enable row level security;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid() and active = true
  limit 1
$$;

create or replace function public.current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.profiles
  where auth_user_id = auth.uid() and active = true
  limit 1
$$;

create or replace function public.current_dealer_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d.id
  from public.dealers d
  join public.profiles p on p.id = d.profile_id
  where p.auth_user_id = auth.uid()
    and p.active = true
    and d.active = true
  limit 1
$$;

drop policy if exists "Profiles can read themselves" on profiles;
create policy "Profiles can read themselves"
on profiles for select
using (
  auth_user_id = auth.uid()
  or current_app_role() in ('OWNER', 'ADMIN')
);

drop policy if exists "Admins manage profiles" on profiles;
create policy "Admins manage profiles"
on profiles for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Public reads shop settings" on shop_settings;
create policy "Public reads shop settings"
on shop_settings for select
to anon, authenticated
using (true);

drop policy if exists "Public reads feature flags" on feature_flags;
create policy "Public reads feature flags"
on feature_flags for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage shop configuration" on shop_settings;
create policy "Admins manage shop configuration"
on shop_settings for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Admins manage feature flags" on feature_flags;
create policy "Admins manage feature flags"
on feature_flags for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Public reads active categories" on categories;
create policy "Public reads active categories"
on categories for select
to anon, authenticated
using (active = true or current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Public reads active brands" on brands;
create policy "Public reads active brands"
on brands for select
to anon, authenticated
using (active = true or current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Public reads published products" on products;
create policy "Public reads published products"
on products for select
to anon, authenticated
using (published = true or current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Public reads product images" on product_images;
create policy "Public reads product images"
on product_images for select
to anon, authenticated
using (
  exists (
    select 1 from products
    where products.id = product_images.product_id
      and (products.published = true or current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
  )
);

drop policy if exists "Public reads specification definitions" on specification_definitions;
create policy "Public reads specification definitions"
on specification_definitions for select
to anon, authenticated
using (true);

drop policy if exists "Public reads product specifications" on product_specification_values;
create policy "Public reads product specifications"
on product_specification_values for select
to anon, authenticated
using (
  exists (
    select 1 from products
    where products.id = product_specification_values.product_id
      and (products.published = true or current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
  )
);

drop policy if exists "Public reads active offers" on offers;
create policy "Public reads active offers"
on offers for select
to anon, authenticated
using (
  (active = true and starts_at <= now() and ends_at >= now())
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Public reads product offers" on product_offers;
create policy "Public reads product offers"
on product_offers for select
to anon, authenticated
using (true);

drop policy if exists "Catalog managers manage catalogue" on categories;
create policy "Catalog managers manage catalogue"
on categories for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage brands" on brands;
create policy "Catalog managers manage brands"
on brands for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage products" on products;
create policy "Catalog managers manage products"
on products for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage product images" on product_images;
create policy "Catalog managers manage product images"
on product_images for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage specification definitions" on specification_definitions;
create policy "Catalog managers manage specification definitions"
on specification_definitions for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage product specifications" on product_specification_values;
create policy "Catalog managers manage product specifications"
on product_specification_values for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage offers" on offers;
create policy "Catalog managers manage offers"
on offers for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Catalog managers manage product offers" on product_offers;
create policy "Catalog managers manage product offers"
on product_offers for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Dealers read own dealer row" on dealers;
create policy "Dealers read own dealer row"
on dealers for select
using (
  id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Admins manage dealers" on dealers;
create policy "Admins manage dealers"
on dealers for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Dealers read own visitor sessions" on visitor_sessions;
create policy "Dealers read own visitor sessions"
on visitor_sessions for select
using (
  first_dealer_id = current_dealer_id()
  or visitor_sessions.current_dealer_id = public.current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Dealers read own referral clicks" on referral_clicks;
create policy "Dealers read own referral clicks"
on referral_clicks for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Dealers read own product views" on product_views;
create policy "Dealers read own product views"
on product_views for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Dealers read own comparison events" on comparison_events;
create policy "Dealers read own comparison events"
on comparison_events for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Dealers read own whatsapp clicks" on whatsapp_click_events;
create policy "Dealers read own whatsapp clicks"
on whatsapp_click_events for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manages visitor sessions" on visitor_sessions;
create policy "Staff manages visitor sessions"
on visitor_sessions for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff manages referral clicks" on referral_clicks;
create policy "Staff manages referral clicks"
on referral_clicks for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff manages product views" on product_views;
create policy "Staff manages product views"
on product_views for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff manages comparison events" on comparison_events;
create policy "Staff manages comparison events"
on comparison_events for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff manages whatsapp clicks" on whatsapp_click_events;
create policy "Staff manages whatsapp clicks"
on whatsapp_click_events for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Customers read themselves" on customers;
create policy "Customers read themselves"
on customers for select
using (
  auth_user_id = auth.uid()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manages customers" on customers;
create policy "Staff manages customers"
on customers for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Users read their leads" on leads;
create policy "Users read their leads"
on leads for select
using (
  dealer_id = current_dealer_id()
  or exists (
    select 1 from customers
    where customers.id = leads.customer_id
      and customers.auth_user_id = auth.uid()
  )
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manage leads" on leads;
create policy "Staff manage leads"
on leads for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Users read related lead items" on lead_items;
create policy "Users read related lead items"
on lead_items for select
using (
  exists (
    select 1 from leads
    join customers on customers.id = leads.customer_id
    where leads.id = lead_items.lead_id
      and (
        leads.dealer_id = current_dealer_id()
        or customers.auth_user_id = auth.uid()
        or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
      )
  )
);

drop policy if exists "Staff manages lead items" on lead_items;
create policy "Staff manages lead items"
on lead_items for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Users read lead status history" on lead_status_history;
create policy "Users read lead status history"
on lead_status_history for select
using (
  exists (
    select 1 from leads
    join customers on customers.id = leads.customer_id
    where leads.id = lead_status_history.lead_id
      and (
        leads.dealer_id = current_dealer_id()
        or customers.auth_user_id = auth.uid()
        or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
      )
  )
);

drop policy if exists "Staff manages lead status history" on lead_status_history;
create policy "Staff manages lead status history"
on lead_status_history for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Dealers read visible lead notes" on lead_notes;
create policy "Dealers read visible lead notes"
on lead_notes for select
using (
  (
    dealer_visible = true
    and exists (
      select 1 from leads
      where leads.id = lead_notes.lead_id
        and leads.dealer_id = current_dealer_id()
    )
  )
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manages lead notes" on lead_notes;
create policy "Staff manages lead notes"
on lead_notes for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Users read related sales" on sales;
create policy "Users read related sales"
on sales for select
using (
  dealer_id = current_dealer_id()
  or exists (
    select 1 from customers
    where customers.id = sales.customer_id
      and customers.auth_user_id = auth.uid()
  )
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manages sales" on sales;
create policy "Staff manages sales"
on sales for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Users read related sale items" on sale_items;
create policy "Users read related sale items"
on sale_items for select
using (
  exists (
    select 1 from sales
    join customers on customers.id = sales.customer_id
    where sales.id = sale_items.sale_id
      and (
        sales.dealer_id = current_dealer_id()
        or customers.auth_user_id = auth.uid()
        or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
      )
  )
);

drop policy if exists "Staff manages sale items" on sale_items;
create policy "Staff manages sale items"
on sale_items for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Dealers read own commissions" on commissions;
create policy "Dealers read own commissions"
on commissions for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Admins manage commissions" on commissions;
create policy "Admins manage commissions"
on commissions for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Dealers read own payouts" on commission_payouts;
create policy "Dealers read own payouts"
on commission_payouts for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Admins manage payouts" on commission_payouts;
create policy "Admins manage payouts"
on commission_payouts for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Customers read own subscriptions" on customer_subscriptions;
create policy "Customers read own subscriptions"
on customer_subscriptions for select
using (
  exists (
    select 1 from customers
    where customers.id = customer_subscriptions.customer_id
      and customers.auth_user_id = auth.uid()
  )
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manages subscriptions" on customer_subscriptions;
create policy "Staff manages subscriptions"
on customer_subscriptions for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff manages product change events" on product_change_events;
create policy "Staff manages product change events"
on product_change_events for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff manages notification jobs" on notification_jobs;
create policy "Staff manages notification jobs"
on notification_jobs for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Staff reads notification logs" on notification_logs;
create policy "Staff reads notification logs"
on notification_logs for select
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Admins read audit logs" on audit_logs;
create policy "Admins read audit logs"
on audit_logs for select
using (current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Admins write audit logs" on audit_logs;
create policy "Admins write audit logs"
on audit_logs for insert
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));
