# 002 — 详情模态：背板淡入 + 卡片进出场（补退场）

- **Status**: DONE
- **Commit**: b63bf908
- **Severity**: MEDIUM
- **Category**: 防止突变 / 中断性
- **Estimated scope**: 2 文件（结构相同的 Svelte 组件）

## Problem

`src/components/pages/anime/AnimeDetailModal.svelte` 与
`src/components/pages/bilibili/BilibiliDetailModal.svelte`（同一模板复制）：

1. 背板（`bg-black/60 backdrop-blur-sm`）随 `{#if anime}` **瞬间出现/消失**，无任何过渡。
2. 卡片入场靠 CSS keyframes（`animate-in`，200ms ease-out，`translateY(10px)→0`），
   但 Svelte `{#if}` 移除时无退场 —— 关闭（Esc / 点背板 / 点关闭钮）**直接蒸发**。
3. 内置 `ease-out` 偏弱（never-ship：刻意动画应使用强曲线）。

`AnimeDetailModal.svelte:64-74`（当前代码；bilibili 同构，keyframes 在 :179-191）：

```svelte
{#if anime}
	<div
		use:portal
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
		onclick={handleBackdropClick}
		...
	>
		<div class="relative w-full max-w-lg max-h-[90vh overflow-hidden rounded-xl sm:rounded-2xl bg-(--card-bg) border border-(--line-divider) shadow-2xl animate-in scale-90 sm:scale-100">
```

> 注：摘录时 `max-h-[90vh]` 少了 `]`，以文件实际为准（`max-h-[90vh]`）。

`AnimeDetailModal.svelte:185-198`（当前 style）：

```css
	@keyframes animate-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-in {
		animation: animate-in 0.2s ease-out;
	}
```

## Target

用 Svelte transition 同时接管进、出（transition 可中断，keyframes 会从零重播）。
逐文件改动：

1. script 顶部加 import：

```ts
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
```

2. script 内加 reduced-motion 辅助（退场位移在 reduce 下归零，保留 opacity）：

```ts
const prefersReducedMotion = () =>
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

3. 背板 div（外层，`use:portal` 那个）加 in/out：

```svelte
	in:fade={{ duration: 200, easing: cubicOut }}
	out:fade={{ duration: 150, easing: cubicOut }}
```

4. 卡片 div：从 class 里**删掉 `animate-in`**（保留 `scale-90 sm:scale-100` 等其余类），
   加 in/out（入场与现状等价：自下方 10px 落入；出场逆向走同一边缘）：

```svelte
	in:fly={{ y: prefersReducedMotion() ? 0 : 10, duration: 200, easing: cubicOut }}
	out:fly={{ y: prefersReducedMotion() ? 0 : 10, duration: 150, easing: cubicOut }}
```

5. 删除整个 `<style>` 块中的 `@keyframes animate-in` 与 `.animate-in` 规则；
   若 `<style>` 变空则连块一起去掉（两文件均只含这两条规则时会为空）。

时长依据：入场 200ms（维持现状，modals 档 200-500ms），出场 150ms（出场快于入场的非对称节奏；
UI 单段 <300ms）。`cubicOut` 是 svelte/easing 的具名强 ease-out 函数（JS 无法消费 CSS cubic-bezier
字符串，用框架自带函数而非手搓近似值）。

## Repo conventions to follow

- 两文件改动完全一致，diff 对称。
- 保留 `use:portal`、`handleBackdropClick`、`handleKeydown`、`aria-*` 一律不动。
- Svelte 5 + runes 项目；新代码用 `lang="ts"` 下的普通函数即可。

## Boundaries

- 不要改模态的内容结构、类名（除删 `animate-in`）、样式（颜色/圆角/阴影）。
- 不要动 `SharePoster.svelte` 的 portal（无关）。
- 不要把 in/out 时长改成大于 300ms。
- 若文件与摘录不符（漂移），STOP 并报告。

## Verification

- **Mechical**: `npx biome check src/components/pages/anime/AnimeDetailModal.svelte src/components/pages/bilibili/BilibiliDetailModal.svelte`；`pnpm type-check`。
- **Feel check**：
  - 打开追番页 → 点任意卡片：背板 200ms 淡入、卡片 200ms 自下方 10px 升入。
  - 按 Esc 关闭：卡片 150ms 下落淡出、背板同步淡出（两者并行，总时长 150ms），不再瞬消。
  - 打开后**立刻**（200ms 内）Esc：退场应从中途状态接管，不闪回起点（transition 重定向）。
  - dev 中把两个 duration 临时 ×5 放慢看逐帧；DevTools Animations 面板确认无 keyframe 条目。
  - Rendering 面板勾 `prefers-reduced-motion`：无位移、仅淡入淡出。
  - bilibili 页重复以上（同一实现）。
- **Done when**: 两文件 `grep -c animate-in` 为 0，进/出场如上可观察。
