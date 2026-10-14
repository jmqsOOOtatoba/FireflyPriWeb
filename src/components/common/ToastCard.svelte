<script lang="ts">
import { onMount } from "svelte";

interface Props {
	message: string;
	duration?: number;
	onDismiss: () => void;
}

let { message, duration = 3500, onDismiss }: Props = $props();

const SLIDE_MS = 360;
const LEAVE_MS = 300;
const SWIPE_DISMISS_PX = 48;
const FLICK_VELOCITY = 0.11;
const DEAD_ZONE = 3;
const RUBBERBAND = 0.3;

let cardEl: HTMLDivElement | undefined = $state();
let fuseEl: HTMLSpanElement | undefined = $state();

let reducedMotion = false;
let leaving = $state(false);
let fuseAnim: Animation | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
let dismissed = false;

// 拖拽状态（纯局部变量，不进响应式系统避免无谓重渲染）
let dragId: number | null = null;
let dragStartY = 0;
let dragY = 0;
let history: Array<[number, number]> = [];
let hovering = false;

function dismiss() {
	if (dismissed || leaving) return;
	dismissed = true;
	fuseAnim?.pause();
	clearTimeout(fallbackTimer);
	cardEl?.removeAttribute("data-dragging");
	// 清掉拖拽内联 transform，交给 data-leaving 的 CSS 过渡收尾
	if (cardEl) cardEl.style.transform = "";
	leaving = true;
	setTimeout(onDismiss, reducedMotion ? 160 : LEAVE_MS + 20);
}

function syncFuse() {
	if (!fuseAnim) return;
	if (hovering || dragId !== null) {
		if (fuseAnim.playState === "running") fuseAnim.pause();
	} else if (fuseAnim.playState === "paused") {
		fuseAnim.play();
	}
}

function onPointerDown(e: PointerEvent & { currentTarget: HTMLDivElement }) {
	if (e.button !== 0 || leaving) return;
	dragId = e.pointerId;
	dragStartY = e.clientY;
	dragY = 0;
	history = [[performance.now(), 0]];
	try {
		e.currentTarget.setPointerCapture(e.pointerId);
	} catch {
		// 捕获失败仍可继续拖拽，仅失去部分边缘跟手性
	}
	syncFuse();
}

function onPointerMove(e: PointerEvent & { currentTarget: HTMLDivElement }) {
	if (dragId !== e.pointerId || !cardEl) return;
	const raw = e.clientY - dragStartY;
	if (Math.abs(raw) < DEAD_ZONE && history.length === 1) return;
	// 只允许下滑 + 上滑橡皮筋；全程只写 transform，不读布局
	dragY = raw >= 0 ? raw : raw * RUBBERBAND;
	cardEl.dataset.dragging = "";
	cardEl.style.transform = `translateY(${dragY}px)`;
	history.push([performance.now(), dragY]);
	if (history.length > 5) history.shift();
}

function velocityOf(): number {
	if (history.length < 2) return 0;
	const [t0, y0] = history[0];
	const [t1, y1] = history[history.length - 1];
	if (performance.now() - t1 > 100) return 0;
	return (y1 - y0) / Math.max(1, t1 - t0);
}

function onPointerUp(e: PointerEvent & { currentTarget: HTMLDivElement }) {
	if (dragId !== e.pointerId) return;
	dragId = null;
	try {
		e.currentTarget.releasePointerCapture(e.pointerId);
	} catch {
		// 已释放或从未捕获
	}
	const v = velocityOf();
	if (dragY > SWIPE_DISMISS_PX || (dragY > 0 && v > FLICK_VELOCITY)) {
		dismiss();
		return;
	}
	// 未达阈值：弹回原位
	if (cardEl) {
		cardEl.removeAttribute("data-dragging");
		cardEl.style.transform = "";
	}
	syncFuse();
}

function onPointerEnter(e: PointerEvent) {
	if (e.pointerType !== "mouse") return;
	hovering = true;
	syncFuse();
}

function onPointerLeave(e: PointerEvent) {
	if (e.pointerType !== "mouse") return;
	hovering = false;
	syncFuse();
}

onMount(() => {
	reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (reducedMotion || !fuseEl) {
		// 无引信动画时用纯计时器兜底
		fallbackTimer = setTimeout(dismiss, duration);
	} else {
		fuseAnim = fuseEl.animate(
			[
				{ transform: "scaleX(1)", opacity: 0.9 },
				{ transform: "scaleX(0)", opacity: 0.9 },
			],
			{ duration, easing: "linear", fill: "forwards" },
		);
		fuseAnim.onfinish = () => dismiss();
		syncFuse();
	}

	return () => {
		fuseAnim?.cancel();
		clearTimeout(fallbackTimer);
	};
});
</script>

<div
	bind:this={cardEl}
	class="ft-toast-card"
	data-leaving={leaving ? "" : undefined}
	role="status"
	aria-live="polite"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	onpointerenter={onPointerEnter}
	onpointerleave={onPointerLeave}
>
	<span class="ft-toast-message">{message}</span>
	<span bind:this={fuseEl} class="ft-toast-fuse" aria-hidden="true"></span>
</div>

<style>
	.ft-toast-card {
		position: relative;
		display: flex;
		align-items: center;
		overflow: hidden;
		width: max-content;
		max-width: min(22rem, calc(100vw - 2rem));
		padding: 0.6rem 1.15rem;
		border: 1px solid var(--line-color);
		border-radius: var(--radius-full);
		background: var(--btn-regular-bg);
		color: var(--btn-content);
		box-shadow: var(--shadow-md);
		font-size: 0.8125rem;
		line-height: 1.4;
		cursor: grab;
		touch-action: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		animation: ft-toast-in var(--ft-slide, 360ms) cubic-bezier(0.23, 1, 0.32, 1);
		transition:
			transform var(--ft-leave, 300ms) cubic-bezier(0.23, 1, 0.32, 1),
			opacity calc(var(--ft-leave, 300ms) * 0.7) ease;
	}

	.ft-toast-card[data-dragging] {
		animation: none;
		transition: none;
		cursor: grabbing;
	}

	.ft-toast-card[data-leaving] {
		transform: translateY(130%);
		opacity: 0;
		pointer-events: none;
	}

	.ft-toast-message {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ft-toast-fuse {
		position: absolute;
		right: 1rem;
		bottom: 0.25rem;
		left: 1rem;
		height: 2px;
		border-radius: var(--radius-full);
		background: linear-gradient(
			90deg,
			transparent 0%,
			color-mix(in srgb, var(--primary) 40%, transparent) 15%,
			var(--primary) 50%,
			color-mix(in srgb, var(--primary) 40%, transparent) 85%,
			transparent 100%
		);
		transform-origin: left center;
		pointer-events: none;
	}

	@keyframes ft-toast-in {
		from {
			transform: translateY(120%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ft-toast-card {
			animation: ft-toast-fade 160ms ease;
			transition: opacity 150ms ease;
		}

		.ft-toast-card[data-leaving] {
			transform: none;
		}

		.ft-toast-fuse {
			display: none;
		}

		@keyframes ft-toast-fade {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
	}
</style>
