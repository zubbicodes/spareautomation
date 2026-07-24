---
kind: external_dependency
name: Shopify Storefront + Admin APIs (B2B e-commerce backend)
slug: shopify
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
    - client_constraint
scope:
    - '**'
---

### Identity & role
- Shopify is the commerce backend powering product catalogue, cart/checkout, customer accounts and draft-order-based quote creation for the Spares Automation storefront.

### Integration points
- Storefront API: `src/lib/shopify/storefront.server.ts` — reads products/collections/cart via `/api/{version}/graphql.json`, preferring the private token (`Shopify-Storefront-Private-Token`) over the public one (`X-Shopify-Storefront-Access-Token`).
- Admin API: `src/lib/shopify/admin.server.ts` — writes draft orders for website quotes via `/admin/api/{version}/graphql.json` using `X-Shopify-Access-Token` with the `write_draft_orders` scope.
- Server functions in `src/lib/api/shopify.functions.ts` wrap both APIs behind TanStack Start `createServerFn`s (cart mutations, login/register/password-reset, quote submission).
- Customer sessions are stored server-side in a signed cookie named `sa_customer_access_token_session` keyed by `APP_SESSION_SECRET`; access tokens are never sent to the browser.

### Auth / secrets shape
- Secrets come from env vars documented in `.env.example`: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, plus `APP_SESSION_SECRET` for the session cookie. The default API version is `2026-01`.

### Stable usage notes
- Quote flow creates a Shopify Draft Order tagged `Website quote request` / `Awaiting sales review` rather than processing payment on-site; checkout is delegated to the hosted Shopify checkout URL.
- Customer Account API requires HTTPS callback URLs per the .env comments.
- Verify exact GraphQL field names against the current Storefront/Admin API docs when extending queries.