# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Firefly is a feature-rich static blog theme built on **Astro 7** with **Svelte 5** for interactive components. This repository is a personalized fork of [Firefly](https://github.com/CuteLeaf/Firefly), which is itself derived from [Fuwari](https://github.com/saicaca/fuwari). Primary language is Chinese (Simplified) with i18n for en, zh_TW, ja, ko, ru.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build — ten steps: friend JSON → GitHub cards → Bilibili cards → LQIPs → VNDB covers → Astro build → pio asset pruning → font subsetting → inline-script minify → Pagefind indexing |
| `pnpm preview` | Preview production build |
| `pnpm check` | `astro check` for type/error checking |
| `pnpm type-check` | `tsc --noEmit --isolatedDeclarations` (covers `src/` and `scripts/`) |
| `pnpm lint` | Biome lint + auto-fix |
| `pnpm format` | Biome format |
| `pnpm new-post <filename>` | Scaffold a new blog post |
| `pnpm new-dynamic` (`new-d`) | Scaffold a new dynamic (microblog) entry |
| `pnpm lqips` | Regenerate LQIP data into `src/constants/lqips.json` |
| `pnpm friend-json` | Regenerate `public/friend.json` from `friendsConfig.ts` |
| `pnpm github-cards` | Regenerate `src/constants/github-card-data.json` |
| `pnpm bilibili-cards` | Regenerate `src/constants/bilibili-card-data.json` |

Package manager is **pnpm** (enforced). Node.js >= 22.23.0 required (`engines` field; `packageManager` pins pnpm@11.22.0).

## Architecture

### Astro + Svelte Hybrid

- `.astro` components for static content and layouts
- `.svelte` components for interactive UI (search, settings, pagination, archive) — mounted with `client:load` or `client:visible`
- Swup.js handles SPA-like page transitions with multiple container targets

### Configuration-Driven

All features are toggled/configured via TypeScript files in `src/config/`, exported through the barrel at `src/config/index.ts`. Key configs:

- `siteConfig.ts` — core site settings, theme, pagination
- `sidebarConfig.ts` — sidebar layout (left/right/both, widget ordering)
- `commentConfig.ts`, `analyticsConfig.ts`, `fontConfig.ts`, etc.

### Fork-Specific Features

This fork diverges from the upstream theme in several places — check these before assuming upstream behavior:

- `/analytics` — public statistics page (`src/pages/analytics.astro` + `analyticsConfig.ts`), fed by self-hosted Umami. Busuanzi has been fully removed.
- Friend-link self-application — `src/components/pages/friends/FriendApplyForm.astro` posts to the `publisher/` API (`friend-apply.js`, `friend-decide.js`), which mails an approve/reject link and writes the approved entry back into `friendsConfig.ts`.
- `publisher/` — password-gated admin app for publishing posts, dynamics and updates, and for reviewing friend applications, deployed separately to Vercel.
- Twikoo comments (`commentConfig.ts`) and dual filing numbers in the footer (`src/config/FooterConfig.html`: ICP + public-security).
- Extra pages: `/fcircle/`, `/booknav/`, `/gallery/`, `/dynamic/`, `/projects/`, `/guestbook/`, plus bangumi / Bilibili / MAL / VNDB pages.
- Markdown directives `::music`, `::pdf` and `::bilibili`, implemented under `src/plugins/`.

### Layout System

- `Layout.astro` — base HTML shell (head, body, theme init, analytics, Swup hooks)
- `MainGridLayout.astro` — full page grid with sidebar(s), navbar, wallpaper, footer

### Scroll Performance Constraints

Scroll-linked work in `src/utils/` is rAF-throttled and must stay cheap on mobile — do not regress these:

- `fullscreen-wallpaper-utils.ts` — fullscreen-mode title fade + blur ramp. The blur value `--fullscreen-blur` is **quantized to 2px steps** (skips writes when unchanged) and the max blur (`--overlay-blur`) is **cached** (read once; refreshed by a MutationObserver on `#wallpaper-wrapper` style). Avoid per-frame `getComputedStyle` or continuous full-screen `filter: blur()` writes — each change re-rasterizes the whole viewport on mobile.
- `grid-layout-utils.ts` — `updateSidebarStickySpacing()` is the per-scroll path and **must not read layout** (`offsetHeight` etc.). The sidebar top-container visibility (`hasVisibleTop`) is cached by `refreshSidebarStickyState()`, which runs on init/navigation only.
- Fullscreen blur ramp can be disabled per device via `backgroundWallpaper.fullscreen.blurRamp.enable.{desktop,mobile}` — when off, fullscreen mode has no blur on that device (home + other pages) and the settings-panel blur slider is hidden.
- `reading-progress.ts` — consumed by `scrollFunction()` in `scroll-utils.ts`. It reads `scrollTop` once per frame and writes classes in a deferred nested rAF; hook new per-frame scroll logic into the read phase rather than registering another scroll listener. `after-first-paint.ts` gates work that would otherwise force layout during parse.

### Content Collections

Defined in `src/content.config.ts`:
- `posts` — blog posts (`.md`/`.mdx`) with frontmatter: title, published, tags, category, draft, pinned, password, comment, etc.
- `spec` — special pages (about, guestbook)
- `dynamic` — microblog entries (`.md`) with frontmatter: published, pinned, location
- `projects` — portfolio entries rendered by `src/pages/projects/`

