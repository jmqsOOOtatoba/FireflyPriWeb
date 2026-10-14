<script lang="ts">
/**
 * 导航栏液态融合指示器（装饰层，不接管链接渲染）。
 *
 * 挂在 navbar-seg-center 内，跟踪触发器 hover，用 SVG goo 滤镜
 * （feGaussianBlur + feColorMatrix）让胶囊与小粒子在靠近时融合。
 * 只覆盖导航条局部区域；触摸设备与 prefers-reduced-motion 下完全不启用。
 *
 * 取舍说明：主导航 DropdownMenu 含下拉子菜单与键盘导航，不宜整体换成
 * 自绘 nav；本组件以零侵入装饰层接入，保留原有语义与交互。
 */
import { onMount } from "svelte";

interface Props {
	/** 跟踪的触发器选择器（相对 document；默认桌面中段导航按钮） */
	targetSelector?: string;
	/** 粒子数量（0 关闭粒子，只留胶囊） */
	particleCount?: number;
}

let {
	targetSelector = ".navbar-seg-center .dropdown-container > .btn-plain",
	particleCount = 6,
}: Props = $props();

let layerEl: HTMLDivElement | undefined = $state();

/** 当前胶囊中心（相对 layer），仅在 hover 切换时读一次布局 */
let pillX = $state(0);
let pillY = $state(0);
let pillW = $state(0);
let pillH = $state(0);
let pillVisible = $state(false);
let pillReady = $state(false);

let enabled = false;
let lastCenter: { x: number; y: number; w: number; h: number } | null = null;

function measureTarget(el: Element, layer: HTMLElement) {
	const rect = el.getBoundingClientRect();
	const base = layer.getBoundingClientRect();
	return {
		x: rect.left - base.left,
		y: rect.top - base.top,
		w: rect.width,
		h: rect.height,
	};
}

function placePill(box: { x: number; y: number; w: number; h: number }) {
	pillX = box.x;
	pillY = box.y;
	pillW = box.w;
	pillH = box.h;
	pillVisible = true;
	pillReady = false;
	// 下一帧再挂 active，让 transition 从 scale(0) 起步
	requestAnimationFrame(() => {
		pillReady = true;
	});
}

function hidePill() {
	pillVisible = false;
	pillReady = false;
	lastCenter = null;
}

