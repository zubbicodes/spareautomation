---
kind: build_system
name: Vite + TanStack Start Build & Deployment Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.ts
    - Dockerfile
    - docker-compose.yml
    - .github/workflows/quality.yml
    - playwright.config.ts
    - bunfig.toml
    - nginx.conf
---

The project uses a Vite-driven build pipeline centered on TanStack Start (SSR via Nitro), with Bun as the package manager and Playwright for E2E testing. The entire flow is orchestrated through npm scripts in package.json and GitHub Actions CI.

Build toolchain:
- vite.config.ts delegates most configuration to @lovable.dev/vite-tanstack-config, which auto-wires TanStack Router, React, Tailwind v4, TypeScript path aliases, Nitro bundling, component tagging, env injection, and error logging. The only explicit overrides set the Nitro preset to node-server and point TanStack's server entry to src/server.ts.
- package.json exposes: dev (vite dev), build (vite build), build:dev (development mode), preview, lint, typecheck (tsc --noEmit), test (Playwright), format (Prettier), and a check script that runs lint then typecheck then test then build sequentially.
- Dependencies include nitro (3.0.260603-beta) as the SSR runtime target, @tanstack/react-start and react-router for routing, tailwindcss v4 with @tailwindcss/vite, and vite-tsconfig-paths.

Runtime packaging:
- The Dockerfile is a two-stage Node 22 Alpine image: stage 1 installs deps and runs npm run build producing .output; stage 2 copies only .output and starts the Nitro node server via node .output/server/index.mjs listening on port 80.
- docker-compose.yml builds the image, maps host 3000 to container 80, loads .env, and restarts unless stopped.
- A standalone nginx.conf is included for static-file deployments (SPA fallback, immutable asset caching); it is not used by the Dockerfile but can be mounted when serving the built static assets directly.

Local development:
- bunfig.toml enforces a supply-chain guard: packages published less than 24 hours ago are rejected at install time, with explicit excludes for Lovable tooling. This applies to both local bun install and CI.

CI (GitHub Actions):
- .github/workflows/quality.yml runs on PRs and pushes to main: checks out code, sets up Bun latest, installs with --frozen-lockfile, then executes lint then typecheck then Playwright install then test then build. Reporters switch to github format under CI; retries are enabled only in CI.

Testing harness:
- playwright.config.ts targets ./tests/e2e, runs Chromium desktop and mobile (Pixel 7) projects in parallel, and boots the app via bun run dev --host 127.0.0.1 --port 4173 as an embedded web server before each test run. Traces are captured on first retry.

Conventions:
- All build/dev/test commands go through the package.json scripts; do not invoke vite or tsc directly from outside scripts.
- Environment variables are injected at build time via Vite/TanStack config; production values should be provided through Docker environment or .env files.
- Lockfiles are version-locked in CI (--frozen-lockfile) and locally managed by Bun (bun.lock).