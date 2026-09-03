# Complete CMS Content Management Plan

## Summary

Extend the existing PostgreSQL CMS into the source of truth for all English, non-product website content.

- Shopify remains responsible for products, variants, prices, inventory, collections, customers, quotes and orders.
- The CMS manages all existing page content, navigation/footer labels, contact details, category presentation, images, SEO, form copy, validation/error messages and transactional email wording.
- Existing routes remain fixed; clients cannot create new pages.
- Editors work with safe structured blocks rather than arbitrary HTML.
- Staff can edit drafts and previews; admins publish, restore revisions, manage media and manage CMS users.
- The public website retains compiled defaults so a CMS/database outage does not take down the storefront.

## Implementation

### 1. Content storage and contracts

Add migrations and Drizzle models for:

- `content_documents`
  - Fixed code-defined content key.
  - Draft and published JSON data.
  - Optimistic version number to prevent overwriting another editor’s changes.
  - Last editor, publisher and timestamps.
- `content_revisions`
  - Immutable snapshot of every published version.
  - Revision number, publisher and timestamp.
- `content_media`
  - Random public identifier, safe filename, MIME type, size, storage path and default alt text.
  - Publication/archive state and creator.
- `admin_audit_log`
  - Draft saves, publishes, restores, media operations and staff-account changes.
- Extend `staff_users` with active state, forced-password-change state and session version.

Create a typed content registry under `src/lib/content/` containing:

- A fixed `ContentKey` for each existing page or global content group.
- Zod schemas, labels, field limits and current compiled defaults.
- Structured block definitions such as hero, text, cards, list, steps, media and CTA.
- Typed message catalogues for forms, empty/error states, cookie text and emails.
- Allowed link types and fixed functional destinations.
- Required variables for email templates.

Validation rules:

- No arbitrary HTML, CSS, JavaScript or embedded scripts.
- Internal links use an approved route list; external links must use safe HTTPS, `mailto:` or `tel:` schemes.
- Shopify collection handles, functional routes and form behavior remain locked.
- Email templates must retain required variables such as customer name, reference, order number and status.
- Empty or invalid published data falls back to the compiled content.
- Existing content is seeded as both draft and published data without changing the initial website appearance.

### 2. CMS administration

Expand the admin shell with:

- Submissions
- Content
- Media
- Users

Add content screens that:

- Group entries into Global settings, Homepage, Catalogue presentation, Information/legal pages, Functional pages, Forms/messages and Emails.
- Show draft/published state, editor, publisher and timestamps.
- Provide explicit Save draft, Preview and Publish actions.
- Use schema-driven controls for text, links, lists, images and approved blocks.
- Allow block reordering only where the page renderer supports it.
- Keep required functional blocks—forms, cart, checkout, product grids and account controls—locked.
- Detect stale edits using the document version and require the editor to reload before saving.
- Show field-level validation and preserve an unsaved-change warning.
- Provide responsive authenticated previews using the same production renderers.
- Show revision history and let admins restore an older revision into draft before republishing.

Permissions are enforced inside every server function, not only in route guards:

- Active staff: view content, edit and save drafts, upload media and preview.
- Active admins: all staff abilities plus publish, restore revisions, archive/delete unused media and manage users.
- Unauthenticated, inactive or stale-session users cannot access CMS data or mutations.

### 3. Public media

Store CMS media separately from private submission attachments:

- Use a dedicated directory beneath the existing persistent application volume.
- Accept JPEG, PNG and WebP images up to 10 MB.
- Validate MIME type, file signature, filename and resolved storage path.
- Generate random immutable identifiers; replacing an image creates a new asset.
- Require context-specific alt text when an image is assigned to content.
- Serve published media through a TanStack server route such as `/content-media/$id/$filename`.
- Preview unpublished media only for authenticated staff.
- Apply immutable caching to published assets.
- Prevent deletion while an asset is referenced by draft or published content.
- Permit admins to archive assets or permanently remove only unreferenced assets.
- Include public media in the existing volume backup and recovery process.

### 4. Existing website integration

Refactor public routes and shared components to accept typed published content rather than embedded copy.

Editable groups include:

- Business/site name, domain, email, telephone, WhatsApp, address and opening hours.
- Header/footer labels, ordering and visibility while destinations remain constrained.
- Homepage headings, descriptions, category presentation, images, CTAs and part-enquiry copy.
- Existing category display labels, descriptions, images, order and visibility while Shopify handles remain immutable.
- About, contact, resources, delivery, returns and all legal/information pages.
- Cart, quote, account, login, registration and password-reset explanatory text.
- Product-page shared headings, tab labels, help text and empty states; Shopify product data remains untouched.
- Form labels, placeholders, help text, confirmation text and safe validation/error wording.
- Cookie consent and generic 404/500 messages.
- Transactional email subjects and bodies with validated required variables.
- Per-route SEO title and description, Open Graph copy and organisation structured data.
- Site manifest text and dynamically served `robots.txt`/`sitemap.xml` values derived from published settings and the fixed route list.