### Key Directories

- `src/components/` — organized by domain: `analytics/`, `comment/`, `common/`, `controls/`, `features/`, `layout/`, `misc/`, `pages/`, `widget/`
- `src/plugins/` — 20+ custom remark/rehype plugins (Mermaid, PlantUML, KaTeX, GitHub cards, Bilibili cards, music player, PDF viewer, reading time, wiki links, email protection, etc.)
- `src/i18n/` — translation keys in `i18nKey.ts`, language files in `languages/*.ts`, lookup via `translation.ts`
- `src/utils/` — content sorting, crypto (encrypted posts), date formatting, image processing/LQIP, TOC generation, scroll/reading-progress helpers
- `src/pages/` — Astro file-based routing, plus JSON endpoints under `src/pages/api/`
- `src/workers/` — standalone Cloudflare Worker scripts, outside the Astro build
- `publisher/` — independent admin app deployed to Vercel; not part of the site build
- `scripts/` — build-time utilities (`generate-lqips.ts`, `generate-vndb-covers.ts`, `generate-friend-json.ts`, `generate-github-card-data.ts`, `generate-bilibili-card-data.ts`, `prune-pio-assets.ts`, `subset-fonts.ts`, `minify-inline-scripts.ts`, `run-pagefind.ts`, `site-root.ts`, `quarantine-bad-posts.mjs`, `new-post.js`, `new-dynamic.js`)

### Path Aliases (tsconfig.json)

`@components/*`, `@assets/*`, `@constants/*`, `@utils/*`, `@i18n/*`, `@layouts/*` → `./src/<dir>/*`; `@/*` → `./src/*`

## Code Style

- **Biome** enforces: tab indentation, double quotes, recommended lint rules
- Relaxed rules for `.svelte`/`.astro`/`.vue` files (`useConst`, `useImportType`, `noUnusedVariables`, `noUnusedImports` off)
- `pnpm lint`/`pnpm format` target `./src` and `./scripts` — note CI differs: `.github/workflows/biome.yml` runs `biome ci ./src` only
- `scripts/subset-font.d.ts` is a hand-written ambient declaration for the untyped `subset-font` package
- Commit convention: **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.)

## Build Pipeline

Ten steps: `scripts/generate-friend-json.ts` → `scripts/generate-github-card-data.ts` → `scripts/generate-bilibili-card-data.ts` → `scripts/generate-lqips.ts` → `scripts/generate-vndb-covers.ts` → `astro build` → `scripts/prune-pio-assets.ts` → `scripts/subset-fonts.ts` → `scripts/minify-inline-scripts.ts` → `scripts/run-pagefind.ts`.

`run-pagefind.ts` wraps the Pagefind CLI so it indexes the right directory — call `pagefind --site dist` directly only if you know the output layout is unchanged.

`generate-friend-json.ts` must run before the crawler consumes it: it turns `friendsConfig.ts` into `public/friend.json`, the input for the separate Friend-Circle-Lite repository.

`generate-bilibili-card-data.ts` fetches Bilibili user info at build time (uapis.cn returns 403 when called cross-origin from a browser, so the browser never calls it) into `src/constants/bilibili-card-data.json`, keeping the old cache on failure. Refresh manually with `pnpm bilibili-cards`.

LQIP data is generated into `src/constants/lqips.json` and committed — regenerate with `pnpm lqips`. Icon data lives in `src/constants/icons-data.json` (committed, Biome-ignored, consumed by `src/components/common/Icon.svelte`) but has no generator script in the current build.

`generate-vndb-covers.ts` downloads VNDB cover art into `public/vndb-covers/` (gitignored, skips files that already exist). It no-ops unless `siteConfig.vndb` has a `userId`, `downloadCovers: true`, and `mode: "static"`.

`prune-pio-assets.ts` deletes unused 看板娘 assets from `dist/` after the Astro build (Astro copies all of `public/` regardless of config). It drops `dist/pio/models/live2d` plus the orphaned `Live2DWidget` client chunk when `live2dWidgetConfig.enable` is false, `dist/pio/models/spine` and `dist/pio/static` when `spineModelConfig.enable` is false, and all of `dist/pio` when both are off (~15 MiB). It no-ops when both are enabled.

## Deployment

- **EdgeOne Pages** (Tencent Cloud) is the live host for the site — rebuilds on every push to `master`. The public entry point is `https://azuma.mstzuomu.space` (`siteConfig.site_url`); `www.mstzuomu.space` and the bare domain 302-redirect to it from an inline script in `Layout.astro`.
- Root-level `wrangler.jsonc`, `wrangler.toml` and `vercel.json` are template leftovers, **not** the deployment path. `astro.config.mjs` attaches the Cloudflare adapter only when `CF_WORKERS` is set; otherwise the build is fully static. Do not edit those files or run `wrangler deploy` to "fix" deployment.
- `publisher/` is deployed separately to Vercel (`pub.mstzuomu.space`), with its own root directory and environment variables.
- `.github/workflows/deploy.yml` targets GitHub Pages and has never worked in this repository; it is unrelated to the live site. `build.yml` runs only `astro check` + `astro build`, so CI is not a substitute for a local `pnpm build`.
- Static output goes to `dist/`.

