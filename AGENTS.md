<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: topic-tracker

Next.js 16.3.3 + React 19 + Tailwind CSS 4 app. Bun 1.3.14 is the package manager (`packageManager` field in `package.json`). Fully client-side; data stored in IndexedDB via Dexie.js.

## Commands

- `bun dev` — dev server
- `bun run build` — production build (static export to `out/`)
- `bun run lint` — ESLint (flat config, eslint 9)
- `bun test` — Bun's built-in test runner (runs `lib/features/**/*.test.ts`)

CI order (`.github/workflows/ci.yml`): `bun run lint` → `bun test` → `bun run build`

## Deploy

Static export to GitHub Pages. `next.config.ts` sets `output: "export"` and `basePath: "/topic-tracker"`. The `postbuild` script copies `out/index.html` to `out/404.html` for SPA fallback. Deploy workflow (`.github/workflows/deploy.yml`) uploads `out/` as a Pages artifact.

## Conventions

- **Formatting**: Prettier — no semicolons, double quotes. Configured in `.prettierrc`.
- **Indentation**: 4 spaces (see `.editorconfig`). Non-default for JS/TS projects.
- **No trailing newline, no trailing whitespace trimming** (`.editorconfig`).
- **TypeScript strict mode** enabled. Path alias: `@/*` maps to root (`tsconfig.json`).
- **ESLint flat config** (`eslint.config.mjs`): uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- **Language**: All code, comments, commits, UI text, and anything published to GitHub must be written in standard US English.
- **Commit messages**: Must start with a lowercase letter. Wrong: "Fix it..." Right: "fix it..."

## Architecture

- `app/` — App Router with 3 pages (`/`, `/settings`, `/statistics`), root layout.
- `app/components/topics/` — Topic tree UI: `tree-explorer.tsx`, `use-tree-explorer.ts`, metadata/stats/session cards.
- `app/components/statistics/` — Statistics charts and breakdown list.
- `app/settings-sections/` — Settings page sections (appearance, backup, source code).
- `components/` — Shared UI primitives (shadcn base-nova style) and layout (sidebar, theme).
- `lib/features/` — Feature modules, each self-contained:
  - `topics/` — `TopicNode` type, `TopicRepository` interface, tree utils, Dexie impl.
  - `performance/` — `PerformanceRecord`/`Score` types, `PerformanceRepository` interface, scoring logic, Dexie impl.
  - `statistics/` — Aggregate stat types (`TopicSummary`, `DailyPoint`, `OverallSummary`).
  - `backup/` — `BackupRepository` interface, Dexie impl.
  - `flags/` — Feature flag system with localStorage persistence.
- `lib/infra/db.ts` — Shared Dexie.js schema definition with migrations.
- `lib/hooks/` — React hooks bridging feature modules to UI.
- `lib/utils.ts` — Shared utility (`cn`).

## Feature flags

Feature flags are defined in `lib/features/flags/`. Use `isEnabled("flag-name")` in server-safe code or `useFeatureFlags()` in React components. Flags persist to localStorage. Current flags: `topics`, `performance`, `statistics`, `backup`.

## Adding a feature

1. Create `lib/features/my-feature/` with `types.ts`, `repository.ts`, `dexie-repository.ts`, `index.ts`.
2. Add hook in `lib/hooks/use-my-feature.ts`.
3. Add UI in `app/components/my-feature/`.
4. Add flag `"my-feature": false` to `lib/features/flags/config.ts`.
5. Add route in `app/my-feature/page.tsx` and nav item in `components/app-sidebar.tsx` (gated by flag).

## Notes for agents

- The `AGENTS.md` block at the top is auto-modified by `next dev`. If you edit it, commit it with your changes so the tree stays clean.
- `CLAUDE.md` points to `AGENTS.md` — keep them in sync if you make major changes to either.
- `sharp` and `unrs-resolver` are in `trustedDependencies`/`ignoreScripts` in `package.json` — this is intentional for build compatibility.
- `.env*` files are gitignored. No `.env.local` or similar exists currently.
