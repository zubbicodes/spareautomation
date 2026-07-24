---
kind: error_handling
name: TanStack Start Error Handling — Global Capture, h3 Workaround, and Lovable Reporting
category: error_handling
scope:
    - '**'
source_files:
    - src/lib/error-capture.ts
    - src/lib/error-page.ts
    - src/lib/lovable-error-reporting.ts
    - src/server.ts
    - src/start.ts
---

This TanStack Start + Nitro application implements a layered error-handling strategy that bridges the gap between React Server Components' runtime, h3's response swallowing behavior, and client-side error reporting.

### System overview

- **Global unhandled-error capture** (`src/lib/error-capture.ts`): A module with a side effect registers `globalThis.addEventListener("error")` and `"unhandledrejection"` listeners to record the most recent thrown or rejected value in an in-process cache keyed by timestamp (5 s TTL). The cache is consumed via `consumeLastCapturedError()` so that code paths which cannot directly catch the throw can still log the original stack trace.

- **h3 SSR workaround** (`src/server.ts`): h3 converts in-handler throws into a JSON `{"unhandled":true,"message":"HTTPError"}` 500 Response, bypassing normal try/catch. The server entry imports `error-capture` for its side effects, then inspects every 5xx JSON response; when it matches the h3 sentinel body it logs the captured error (if any) and returns a friendly HTML fallback instead of leaking raw JSON.

- **TanStack Start request middleware** (`src/start.ts`): A server-only `createMiddleware` wraps every route handler. Non-`statusCode` errors are logged and turned into the same HTML fallback; objects carrying a `statusCode` property are re-thrown so downstream frameworks can treat them as intentional HTTP responses rather than failures.

- **Static error page** (`src/lib/error-page.ts`): A self-contained HTML string rendered at 500 status with a minimal card offering "Try again" (reload) and "Go home". No JS framework is involved, guaranteeing delivery even when the app bundle fails to load.

- **Client-side reporting** (`src/lib/lovable-error-reporting.ts`): A thin wrapper around the optional `window.__lovableEvents.captureException` API used by the Lovable dev toolchain. It attaches source metadata (`react_error_boundary`, current route path) and severity.

### Where errors originate

Business-layer modules under `src/lib/shopify/*` and `src/lib/api/*` throw plain `Error` instances (e.g. missing configuration, empty catalogue, GraphQL errors joined from Shopify payloads). These propagate up through TanStack routes and are caught by the two global layers described above.

### Architecture and conventions

| Layer | Responsibility | Key file(s) |
|---|---|---|
| Unhandled event capture | Record last thrown/rejected value for later consumption | `src/lib/error-capture.ts` |
| Request pipeline | Catch route-level exceptions, preserve `statusCode` objects | `src/start.ts` |
| Runtime fallback | Intercept h3's swallowed 500 JSON, serve HTML fallback | `src/server.ts` |
| User-facing fallback | Static HTML error page | `src/lib/error-page.ts` |
| Client telemetry | Report to Lovable dev tool | `src/lib/lovable-error-reporting.ts` |

Design decisions:
- Errors are represented as native `Error` objects; no custom error class hierarchy or sentinel constants are defined.
- There is no structured logging backend — all server errors go to `console.error`.
- The only user-visible failure surface is the static HTML page; no JSON error payloads are returned to clients on 5xx.
- Client-side errors are reported only when the Lovable extension is present; calls are guarded by `typeof window !== "undefined"` and optional chaining.

### Rules developers should follow

1. **Throw plain `Error`s** from business logic; do not swallow them. The global middleware will convert them to the standard 500 HTML fallback.
2. **Preserve HTTP semantics**: if you need to return a specific status code (4xx), throw an object shaped like `{ statusCode: number }`; the middleware re-throws such values unchanged.
3. **Do not rely on try/catch inside handlers** for h3-swallowed errors — use the global middleware layer or wrap your own async call sites.
4. **Use `reportLovableError(error, context)`** from `src/lib/lovable-error-reporting.ts` when catching recoverable client-side errors you want surfaced to the Lovable dashboard.
5. **Never return raw error stacks to clients**; the static error page intentionally omits diagnostic details.