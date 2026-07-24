---
kind: frontend_style
name: Tailwind + shadcn/ui Design System with CSS Variables Theme
category: frontend_style
scope:
    - '**'
source_files:
    - src/styles.css
    - components.json
    - src/lib/utils.ts
    - src/hooks/use-mobile.tsx
    - src/components/ui/button.tsx
---

The frontend styling system is built on Tailwind CSS v4 (via `@import "tailwindcss"`), the shadcn/ui component library, and a CSS-variable-driven design token layer. It follows a layered approach: global tokens → Tailwind theme mapping → utility-first composition via class-variance-authority (CVA) variants in shadcn components.

**Core stack**
- **Tailwind CSS v4** — imported directly from `src/styles.css` with `@source` directives scanning routes, shopify components, and lib for dynamic class usage; `tw-animate-css` provides animation utilities.
- **shadcn/ui** — configured via `components.json` (`style: "new-york"`, `baseColor: "slate"`, `cssVariables: true`, `tsx: true`). All primitive UI components live under `src/components/ui/` and are generated/stored as local React files using Radix primitives, CVA variants, and the shared `cn()` helper.
- **CSS variables as design tokens** — all colors, fonts, and semantic tokens are declared as CSS custom properties on `:root` in `oklch()` color space (e.g., `--background`, `--accent`, `--charcoal-deep`, `--amber`) and re-exported into Tailwind's `@theme inline { --color-* }` block so they become available as Tailwind utilities (`bg-background`, `text-accent`, etc.).
- **Class merging** — `src/lib/utils.ts` exports a single `cn(...)` function wrapping `clsx` + `tailwind-merge`, which every shadcn component uses to compose variant classes with user-supplied className overrides.
- **Dark mode** — enabled via the Tailwind v4 `@custom-variant dark (&:is(.dark *));` directive; components consume tokens through CSS variables rather than hard-coded values, so toggling `.dark` on an ancestor flips the entire palette.
- **Responsive strategy** — Tailwind breakpoints drive layout; a dedicated `useIsMobile()` hook in `src/hooks/use-mobile.tsx` exposes a 768px breakpoint for JS-driven conditional rendering. Global base styles enforce consistent focus rings, smooth scrolling, and reduced-motion support via `prefers-reduced-motion`.
- **Animation & motion** — `tw-animate-css` supplies animation utilities; a `hero-range-panel` pattern in `@layer components` demonstrates hover-triggered panel reveals with CSS transforms and opacity transitions, gated behind a `(hover: hover) and (pointer: fine)` media query.

**Architecture & conventions**
- Tokens live exclusively in `src/styles.css`; business logic never hard-codes colors or spacing.
- Reusable UI primitives are defined as shadcn components under `src/components/ui/` using CVA for variant/size prop APIs; page-level components under `src/components/shopify/` compose these primitives.
- Route-scoped and feature-scoped CSS lives inside the same file tree scanned by `@source`, keeping style co-location without separate CSS modules.
- The build pipeline (Vite via `@lovable.dev/vite-tanstack-config`) injects Tailwind automatically; no standalone `tailwind.config.js` is needed because Tailwind v4 reads configuration from CSS `@theme` blocks and `components.json`.

**Rules developers should follow**
1. Use only the CSS variable tokens (`var(--color-*)`, `var(--font-display)`, etc.) exposed via Tailwind utilities — do not write raw hex/rgb values in JSX.
2. Compose shadcn primitives with the `cn()` helper from `@/lib/utils`; never concatenate class strings manually.
3. When adding new visual variants, define them via CVA in the relevant `src/components/ui/*.tsx` file rather than ad-hoc className branches.
4. Keep responsive behavior in Tailwind utilities; use `useIsMobile()` only when JavaScript state is required (e.g., conditional hydration).
5. Respect `prefers-reduced-motion`: avoid heavy animations and rely on the existing `@media (prefers-reduced-motion: reduce)` fallback already present in `styles.css`.