Runtime behavior:

- Route loaders request the global document and relevant page/message document in parallel.
- Page metadata uses validated loader content.
- Public reads use published data only.
- Draft data is available only through authenticated preview.
- No process-local content cache in v1, ensuring publishes are immediately consistent across replicas.
- Database errors or malformed content are logged and return compiled defaults so public pages continue working.

### 5. CMS user management

Add admin-only user management:

- List active and inactive staff.
- Create an admin or staff account with a temporary password.
- Force the new user to choose a new password at first login.
- Change name or role.
- Reset a password and invalidate existing sessions.
- Deactivate/reactivate an account and invalidate its sessions.
- Prevent self-deactivation.
- Prevent deactivating or demoting the final active administrator.
- Use existing scrypt hashing and strengthen server-side password validation.
- Record all account operations in the audit log.

## Interfaces and Routes

New internal interfaces include:

- `ContentKey`
- `ContentDocument<T>`
- `ContentRevision<T>`
- Discriminated `ContentBlock` types
- Typed page/message/email schemas
- `ContentMedia`
- Content permission helpers for staff versus admin

New server operations include:

- Load published content with fallback.
- Load/save a draft with optimistic concurrency.
- Load authenticated preview.
- Publish a validated draft.
- List and restore revisions.
- Upload/list/archive/delete media.
- List/create/update/reset/deactivate CMS users.

New routes include:

- `/admin/content`
- `/admin/content/$key`
- `/admin/content/$key/preview`
- `/admin/media`
- `/admin/users`
- `/admin/change-password`
- `/content-media/$id/$filename`

No existing public route or Shopify integration contract is removed.

## Test Plan

### Unit and integration tests

- Every content default passes its Zod schema.
- Structured blocks reject unsafe HTML, protocols and invalid media references.
- Email templates reject missing required variables and escape substituted values correctly.
- Draft saves reject stale versions.
- Publishing creates an immutable revision and exposes only validated content.
- Restoring a revision changes draft content without silently publishing it.
- Staff cannot publish, restore, delete media or manage users.
- Last-active-admin and self-deactivation protections work.
- Password reset/deactivation invalidates existing sessions.
- Media signature, size, path and reference protections work.
- Missing database or invalid published JSON returns compiled defaults.
- Migration and repeated seeding are idempotent.

### End-to-end scenarios

- Existing site content is unchanged immediately after migration.
- Staff edits and previews content without changing the live website.
- Admin publishes and the live page, metadata and navigation update.
- Admin restores an older revision and republishes it.
- Uploaded media remains private in draft, becomes publicly available after publication and survives an application restart.
- Form labels, validation copy, confirmation messages and email templates use published content while validation behavior remains enforced.
- Category presentation changes do not alter Shopify collection handles.
- User creation, forced password change, role enforcement, reset and deactivation work.
- Unauthenticated users cannot access drafts, media previews or admin operations.
- Existing catalogue, product, cart, checkout, quote, account and submissions tests continue to pass.
- Desktop/mobile accessibility checks cover editors, preview, public blocks and navigation.

### Verification gate

Run lint, typecheck, focused unit/integration tests, Playwright CMS/public regressions and the production build. Smoke-test PostgreSQL migrations, `/health`, `/ready`, public content fallback, publish/rollback, media delivery and email rendering.

## Rollout and Recovery

- Back up PostgreSQL and the persistent data volume before deployment.
- Apply additive migrations; do not remove existing submission tables or fields.
- Seed current content as the initial published revision.
- Verify the initial administrator and force temporary-password changes for new users.
- Compare representative pages before and after deployment to confirm no initial visual/content drift.
- Test one draft, preview, publish and restore cycle in production.
- Verify public-media backup coverage.
- Roll back application code if necessary; additive tables remain harmless, and compiled content defaults preserve the storefront if CMS content cannot be loaded.

## Assumptions and Non-goals

- English only.
- Existing pages only; no client-created routes.
- Structured approved blocks, not a free-form visual page builder.
- No arbitrary HTML or script injection.
- No scheduled publishing in this release.
- Shopify remains the sole owner of products, collections, prices, inventory, customers, quotes and orders.
- CMS can change category presentation but cannot create or rename Shopify integration handles.
- Functional behavior, validation rules, authorization and security controls remain code-owned even when their customer-facing wording is editable.
