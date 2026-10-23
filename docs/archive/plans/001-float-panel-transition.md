# 001 — 修复 float-panel 基类过渡（搜索面板/快捷面板开合瞬移）

- **Status**: DONE
- **Commit**: b63bf908
- **Severity**: HIGH
- **Category**: Missed opportunities / 防止突变
- **Estimated scope**: 2 文件（1 个 CSS + 4 处 markup 去除 `transition-all`，共 5 处改动点）

## Problem

`.float-panel` 基类只过渡颜色属性，开合状态类却切换 `opacity` 与 `translate`，导致没有额外
transition 工具类的面板**瞬开瞬关**：

`src/styles/main.css:487`（当前代码）：

```css
    .float-panel {
        @apply top-21 rounded-(--radius-large) overflow-hidden bg-(--card-bg) transition-colors duration-150 shadow-xl border border-black/5 dark:border-white/10
    }
    .float-panel-closed {
        @apply -translate-y-1 opacity-0 pointer-events-none
    }
```

编译产物验证（dist 实测）：

- `.float-panel{...transition-property:color,background-color,border-color,...;transition-duration:.15s}` —— **不含 opacity/translate**
- `.float-panel-closed{pointer-events:none;--tw-translate-y:calc(var(--spacing,.25rem) * -1);translate:var(--tw-translate-x) var(--tw-translate-y);opacity:0}`
  —— 关闭态用的是 **独立 `translate` 属性（Tailwind v4 行为），不是 `transform`**！
  transition 必须写 `translate`，写 `transform` 修了个寂寞。

瞬移的两个面板（markup 里没有 `transition-all`）：

- `src/components/controls/Search.svelte:182` —— `class="float-panel float-panel-closed search-panel absolute ..."`（无任何 transition 工具类）
- `src/components/layout/Navbar.astro:253` —— `id="navbar-quick-panel"`，`class="float-panel float-panel-closed absolute top-full ..."`（同上）

另有 4 个面板靠 markup 里的 `transition-all` 才有动画（`transition: all` 违反 never-ship 规则，
且与基类形成两套并行机制）：

- `src/components/layout/Navbar.astro:240`（music-nav-panel）
- `src/components/layout/NavMenuPanel.astro:18`（导航菜单卡片）
- `src/components/controls/DisplaySettingsIntegrated.svelte:696`
- `src/components/controls/LightDarkSwitch.svelte:127`

## Target

1. `src/styles/main.css` 的 `.float-panel`：从 `@apply` 移除 `transition-colors duration-150`，
   改为显式 transition（关闭态在上方 4px、打开即「向下落位 + 淡入」→ 进入用 ease-out 族的
   `--ease-decelerate`；颜色沿用 `--ease-standard`，与其编译产物 `cubic-bezier(.4,0,.2,1)` 完全一致，
   颜色行为零变化）：

```css
    .float-panel {
        @apply top-21 rounded-(--radius-large) overflow-hidden bg-(--card-bg) shadow-xl border border-black/5 dark:border-white/10;
        transition:
            opacity var(--duration-normal) var(--ease-decelerate),
            translate var(--duration-normal) var(--ease-decelerate),
            color var(--duration-normal) var(--ease-standard),
            background-color var(--duration-normal) var(--ease-standard),
            border-color var(--duration-normal) var(--ease-standard);
    }
```

2. 紧随其后加 reduced-motion（保淡入、去位移；translate 不在过渡列表里会瞬时落位，
   正是「更少更温和」的语义）：

```css
    @media (prefers-reduced-motion: reduce) {
        .float-panel {
            transition:
                opacity var(--duration-normal) var(--ease-standard),
                color var(--duration-normal) var(--ease-standard),
                background-color var(--duration-normal) var(--ease-standard),
                border-color var(--duration-normal) var(--ease-standard);
        }
    }
```

3. 从 4 个 markup 中删除 `transition-all` 这一个词（其余 class 保持原序不动）：
   - `Navbar.astro:240`：`class="float-panel float-panel-closed absolute right-16 p-2 pt-4.5 w-80 z-50"`
   - `NavMenuPanel.astro:18`：`class="float-panel float-panel-closed fixed right-4 top-21 z-50 px-2 py-2 max-h-[80vh] overflow-y-auto nav-menu--card"`
   - `DisplaySettingsIntegrated.svelte:696`：`class="float-panel float-panel-closed absolute w-80 right-4 px-3 pt-0 pb-3 max-h-[80vh] overflow-y-auto custom-scrollbar"`
   - `LightDarkSwitch.svelte:127`：`class="float-panel float-panel-closed absolute top-21 right-4 p-2 z-50"`

   删掉后这些面板回落到基类的显式过渡（覆盖其全部状态变化：opacity + translate + 颜色），
   全站浮层统一为一套机制。

## Repo conventions to follow

- 曲线/时长 token 定义在 `src/styles/variables.styl:181-191`：`--ease-standard`、`--ease-decelerate`、
  `--duration-normal`（150ms）。**只用这些，不新增曲线**。
- 缩进：main.css 为 4 空格（保持文件现状）；Svelte/Astro markup 保持原缩进。

## Boundaries

- 不要动 `.float-panel-closed` 的状态值（`-translate-y-1 opacity-0`）。
- 不要动 `NavMenuPanel.astro` 里 drawer/scrim/accordion 的 scoped 过渡
  （`transition: none`、`transform 0.3s var(--ease-decelerate)` 那些是刻意设计，19文章 记录过）。
- 不要动 `navbar.css` 的收拢逻辑与 `.is-theme-transitioning` 的过渡禁用规则。
- 不要给 `.float-panel` 加 `transition: all`。
- 如果发现这 4 处 markup 与描述不符（漂移），STOP 并报告。

## Verification

- **Mechical**: `npx biome check src/styles/main.css src/components/layout/Navbar.astro src/components/layout/NavMenuPanel.astro src/components/controls/DisplaySettingsIntegrated.svelte src/components/controls/LightDarkSwitch.svelte src/components/controls/Search.svelte`（只读，预期 0 error 或与改前一致）；`pnpm type-check`（与基线一致）。
- **Feel check**（dev server + Playwright/浏览器）：
  - 点搜索按钮：面板应 150ms 淡入 + 下落 4px，而不是瞬间出现；连点开/关两次，过渡应从当前值重定
    向（CSS transition 天然可中断，不应从头重播）。
  - 快捷面板（窄屏汉堡旁）、音乐面板、显示设置、主题面板逐一开合：全部有动画，且观感一致。
  - DevTools → Rendering → 勾选 `prefers-reduced-motion`：面板应无位移、仅淡入淡出。
  - Elements 面板选中 `#search-panel`，Computed 里 `transition-property` 应含 `opacity` 与 `translate`。
- **Done when**: 上述检查全过，且 `git diff` 只含本计划列出的改动。
