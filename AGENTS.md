<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: Topic Tracker

Single-page Next.js 16.3.3 app (App Router, one route at `src/app/page.tsx`). Tracks study topics with daily sessions. Client-side only — no API routes, no database.

## Commands

```bash
bun install                        # always use bun, not npm/yarn
bun dev                            # start dev server
bun run build && bun run start     # production build + serve
bun test                           # unit tests (src/lib/*.test.ts)
bun run lint                       # eslint
bun run format                     # prettier — format all code
bun run format:check               # prettier — check without writing
bun scripts/smoke.ts               # E2E browser smoke test (needs bun dev running)
bun scripts/screenshot.ts          # captures UI screenshots into docs/
```

Playwright smoke test requires a browser install on fresh machines:
`bunx playwright install chromium` (+ `bunx playwright install-deps chromium` on bare Linux).

## Architecture

- **Single route** — everything renders through `src/app/page.tsx` → `<Explorer />`.
- **Client-side persistence** — all state lives in `localStorage` (key `tracktree.state.v1`). No server-side data.
- **Flat node map** — tree structure is a flat `Record<string, TreeNode>` with `parentId` references, not nested objects. This makes moves and subtree deletes simple.
- **Observable store** — `src/lib/tree-store.ts` is a manual external store (not React state). Components read via `useSyncExternalStore`.

## Key paths

```
src/
  lib/types.ts          # data model (TreeNode, Session, TreeState)
  lib/tree-store.ts     # observable store + localStorage persistence
  lib/tree-utils.ts     # pure helpers (validation, flattening, stats) + tests
  lib/stats-utils.ts    # daily series, streaks, time-window stats + tests
  lib/seed.ts           # demo tree shown on first run
  components/
    ui/                 # shadcn/ui primitives (radix-nova style)
    explorer/           # all app components (tree, content pane, charts, dialogs)
  app/
    layout.tsx          # root layout with ThemeProvider + Toaster
    page.tsx            # sole route — renders <Explorer />
```

## Conventions

- **English only** — code, UI text, comments, and documentation must always be in American English.
- **Commit messages start lowercase** — e.g. `fix it...` not `Fix it...`.
- **Bun only** — `packageManager: "bun@1.4.0"`. Lockfile is `bun.lock`.
- **Tailwind v4** — CSS-based config in `src/app/globals.css`, no `tailwind.config.js`.
- **shadcn/ui** — `radix-nova` style, configured in `components.json`. Add components via `bunx shadcn@latest add <name>`.
- **Path alias** — `@/*` maps to `./src/*`.
- **Strict TypeScript** — `tsconfig.json` has `strict: true`.
- **Mouse-only UI** — no keyboard shortcuts; every action has a pointer affordance (drag & drop, row hover actions, context menus).
- **Black & white theme** — enforced via `next-themes` with a strict neutral palette. A `<meta name="darkreader-lock" />` prevents browser extension interference.
- **No React Server Components for data** — all data fetching/manipulation is client-side via the store.

## Gotchas

- `next dev` auto-regenerates the `<!-- BEGIN:nextjs-agent-rules -->` block in this file. Commit it as-is to keep the tree clean.
- The dev server allows cross-origin access for `*.e2b.app` previews (`next.config.ts`).
- `bun test` only covers the pure utility modules in `src/lib/` (tree-utils, stats-utils). There are no component/integration tests.
- The `scripts/` directory contains dev/debug helpers (screenshots, smoke test, diagnostics) — not part of the app bundle.
