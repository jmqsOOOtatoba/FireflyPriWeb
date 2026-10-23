# Repository Guidelines

## Project Structure & Module Organization

Firefly is an Astro 7 site with Svelte 5 islands and TypeScript — a personalized fork of the [Firefly](https://github.com/CuteLeaf/Firefly) theme (itself derived from Fuwari). Main source code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, reusable UI in `src/components`, styles in `src/styles`, content in `src/content`, helpers in `src/utils`, and Markdown/HTML plugins in `src/plugins` (20+ remark/rehype plugins, including Bilibili cards, music player, PDF viewer, Mermaid, PlantUML and wiki links). Site configuration is split across `src/config` with matching type definitions in `src/types`; prefer imports from `@/config` when available. Static files served directly belong in `public`, source-managed images in `src/assets`, docs in `docs`, and automation in `scripts`.

Two directories sit outside the Astro build and should be treated as separate concerns:

- `publisher/` — an independently deployed admin app (password login, content publishing, friend-link review) with its own dependencies, API routes and test harness.
- `src/workers/` — standalone Cloudflare Worker scripts, not wired into the Astro build.

## Build, Test, and Development Commands

Use `pnpm`; the `preinstall` script enforces it. Requires Node >= 22.23.0.

- `pnpm dev` or `pnpm start`: run the local Astro dev server on port 4321.
- `pnpm check`: run Astro diagnostics.
- `pnpm type-check`: run TypeScript with `--noEmit --isolatedDeclarations`.
- `pnpm format`: format `./src` and `./scripts` with Biome.
- `pnpm lint`: run Biome checks and safe fixes on `./src` and `./scripts`.
- `pnpm build`: run the full ten-step pipeline into `dist`.
- `pnpm preview`: preview the production build locally.
- `pnpm new-post`: scaffold a new content post.
- `pnpm new-dynamic` (alias `pnpm new-d`): scaffold a new dynamic entry.
- Single-purpose generators: `pnpm lqips`, `pnpm friend-json`, `pnpm github-cards`, `pnpm bilibili-cards`.

`pnpm build` chains ten steps and fails if any one breaks: `generate-friend-json` → `generate-github-card-data` → `generate-bilibili-card-data` → `generate-lqips` → `generate-vndb-covers` → `astro build` → `prune-pio-assets` → `subset-fonts` → `minify-inline-scripts` → `run-pagefind`.

## Deployment

The main site is hosted on Tencent **EdgeOne Pages** and rebuilds on every push to `master`. Root-level `wrangler.jsonc`, `wrangler.toml` and `vercel.json` are template leftovers, not the active path: `astro.config.mjs` only attaches the Cloudflare adapter when `CF_WORKERS` is set, otherwise the build is fully static. Do not "fix" deployment by editing those files or running `wrangler deploy`. Only `publisher/` deploys to Vercel, as its own project. The footer renders both the ICP filing (鲁ICP备2026062086号-1) and the public-security filing number from `src/config/FooterConfig.html`.

## Coding Style & Naming Conventions

Biome is the formatter and linter. It uses tabs for indentation and double quotes for JavaScript/TypeScript strings. Keep Astro and Svelte components in `PascalCase` (`PostCard.astro`, `Search.svelte`), config modules in `camelCase` ending with `Config.ts`, and utilities in descriptive kebab case such as `date-utils.ts`. Keep `src/types` aligned with `src/config`. Avoid unrelated formatting churn.

## Testing Guidelines

No unit-test framework is configured for the Astro site. The `publisher/` app ships two standalone scripts: `publisher/test/local-harness.mjs` (mock GitHub server on port 8788) and `publisher/test/api-test.mjs` (32 assertions) — run both when touching `publisher/api/*`.

Before submitting changes, run `pnpm check`, `pnpm type-check`, and `pnpm build` for rendering, content, or generated asset work. For visual or interactive changes, verify with `pnpm dev` or `pnpm preview` and include screenshots in the PR. CI is not equivalent to a local full build: `.github/workflows/build.yml` runs only `astro check` plus `astro build`, and `biome.yml` lints only `./src`. Name future tests near the feature they cover, using the local file name as the stem.

## Commit & Pull Request Guidelines

Use Conventional Commits, matching the current history: `feat: ...`, `fix: ...`, and `chore: ...`. Keep commits and PRs focused on one concern. PRs should include a concise summary, linked issues when relevant, validation commands run, and screenshots for UI changes. Discuss major features or design changes in an issue or discussion before implementation.

## Security & Configuration Tips

Do not commit secrets, tokens, or service keys in config files. Keep deployment-specific settings in the target platform environment, and review generated files such as `dist`, `src/constants/lqips.json`, `src/constants/bilibili-card-data.json`, `src/constants/github-card-data.json`, and `src/constants/icons-data.json` before committing them.

## Feature Map

Routes live in `src/pages/`; every feature toggle lives in `src/config/*Config.ts` and is re-exported through `src/config/index.ts`.

- Site statistics: the `/analytics` page (`analytics.astro` + `analyticsConfig.ts`), fed by self-hosted Umami. Busuanzi was removed.
- Comments: Twikoo, configured in `commentConfig.ts`.
- Publishing: `publisher/` on Vercel (`pub.mstzuomu.space`), plus friend-link self-application through `publisher/api/friend-apply.js` and `src/components/pages/friends/FriendApplyForm.astro`.
- Extra pages: friend circle `/fcircle/` (`fcircleConfig.ts`), bookmark nav `/booknav/` (`booknavConfig.ts`), gallery, dynamic, projects, guestbook, and the bangumi / Bilibili / MAL / VNDB pages.
- Reading progress: `src/utils/reading-progress.ts`, scheduled from `src/utils/scroll-utils.ts`.
- Markdown directives: `::music`, `::pdf` and `::bilibili`, implemented in `src/plugins/`.
