# 005 — TabGroup 代码组切标签：内容 opacity 桥接

- **Status**: DONE
- **Commit**: b63bf908
- **Severity**: LOW
- **Category**: 防止突变
- **Estimated scope**: 1 文件（TabGroup.svelte）

## Problem

`src/components/common/TabGroup.svelte:44-46`（当前代码）：

```js
	blocks.forEach((block, i) => {
		block.style.display = i === active ? "" : "none";
	});
```

切标签时代码块 `display` 硬换，内容瞬移。读文章时切代码语言是偶尔操作，适合一段短的
opacity 桥接；**代码是用户在读的数据，只做透明度、不做位移**。

相关结构：

- 状态：`:27` `let active = $state(0);`；切换入口：`:58` `onclick={() => (active = i)}`
- 显示逻辑在 `$effect`（`:33-47`）里按 `active` 写 `block.style.display`
- 容器：`:65` `<div class="code-group-blocks">`
- scoped style 已有 token 先例：`:88-90` 使用
  `var(--duration-normal) var(--ease-standard)`

## Target

淡出 → 换显示 → 淡入（与 004 同模式，保持全站一致）：

1. scoped style 加（追加到 `<style>` 内）：

   ```css
	.code-group-blocks {
		transition: opacity var(--duration-normal) var(--ease-decelerate);
	}
   ```

2. 给 `:65` 的容器加绑定：`style="opacity: {tabFading ? 0 : 1}"`。

3. script 加状态与切换函数，`:58` 的 onclick 改走它：

   ```js
	let tabFading = $state(false);

	async function selectTab(i: number) {
		if (i === active || tabFading) return;
		tabFading = true;
		await new Promise((r) => setTimeout(r, 150));
		active = i; // $effect 随即换 display（此刻容器不可见，硬切被藏住）
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		tabFading = false;
	}
   ```

   onclick：`onclick={() => selectTab(i)}`。

要点：

- `tabFading` 守卫使连点不叠动画（快速触发下 transition 会重定向，但 active 变更点必须
  藏在淡出谷底，守卫保证语义简单）。
- 150/150ms 两段各在 UI 预算内；总 300ms 是「读内容换页」可感知但不拖沓的节奏。
- 按钮自身的 `color/border-color` 过渡（`:88-90`）保持不动 —— 指示器立即响应，内容随后桥接，
  两者分工不冲突。
- reduce-motion：opacity 过渡属保留项，无需分支。

## Repo conventions to follow

- token 用 `var(--duration-normal)` / `var(--ease-decelerate)`（本文件已有 token 用法先例）。
- Svelte 5 runes，tab 缩进。

## Boundaries

- 只动 TabGroup.svelte；`role="tab"` / `aria-selected` / 按钮样式一律不动。
- 不给 `.code-group-tab` 的 hover/active 加新动画。
- 不改 `$effect` 内的 display 逻辑（它照旧由 `active` 驱动）。
- 若文件与摘录不符，STOP 并报告。

## Verification

- **Mechical**: `npx biome check src/components/common/TabGroup.svelte`；`pnpm type-check`。
- **Feel check**（dev，打开一篇含 `TabGroup` 的 MDX/文章）：
  - 点第二个标签：内容 150ms 淡出 → 换块 → 150ms 淡入；标签下划线/颜色**立即**变。
  - 连点两个标签：无叠加闪烁（守卫生效），最终停在最后点的标签。
  - 代码块高度不同的切换：因换块发生在 opacity=0 谷底，高度跳变被藏住，页面无「闪烁感」。
  - reduce-motion：仅透明度过渡。
- **Done when**: 切标签不再瞬移，按钮反馈依旧即时。
