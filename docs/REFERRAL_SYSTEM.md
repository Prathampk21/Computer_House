# Referral System

Dealers share one general homepage link:

```text
https://clientdomain.com/?ref=DEALER-A
```

They do not need product-specific URLs.

## Flow

1. Visitor opens `/?ref=CODE`.
2. `src/proxy.ts` redirects to `/api/referral?ref=CODE`.
3. The route validates the code and resolves the active dealer.
4. A referral click is recorded separately from leads.
5. Secure visitor and attribution cookies are set.
6. The visitor returns to the clean homepage.
7. Later enquiries read the attribution and attach the lead to that dealer.

## Attribution Rule

Default attribution is first-touch for 30 days. A second dealer link during the active window records a click but does not overwrite the existing attribution. Admin overrides require a reason, actor, timestamp, and audit log entry.

## Metrics

Track clicks, unique visitors, sessions, product views, compare events, WhatsApp clicks, portal enquiries, qualified leads, sales, and commission separately. Commission is never based on clicks.