/** 从旧胶囊中心向新目标飞出小粒子，goo 滤镜下与主胶囊融合 */
function spawnMergeDots(
	from: { x: number; y: number; w: number; h: number },
	to: { x: number; y: number; w: number; h: number },
) {
	if (!layerEl || particleCount <= 0) return;
	const fx = from.x + from.w / 2;
	const fy = from.y + from.h / 2;
	const tx = to.x + to.w / 2;
	const ty = to.y + to.h / 2;
	const n = Math.min(particleCount, 8);
	for (let i = 0; i < n; i++) {
		const dot = document.createElement("div");
		dot.className = "ff-goo-dot";
		dot.setAttribute("aria-hidden", "true");
		const sx = fx + (Math.random() - 0.5) * from.w * 0.55;
		const sy = fy + (Math.random() - 0.5) * from.h * 0.7;
		const ex = tx + (Math.random() - 0.5) * to.w * 0.35;
		const ey = ty + (Math.random() - 0.5) * to.h * 0.55;
		dot.style.left = "0";
		dot.style.top = "0";
		// 先落到起点（此刻禁用 transition，避免从 0,0 飞入）
		const s0 = 0.35 + Math.random() * 0.4;
		dot.style.transition = "none";
		dot.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${s0})`;
		layerEl.appendChild(dot);
		requestAnimationFrame(() => {
			dot.style.transition = "";
			dot.style.opacity = "0.35";
			dot.style.transform = `translate3d(${ex}px, ${ey}px, 0) scale(0.12)`;
		});
		const life = 480 + Math.random() * 220;
		window.setTimeout(() => {
			dot.remove();
		}, life);
	}
}

function onPointerOver(e: PointerEvent) {
	if (!enabled || !layerEl) return;
	if (e.pointerType !== "mouse") return;
	const target = e.target;
	if (!(target instanceof Element)) return;
	const trigger = target.closest(targetSelector);
	if (!trigger) return;
	// 仅响应挂在本 layer 同一 seg 下的触发器
	const host = layerEl.parentElement;
	if (!host?.contains(trigger)) return;

	const box = measureTarget(trigger, layerEl);
	if (lastCenter) {
		const moved =
			Math.abs(lastCenter.x - box.x) > 2 ||
			Math.abs(lastCenter.y - box.y) > 2 ||
			Math.abs(lastCenter.w - box.w) > 2;
		if (moved) spawnMergeDots(lastCenter, box);
	}
	lastCenter = box;
	placePill(box);
}

function onPointerOut(e: PointerEvent) {
	if (!enabled || !layerEl) return;
	const related = e.relatedTarget;
	const host = layerEl.parentElement;
	// related 仍在导航段内：交给 pointerover 换位，不收起
	if (related instanceof Node && host?.contains(related)) return;
	hidePill();
}

function onFocusIn(e: FocusEvent) {
	if (!enabled || !layerEl) return;
	const target = e.target;
	if (!(target instanceof Element)) return;
	const trigger = target.closest(targetSelector);
	if (!trigger) return;
	const host = layerEl.parentElement;
	if (!host?.contains(trigger)) return;
	const box = measureTarget(trigger, layerEl);
	lastCenter = box;
	placePill(box);
}

function onFocusOut(e: FocusEvent) {
	if (!enabled || !layerEl) return;
	const related = e.relatedTarget;
	if (related instanceof Element && layerEl.parentElement?.contains(related)) {
		return;
	}
	hidePill();
}

onMount(() => {
	const layer = layerEl;
	if (!layer) return;

	const mqCoarse = window.matchMedia("(pointer: coarse)");
	const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
	// 中段仅桌面可见（lg+）；隐藏时不挂监听
	const mqDesktop = window.matchMedia("(min-width: 1024px)");

	const syncEnabled = () => {
		enabled = !mqCoarse.matches && !mqReduce.matches && mqDesktop.matches;
		if (!enabled) hidePill();
	};
	syncEnabled();
	mqCoarse.addEventListener("change", syncEnabled);
	mqReduce.addEventListener("change", syncEnabled);
	mqDesktop.addEventListener("change", syncEnabled);

	const host = layer.parentElement;
	// pointerover/out 在 seg 上冒泡委托，避免给每个链接单独绑
	host?.addEventListener("pointerover", onPointerOver as EventListener);
	host?.addEventListener("pointerout", onPointerOut as EventListener);
	host?.addEventListener("focusin", onFocusIn);
	host?.addEventListener("focusout", onFocusOut);

	const onWinLeave = () => hidePill();
	window.addEventListener("pointerdown", onWinLeave);

	return () => {
		mqCoarse.removeEventListener("change", syncEnabled);
		mqReduce.removeEventListener("change", syncEnabled);
		mqDesktop.removeEventListener("change", syncEnabled);
		host?.removeEventListener("pointerover", onPointerOver as EventListener);
		host?.removeEventListener("pointerout", onPointerOut as EventListener);
		host?.removeEventListener("focusin", onFocusIn);
		host?.removeEventListener("focusout", onFocusOut);
		window.removeEventListener("pointerdown", onWinLeave);
	};
});
</script>

<!-- 唯一的 SVG 滤镜定义：id 全站一份，指示器层 filter 引用它 -->
<svg class="ff-goo-svg" aria-hidden="true">
	<defs>
		<filter id="ff-goo-nav" x="-40%" y="-40%" width="180%" height="180%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="ff-blur" />
			<feColorMatrix
				in="ff-blur"
				mode="matrix"
				values="1 0 0 0 0
					0 1 0 0 0
					0 0 1 0 0
					0 0 0 18 -8"
				result="ff-goo"
			/>
			<feBlend in="SourceGraphic" in2="ff-goo" />
		</filter>
	</defs>
</svg>

<div
	class="ff-goo-layer"
	bind:this={layerEl}
	aria-hidden="true"
>
	<div
		class="ff-goo-pill"
		class:ff-goo-pill-ready={pillReady}
		style:transform="translate3d({pillX}px, {pillY}px, 0) scale({pillReady
			? 1
			: 0})"
		style:width="{pillW}px"
		style:height="{pillH}px"
		style:opacity={pillVisible ? "1" : "0"}
	></div>
</div>

<style>
	/* 滤镜定义层：不参与布局、不接受点击 */
	.ff-goo-svg {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
		pointer-events: none;
	}

	/* 装饰层：铺满父级 seg，指示器只盖导航条局部。
	   滤镜对低 alpha 源会把色阶压没（feColorMatrix 硬阈值），
	   故胶囊用实心色 + 整层 opacity 软化，亮暗皆随 --primary。 */
	.ff-goo-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: visible;
		filter: url(#ff-goo-nav);
		opacity: 0.28;
	}

	/* 主胶囊：实心主题色，供 goo 滤镜做硬边缘融合 */
	.ff-goo-pill {
		position: absolute;
		left: 0;
		top: 0;
		border-radius: 9999px;
		background: var(--primary);
		opacity: 0;
		transform-origin: center;
		will-change: transform;
		transition:
			transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.25s ease,
			width 0.35s cubic-bezier(0.22, 1, 0.36, 1),
			height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.ff-goo-pill-ready {
		opacity: 1;
	}

	/* 融合小粒子：与主胶囊同色实心；位移只走 transform */
	:global(.ff-goo-dot) {
		position: absolute;
		left: 0;
		top: 0;
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		background: var(--primary);
		pointer-events: none;
		will-change: transform;
		opacity: 1;
		transition:
			transform 0.5s cubic-bezier(0.33, 0, 0.2, 1),
			opacity 0.5s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.ff-goo-pill,
		:global(.ff-goo-dot) {
			transition: none;
		}
	}
</style>
