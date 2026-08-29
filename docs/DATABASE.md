# Database

The schema is normalized for a computer/electronics shop without tenant columns. Every client deployment uses its own database.

## Core Tables

- Identity/settings: `profiles`, `shop_settings`, `feature_flags`
- Catalogue: `categories`, `brands`, `products`, `product_images`, `specification_definitions`, `product_specification_values`, `offers`, `product_offers`
- Dealers/referrals: `dealers`, `visitor_sessions`, `referral_clicks`
- Analytics events: `product_views`, `comparison_events`, `whatsapp_click_events`
- CRM: `customers`, `leads`, `lead_items`, `lead_status_history`, `lead_notes`
- Sales/commission: `sales`, `sale_items`, `commissions`, `commission_payouts`
- Notifications: `customer_subscriptions`, `product_change_events`, `notification_jobs`, `notification_logs`
- Governance: `audit_logs`

## Dynamic Specifications

Do not hard-code laptop fields in `products`. Admins define category-specific fields in `specification_definitions`; values are stored in `product_specification_values`.

## Important Indexes

The schema indexes product slug, SKU, category, brand, condition, stock status, dealer referral code, visitor token, lead number, dealer leads, product views, notification status, and created timestamps.

## RLS

Use Supabase RLS for direct client access and keep server-side authorization checks in the data access layer. Dealer policies must restrict rows by the authenticated dealer profile. Owner/admin/staff actions should be audited.
