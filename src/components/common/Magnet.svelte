<script lang="ts">
/**
 * 磁吸按钮包装：hover 时内容向光标轻微位移。
 *
 * - 触摸设备（pointer: coarse）与 prefers-reduced-motion 下不启用
 * - 只写 transform，不读写交错布局属性（每帧仅一次 getBoundingClientRect）
 * - 不拦截点击/焦点：内层保持正常可交互，仅作视觉位移
 */
import type { Snippet } from "svelte";
import { onMount } from "svelte";

interface Props {
	/** 激活半径外扩（px），越大越早被吸住 */
	padding?: number;
	/** 位移分母：越大位移越小 */
	strength?: number;
	/** 强制禁用 */
	disabled?: boolean;
	class?: string;
	children?: Snippet;
}

let {
	padding = 48,
	strength = 2.8,
	disabled = false,
	class: className = "",
	children,
}: Props = $props();

let rootEl: HTMLSpanElement | undefined = $state();
let innerEl: HTMLSpanElement | undefined = $state();

let active = false;
let offsetX = 0;
let offsetY = 0;
let enabled = false;
/** 指针是否在 padding 邻域内：出域后不再每帧测矩形 */
let inRange = false;

function applyTransform() {
	const inner = innerEl;
	if (!inner) return;
	inner.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
	inner.style.transition = active
		? "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)"
		: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
}

function reset() {
	active = false;
	inRange = false;
	offsetX = 0;
	offsetY = 0;
	applyTransform();
}

function onPointerMove(e: PointerEvent) {
	if (!enabled || disabled || !rootEl) return;
	if (e.pointerType !== "mouse") return;
	const el = rootEl;

	// 出邻域时用一次矩形读判定，进入后才继续跟随；离开即归零
	const rect = el.getBoundingClientRect();
	const cx = rect.left + rect.width / 2;
	const cy = rect.top + rect.height / 2;
	const dx = e.clientX - cx;
	const dy = e.clientY - cy;
	const rangeX = rect.width / 2 + padding;
	const rangeY = rect.height / 2 + padding;

	if (Math.abs(dx) < rangeX && Math.abs(dy) < rangeY) {
		inRange = true;
		active = true;
		// 轻柔磁吸：中心处位移趋近 0，边缘最大
		offsetX = dx / strength;
		offsetY = dy / strength;
		applyTransform();
		return;
	}
	if (inRange) reset();
}

onMount(() => {
	const mqCoarse = window.matchMedia("(pointer: coarse)");
	const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

	const syncEnabled = () => {
		enabled = !mqCoarse.matches && !mqReduce.matches && !disabled;
		if (!enabled) reset();
	};
	syncEnabled();
	mqCoarse.addEventListener("change", syncEnabled);
	mqReduce.addEventListener("change", syncEnabled);

	// passive：不阻塞滚动；数量级为个位 CTA，每帧一次矩形读可接受
	window.addEventListener("pointermove", onPointerMove, { passive: true });

	return () => {
		mqCoarse.removeEventListener("change", syncEnabled);
		mqReduce.removeEventListener("change", syncEnabled);
		window.removeEventListener("pointermove", onPointerMove);
	};
});
</script>

<span
	bind:this={rootEl}
	class="ff-magnet {className}"
>
	<span bind:this={innerEl} class="ff-magnet-inner">
		{@render children?.()}
	</span>
</span>

<style>
	.ff-magnet {
		position: relative;
		display: inline-block;
		/* 磁吸位移允许轻微溢出，避免裁切 */
		overflow: visible;
	}

	.ff-magnet-inner {
		display: inline-block;
		will-change: transform;
		/* 仅 transform 动画，不触发 layout */
		transform: translate3d(0, 0, 0);
	}

	@media (prefers-reduced-motion: reduce) {
		.ff-magnet-inner {
			transition: none !important;
			transform: none !important;
		}
	}
</style>
