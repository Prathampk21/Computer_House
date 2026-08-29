-- Optional hardening script. Run after Drizzle migrations in each Supabase project.
-- Server Actions still perform authorization checks; RLS protects direct Supabase access.

alter table profiles enable row level security;
alter table dealers enable row level security;
alter table leads enable row level security;
alter table lead_items enable row level security;
alter table commissions enable row level security;
alter table commission_payouts enable row level security;
alter table customers enable row level security;
alter table customer_subscriptions enable row level security;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_app_role()
returns app_role
language sql
stable
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_dealer_id()
returns uuid
language sql
stable
as $$
  select d.id
  from public.dealers d
  join public.profiles p on p.id = d.profile_id
  where p.auth_user_id = auth.uid()
  limit 1
$$;

drop policy if exists "Profiles can read themselves" on profiles;
create policy "Profiles can read themselves"
on profiles for select
using (auth_user_id = auth.uid() or current_app_role() in ('OWNER', 'ADMIN'));

drop policy if exists "Admins manage profiles" on profiles;
create policy "Admins manage profiles"
on profiles for all
using (current_app_role() in ('OWNER', 'ADMIN'))
with check (current_app_role() in ('OWNER', 'ADMIN'));

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

drop policy if exists "Dealers read own leads" on leads;
create policy "Dealers read own leads"
on leads for select
using (
  dealer_id = current_dealer_id()
  or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
);

drop policy if exists "Staff manage leads" on leads;
create policy "Staff manage leads"
on leads for all
using (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'))
with check (current_app_role() in ('OWNER', 'ADMIN', 'STAFF'));

drop policy if exists "Dealers read own lead items" on lead_items;
create policy "Dealers read own lead items"
on lead_items for select
using (
  exists (
    select 1 from leads
    where leads.id = lead_items.lead_id
      and (
        leads.dealer_id = current_dealer_id()
        or current_app_role() in ('OWNER', 'ADMIN', 'STAFF')
      )
  )
);

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
