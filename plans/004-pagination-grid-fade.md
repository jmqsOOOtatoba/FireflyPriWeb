# 004 — 画廊/动态分页翻页：网格内容 opacity 桥接

- **Status**: DONE
- **Commit**: b63bf908
- **Severity**: MEDIUM
- **Category**: 防止突变
- **Estimated scope**: 6 个 Svelte 文件（同一模式，允许合并执行）

## Problem

翻页时 `currentPage` 一改，`{#each}` 立即换一批卡片，整块内容**瞬移替换**，用户不知道内容已换。
翻页是偶尔操作（浏览画廊/动态），适合标准动画；只动 `opacity`，不碰布局。

涉及文件与现状（`goToPage` 均为直接改 `currentPage`，无过渡）：

- `src/components/pages/anime/AnimeGrid.svelte:128-130`
  ```js
  function goToPage(page: number) {
  	currentPage = page;
  }
  ```
  网格容器：`:180` `<div class="anime-card-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">`
- `src/components/pages/bilibili/BilibiliGrid.svelte:128-130`（同构；容器 `:180` `class="media-grid grid ..."`）
- `src/components/pages/vndb/VndbSection.svelte:99-103`（带 bounds 检查；容器 `:114` `class="media-grid grid ..."`）
- `src/components/pages/mal/MalSection.svelte:88-92`（带 bounds 检查；容器 `:103` 同上）
- `src/components/pages/bangumi/BangumiSection.svelte:156-160`（带 bounds 检查；容器 `:171` 同上）
- `src/components/pages/dynamic/DynamicFeed.svelte:257-263`
  ```js
  function goToPage(page: number) {
  	currentPage = page;
  	updateUrl(true);
  	document.querySelector(".page-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  ```
  列表容器：`:344` `<div class="page-feed" bind:this={list}></div>`（内容由 `$effect` →
  `renderItems()` 命令式渲染）

## Target

统一模式：**淡出 → 换页 → 淡入**（transition 非 keyframes，快速连点可重定向）。

对前 5 个文件（Svelte 声明式渲染）：

1. 给网格容器 div 加（直接写在容器 class/style 上）：

   ```
   style="opacity: {gridFading ? 0 : 1}; transition: opacity var(--duration-normal) var(--ease-decelerate)"
   ```

   若该组件已有 scoped `<style>`，也可用 class + style 块实现，二选一，保持两写法之一全文件一致。
   （组件无 scoped style 时用 inline style 最省事——推荐 inline。）

2. script 加状态与新 goToPage（保留原 bounds 检查的文件照抄检查；`resetPage`/filter 路径**不**走动画）：

   ```js
   let gridFading = $state(false);

   async function goToPage(page: number) {
   	// 原有 bounds 检查（Vndb/Mal/Bangumi 有，Anime/Bilibili 无则省略）
   	if (page < 1 || page > totalPages || page === currentPage) return;
   	gridFading = true;
   	await new Promise((r) => setTimeout(r, 150));
   	currentPage = page;
   	await new Promise((r) => requestAnimationFrame(() => r(null)));
   	gridFading = false;
   }
   ```

   注意：
   - Anime/Bilibili 的 `goToPage` 原本无 bounds/相等检查 —— **加上 `page === currentPage` 短路**
     （ClientPagination 已过滤，但双保险防动画空跑）；`totalPages` 变量名以各文件实际为准，
     没有就只保留 `page === currentPage` 检查。
   - 150ms = `--duration-normal` 档；进出同速可接受（内容桥接非出入场）。
   - 退化保护：reduce-motion 下 opacity 过渡本就是「保留项」（无位移），无需分支。

3. DynamicFeed 特殊：其渲染由 `$effect(() => renderItems(pageEntries))` 驱动。改法：

   ```js
   let gridFading = $state(false);

   async function goToPage(page: number) {
   	if (page === currentPage) return;
   	gridFading = true;
   	await new Promise((r) => setTimeout(r, 150));
   	currentPage = page;
   	updateUrl(true);
   	document.querySelector(".page-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
   	await new Promise((r) => setTimeout(r, 0)); // 让 effect/renderItems 至少跑一帧
   	gridFading = false;
   }
   ```

   容器 `:344` 加与上面相同的 `style` 绑定。
   若执行时发现淡入起点早于列表实际重渲染（肉眼可见旧内容闪现），把第二个等待改为
   `await tick()`（import { tick } from "svelte"）后再 `await` 一帧 rAF，并在报告中注明。

## Repo conventions to follow

- token：`var(--duration-normal)`、`var(--ease-decelerate)`（`src/styles/variables.styl:181-191`），不新增曲线。
- 项目为 Svelte 5 runes：新状态用 `$state`。
- 缩进随各文件现状（这些组件多为 tab）。

## Boundaries

- 只动 `goToPage` 与网格/列表容器两个位置；**不**给搜索输入、筛选 chip、排序下拉加动画
  （键盘/高频路径，已明确否决）。
- 不改 ClientPagination 组件本身。
- 不改分页 URL、滚动逻辑（DynamicFeed 的 scrollIntoView 保留）。
- 6 个文件之外不碰。若某文件结构与摘录不符，STOP 并报告该文件。

## Verification

- **Mechical**: `npx biome check` 上述 6 文件（只读）；`pnpm type-check`。
- **Feel check**（dev）：
  - 追番/哔哩/ VNDB / MAL / Bangumi：点第 2 页 → 网格 150ms 淡出、换内容、150ms 淡入；
    连点「下一页」两次 → 动画从当前 opacity 平滑重定向，不闪烁卡顿。
  - 搜索框打字筛选：**依旧瞬时**（无动画）。
  - 动态页翻页：同样淡出淡入，且地址栏 URL、滚动位置行为与改前一致。
  - 窗口 reduce-motion：无位移、仅透明度过渡（本方案天然满足）。
- **Done when**: 6 文件全部翻页可见 opacity 桥接，搜索/筛选路径零动画。
