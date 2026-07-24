---
kind: configuration_system
name: Environment-based Configuration with Server/Client Split
category: configuration_system
scope:
    - '**'
source_files:
    - src/lib/config.server.ts
    - .env.example
    - vite.config.ts
    - bunfig.toml
    - src/server.ts
---

This TanStack Start + Nitro application uses a minimal, environment-variable-driven configuration system with a strict server/client split enforced by the build toolchain.

**What system/approach is used**
- Runtime configuration is loaded exclusively from `process.env` on the server side via a single accessor function in `src/lib/config.server.ts`.
- Public (client-safe) configuration is injected at build time through Vite's `import.meta.env.VITE_*` mechanism, as documented in the config module comments.
- The `.server.ts` file extension prevents this module from being bundled into client bundles, guaranteeing secrets never reach the browser.
- Build-time configuration is centralized in `vite.config.ts`, which delegates most defaults to `@lovable.dev/vite-tanstack-config` and only overrides the Nitro preset (`node-server`) and TanStack Start server entry point.

**Key files and packages**
- `src/lib/config.server.ts` — single source of truth for all server-only env vars; exports `getServerConfig()` returning a typed object with Shopify Storefront/Admin API tokens, API versions, and `NODE_ENV`.
- `.env.example` — documentation-only template listing every required env var (Shopify credentials, session secret, standard Node/TanStack Start vars).
- `vite.config.ts` — build configuration: sets Nitro preset to `node-server`, redirects TanStack Start's server entry to `src/server.ts`, and relies on the Lovable wrapper for Vite/TanStack/Nitro plugin wiring.
- `bunfig.toml` — supply-chain guard (`minimumReleaseAge = 86400`) plus explicit excludes for two Lovable dev packages.
- `src/server.ts` — runtime server entry that wraps the TanStack Start handler with security headers and SSR error normalization; does not read env directly but can access it per-request.
- `package.json` — scripts expose `dev` / `build` / `preview` modes; `--mode development` is available via `build:dev`.

**Architecture and conventions**
- Two-tier env model:
  - Secrets and server-only values → `process.env.*` accessed inside `getServerConfig()` or inline within handlers.
  - Public values → `import.meta.env.VITE_*` variables defined in `.env` with the `VITE_` prefix; safe for both client and server.
- Per-request env reads: The comment in `config.server.ts` explicitly warns that Cloudflare Workers bind env at request time, so module-scope reads resolve to `undefined`; always wrap env access in functions/handlers.
- Default fallbacks: Where appropriate, env values fall back to sensible defaults (e.g., `SHOPIFY_STOREFRONT_API_VERSION ?? "2026-01"`).
- Build vs runtime separation: `vite.config.ts` intentionally avoids duplicating plugins already provided by `@lovable.dev/vite-tanstack-config`; additional config is passed through the `defineConfig({ vite: { ... } })` shape.
- No config files on disk: There are no YAML/TOML/JSON config files consumed at runtime — everything comes from environment variables or compile-time constants (see `src/lib/site.ts` for hard-coded site metadata).

**Rules developers should follow**
1. Never import `config.server.ts` from client code — the `.server.ts` suffix enforces this at build time, but do not bypass it.
2. Always read `process.env` inside a function or handler, never at module scope, to support Cloudflare Workers' request-scoped env binding.
3. Use `import.meta.env.VITE_*` only for public, non-secret values intended for the browser (analytics IDs, public URLs).
4. Add new server-only env vars to `getServerConfig()` and document them in `.env.example`.
5. Provide a default value via `??` when an env var has a sensible fallback; otherwise treat the variable as required.
6. Do not edit the base Vite/TanStack/Nitro plugin setup in `vite.config.ts` — extend via the `defineConfig` wrapper instead.