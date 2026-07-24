---
kind: logging_system
name: No structured logging system — bare console.error usage
category: logging_system
scope:
    - '**'
source_files:
    - src/server.ts
    - src/start.ts
    - src/lib/error-capture.ts
    - src/lib/lovable-error-reporting.ts
---

This repository does not implement a dedicated logging system. There is no logging framework (pino, winston, bunyan, debug, etc.), no logger initialization, no log-level configuration, and no structured log fields or sinks.

All server-side error output goes through plain `console.error` calls in the request pipeline:
- `src/server.ts` logs h3-swallowed SSR errors and catch-all handler errors via `console.error`.
- `src/start.ts` logs caught TanStack Start middleware errors via `console.error`.
- A few route/component files also call `console.error` for client-side failures.

Error capture utilities exist but are not a logging system: `src/lib/error-capture.ts` stores the last unhandled error in memory so the server entry can recover its stack trace from h3's swallowed responses; `src/lib/lovable-error-reporting.ts` forwards browser-side errors to an external Lovable analytics SDK via `window.__lovableEvents.captureException`. Neither produces application logs.

There is no central logger module, no log rotation, no structured JSON format, and no environment-based level control. The only "sinks" are the Node.js process stdout/stderr that the runtime provides.