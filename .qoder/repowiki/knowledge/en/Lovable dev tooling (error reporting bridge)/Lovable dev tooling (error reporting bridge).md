---
kind: external_dependency
name: Lovable dev tooling (error reporting bridge)
slug: lovable
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### Identity & role
- Lovable is the development platform that generated this TanStack Start template and provides an optional client-side error-reporting bridge.

### Integration point
- `.lovable/project.json` pins the project to the `tanstack_start_ts_2026-05-29` template schema.
- `src/lib/lovable-error-reporting.ts` calls `window.__lovableEvents.captureException` when available; it is a no-op when the global is absent.

### Stable usage note
- This dependency is purely a dev-time integration; removing the file has no runtime effect if Lovable's script is not injected.