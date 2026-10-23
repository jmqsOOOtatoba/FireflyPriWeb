# 003 — 公告栏关闭：折叠淡出而非瞬隐

- **Status**: DONE
- **Commit**: b63bf908
- **Severity**: MEDIUM
- **Category**: 防止突变
- **Estimated scope**: 1 文件（Announcement.astro 单个 onclick）

## Problem

`src/components/widget/Announcement.astro:56`（当前代码）：

```html
onclick="this.closest('widget-layout').style.display='none'"
```

一击 `display:none`，公告整块瞬消，侧栏下方组件整体**跳位**。罕见操作（dismiss 一次），
属于可以给标准动画的档位。

已核实的布局事实（计划依赖，执行时若变化则 STOP）：

- `widget-layout` 是 `SideBar.astro` 内 `flex flex-col ... gap-4` 容器的直接子项
  （`SideBar.astro:176/190/208` 三处容器均为 `gap-4` = 1rem），**flex 子项被 blockify**，
  所以自定义元素 `widget-layout` 计算值是 block，`max-height` 可用。
- 父容器 `gap-4`：元素收成 0 高后仍占「两侧 gap」，直接 `display:none` 会在动画结束时
  再产生一次 16px 跳位 —— 需同步把 `margin-bottom` 收到 `-1rem` 吞掉一个 gap，使
  「折叠终态」与「移除终态」位置连续。
- `WidgetLayout.astro:35` 根元素带 `card-base`（`main.css:331`），已含 `overflow:hidden`，
  折叠时内容自然裁切，无需再设。

## Target

把单行 onclick 替换为自包含的折叠处理器（仍是 inline 属性 —— Swup 换页重载脚本时
inline handler 零绑定风险，与现状同模式）。新 onclick（写在原 :56 行，属性值放一行）：

```
onclick="var w=this.closest('widget-layout');if(!w||w.dataset.closing)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){w.style.display='none';return}w.dataset.closing='1';w.style.maxHeight=w.offsetHeight+'px';w.style.marginBottom='0';void w.offsetHeight;requestAnimationFrame(function(){w.style.transition='opacity 200ms var(--ease-standard),max-height 200ms var(--ease-standard),margin-bottom 200ms var(--ease-standard)';w.style.opacity='0';w.style.maxHeight='0';w.style.marginBottom='-1rem'});setTimeout(function(){w.style.display='none'},240)"
```

> 审查修正记录（2026-10-13，实测后修订）：
> ① 初版误写成 `(function(){...})`（未调用的函数表达式，整个 handler 是空操作）；
> 修正方向也曾想用 `(function(){...})()`——但**立即调用的普通函数内部 `this` 不是按钮**，
> `this.closest` 会抛 TypeError。最终形态：**不包 IIFE，语句直接写在 inline handler 顶层**
> （handler 本身即函数体，`this` = 按钮、`return`/`var` 均合法）。
> ② 起始值写入后必须 `void w.offsetHeight;` 强制回流，否则起止值合并进同一次样式计算，
> `max-height` 变成 `none→0` 无法插值，折叠瞬移。
> ③ widget-layout 带 `onload-animation`（`transition.css` 的 `fade-in-up ... forwards`）：
> 已完成动画的 fill 值优先级高于 inline style，且 **Chrome 中由移除动画引起的值变化不触发
> transition**——在根元素上做 opacity 淡出走不通（实测两轮：先被 fill 压死为 1；掐掉 fill 后
> 又瞬跳为 0）。最终方案：**根元素只做 max-height + margin-bottom 折叠**（keyframes 不涉及
> 这两个属性，实测插值平滑），**opacity 淡出施加在 `w.children` 子元素**（标题与内容块，不受
> 父级 fill 影响），rAF 内同帧启动，240ms 后 display:none 收尾。

语义逐步：

1. `dataset.closing` 防动画期间重入。
2. reduce-motion → 直接 `display:none`（位移类动画整体砍掉是标准做法；此操作为一次性 dismiss，
   无理解辅助需求）。
3. 首帧先固化 `max-height = 实测高度`（从 auto 起步无法过渡）、`margin-bottom: 0`，
   紧接着 `void w.offsetHeight;` **强制回流**——没有这一步，起始值与 rAF 里的终值会被
   浏览器合并进同一次样式计算，`max-height` 变成 `none→0` 无法插值，折叠直接瞬移（审查时发现的缺陷）。
4. 下一帧（rAF）设置 transition + 三属性终值：`opacity→0`、`max-height→0`（折叠，高度动画在
   「手风琴/折叠」场景是 sanitize 的例外）、`margin-bottom→-1rem`（吞掉父容器一个 gap，
   使 C 项位置从 `2g+h` 平滑走到 `g`，与 display:none 后完全连续，无二次跳位）。
5. 240ms（200ms + 余量）后 `display:none`。

曲线全部走 `var(--ease-standard)`（token 在 `:root` 上，inline style 可解析）；
200ms 落在 UI 150-250ms 档。全部属性变更收敛在单个元素，无 `transition: all`。

## Repo conventions to follow

- 保持 Astro 组件内 inline onclick 模式（本文件现状即如此，无 script 块）。
- 不引入新文件、不引入 `<script>`。

## Boundaries

- 只改 `Announcement.astro` 的这一个 onclick 属性值；按钮的 class、aria-label、图标不动。
- 不动 `WidgetLayout.astro`（含其 expand/collapse 手风琴逻辑）。
- 不动 SideBar 布局与 gap。
- 若 `widget-layout` 实际渲染为 inline（计算 display ≠ block），STOP 并报告（说明布局假设失效）。

## Verification

- **Mechical**: `npx biome check src/components/widget/Announcement.astro`；`pnpm type-check`。
- **Feel check**（dev，首页侧栏）：
  - 点关闭：公告 200ms 淡出 + 折叠，下方组件平滑上移就位；结束瞬间**无**额外 16px 跳。
  - 动画进行中（200ms 内）再点：无反应（closing 防重入）。
  - 放慢（duration ×5）看：高度连续收缩，内容被 card-base 的 overflow 裁掉，不外溢。
  - Rendering 勾 reduce-motion：点击即消失。
  - 换一次页（Swup）后再点（若公告在新页存在）：handler 仍生效（inline 属性随 DOM 走）。
- **Done when**: 上述全过；`git diff` 仅含该 onclick 行。
