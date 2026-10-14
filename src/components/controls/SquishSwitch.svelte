<script lang="ts">
type Props = {
	/** 开关状态（纯视觉层：状态与持久化由使用方持有） */
	checked?: boolean;
};

let { checked = false }: Props = $props();

// 几何与原实现一致：轨道 40×20、滑块 16、左 2px → 左 20px（行程 18px）
const TRAVEL_PX = 18;
// 首帧位置直接取初始 checked（SSR 与水合一致，加载路径不播动画）
// svelte-ignore state_referenced_locally
const initialChecked = checked;

// 弹簧参数：欠阻尼 → 过冲回弹的果冻感（无外部依赖，rAF 自积分）
const STIFFNESS = 320;
const DAMPING = 16;
const MAX_STRETCH = 0.35;
const STRETCH_FACTOR = 0.025;

let thumbEl: HTMLSpanElement | undefined = $state();
let reduceMotion = $state(false);
let pos = initialChecked ? 1 : 0;
let vel = 0;
let target = pos;
let rafId = 0;
let lastTime = 0;

function renderThumb() {
	if (!thumbEl) return;
	// 速度越快横向拉伸越明显、纵向压扁，还原挤压-回弹的质感
	const stretch = Math.min(MAX_STRETCH, Math.abs(vel) * STRETCH_FACTOR);
	const sx = 1 + stretch;
	const sy = 1 - stretch * 0.5;
	thumbEl.style.transform = `translateX(${(pos * TRAVEL_PX).toFixed(2)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
}

function step(now: number) {
	const dt = Math.min((now - lastTime) / 1000, 0.032);
	lastTime = now;
	const accel = STIFFNESS * (target - pos) - DAMPING * vel;
	vel += accel * dt;
	pos += vel * dt;
	renderThumb();
	if (Math.abs(target - pos) < 0.001 && Math.abs(vel) < 0.05) {
		pos = target;
		vel = 0;
		renderThumb();
		rafId = 0;
		return;
	}
	rafId = requestAnimationFrame(step);
}

$effect(() => {
	target = checked ? 1 : 0;
	if (!thumbEl) return;
	if (rafId) {
		cancelAnimationFrame(rafId);
		rafId = 0;
	}
	if (reduceMotion) {
		pos = target;
		vel = 0;
		renderThumb();
		return;
	}
	// 已在目标位且静止（首帧/水合）：只落 transform，不起 rAF
	if (Math.abs(target - pos) < 0.001 && Math.abs(vel) < 0.001) {
		renderThumb();
		return;
	}
	lastTime = performance.now();
	rafId = requestAnimationFrame(step);
	return () => {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	};
});

$effect(() => {
	if (typeof window === "undefined") return;
	const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
	reduceMotion = mq.matches;
	const onChange = () => {
		reduceMotion = mq.matches;
	};
	mq.addEventListener("change", onChange);
	return () => mq.removeEventListener("change", onChange);
});
</script>

<span class="squish-switch" data-on={checked ? "" : undefined}>
	<span
		class="squish-switch-thumb"
		bind:this={thumbEl}
		style={`transform: translateX(${initialChecked ? TRAVEL_PX : 0}px)`}
	></span>
</span>

<style>
	.squish-switch {
		position: relative;
		display: block;
		flex-shrink: 0;
		width: 2.5rem;
		height: 1.25rem;
		border-radius: 9999px;
		background: var(--btn-regular-bg-active);
		transition: background-color 0.25s ease;
	}

	.squish-switch[data-on] {
		background: var(--primary);
	}

	.squish-switch-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 1rem;
		height: 1rem;
		border-radius: 9999px;
		/* 果冻高光：顶部亮面 + 底部微暗（中性灰，白滑块在亮/暗主题下都保持层次） */
		background: linear-gradient(160deg, #ffffff 55%, #f2f2f2);
		box-shadow:
			0 1px 3px rgb(0 0 0 / 0.28),
			inset 0 1px 1px rgb(255 255 255 / 0.9);
		will-change: transform;
	}

	@media (prefers-reduced-motion: reduce) {
		.squish-switch-thumb {
			will-change: auto;
		}
	}
</style>
