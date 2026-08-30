<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: topic-tracker

Next.js 16.3.3 + React 19 + Tailwind CSS 4 app. Bun 1.3.14 is the package manager (`packageManager` field in `package.json`).

## Commands

- `bun dev` — dev server
- `bun build` — production build
- `bun run lint` — ESLint (flat config, eslint 9)
- No test suite is configured. There is no `test` script, no test framework dependency, and no test files.

## Conventions

- **Formatting**: Prettier — no semicolons, double quotes. Configured in `.prettierrc`.
- **Indentation**: 4 spaces (see `.editorconfig`). This is non-default for JS/TS projects.
- **No trailing newline, no trailing whitespace trimming** (`.editorconfig`).
- **TypeScript strict mode** enabled. Path alias: `@/*` maps to root (`tsconfig.json`).
- **ESLint flat config** (`eslint.config.mjs`): uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Custom ignores override the eslint-config-next defaults.
- **Language**: All code, comments, commits, UI text, and anything published to GitHub must be written in standard US English.
- **Commit messages**: Must start with a lowercase letter. Wrong: "Fix it..." Right: "fix it..."

## Architecture

- `app/` — App Router directory with 3 pages (`/`, `/settings`, `/statistics`), root layout, and `app/components/` for page-specific components.
- `app/layout.tsx` — Root layout, uses Geist + Geist Mono fonts via `next/font/google`.
- `components/` — Shared UI components: shadcn base-nova style (`components.json`), plus `components/reui/` for headless tree components.
- `hooks/` — Generic UI hooks (e.g., `useIsMobile`).
- `lib/core/` — Business logic: domain types (`types.ts`), repository interfaces (`repository.ts`), scoring logic (`score.ts`). Zero React/UI imports.
- `lib/infra/` — Dexie.js implementations of repository interfaces (IndexedDB).
- `lib/hooks/` — React adapters bridging core ↔ UI.
- `lib/mock/` — Mock data for development/testing.

## Notes for agents

- The `AGENTS.md` file is auto-modified by `next dev`. If you edit it, commit it with your changes so the tree stays clean.
- `CLAUDE.md` points to `AGENTS.md` — keep them in sync if you make major changes to either.
- `sharp` and `unrs-resolver` are in `trustedDependencies`/`ignoreScripts` in `package.json` — this is intentional for build compatibility.
- `.env*` files are gitignored. No `.env.local` or similar exists currently.
