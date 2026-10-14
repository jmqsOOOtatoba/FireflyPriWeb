/**
 * custom-cursor.ts — 液态团（gooey blob）自定义光标
 *
 * 由 svelte-bits BlobCursor.svelte（MIT + Commons Clause）改造为零依赖 TS 实现：
 * - 去 GSAP：滞后跟随改 CSS transition，零 rAF、零每帧 JS；
 * - 去每次移动的 getBoundingClientRect：容器 position:fixed（原点即视口），
 *   事件里的 clientX/Y 直接可用，全程不读布局；
 * - 去 touchmove 监听：pointer: fine 门禁，触摸设备完全不生成元素。
 * 结构：三层液滴（lead 即时 + mid/tail 滞后）经 SVG gooey 滤镜融合成软萌液体团，
 * 颜色 var(--primary)，暗色模式随主题变量自动切换。
 * 开关：localStorage["uttu-cursor"]（沿用旧键保住用户已存偏好），
 *       显示设置面板可调（监听 "uttu-cursor-change" 事件实时生效）。
 * 降级：pointer: coarse / prefers-reduced-motion 禁用回系统光标；
 *       input/textarea/select/contenteditable 上隐藏液滴、恢复系统光标。
 * 生命周期：astro:page-load 幂等重挂（Swup 换页后重算状态），
 *           astro:before-swap 清除目标态（悬停/输入/按压态对应的 DOM 即将被替换）。
 */

const STORAGE_KEY = "uttu-cursor";
const INIT_FLAG = "__ffCustomCursorInit";
const HOST_ID = "ff-cursor";

const EDITABLE_SEL =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const INTERACTIVE_SEL = [
	"a[href]",
	"button",
	"summary",
	"label",
	"[onclick]",
	'[role="button"]',
	'[role="link"]',
	'[role="tab"]',
	'[role="menuitem"]',
	'[role="option"]',
	'[role="checkbox"]',
	'[role="switch"]',
	'[role="radio"]',
	'[role="slider"]',
].join(",");

// gooey 滤镜：feGaussianBlur(σ=5) + alpha 阈值矩阵（a>0.339 存活、a≥0.375 实心），
// 与三层液滴尺寸/透明度配算过，保证各层模糊后仍能过阈值融团。
const HOST_HTML = `
	<svg class="ff-cursor-defs" aria-hidden="true" focusable="false">
		<filter id="ff-cursor-goo">
			<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="ff-cursor-blur" />
			<feColorMatrix in="ff-cursor-blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -7" />
		</filter>
	</svg>
	<div class="ff-cursor-blob ff-cursor-blob--lead"><i class="ff-cursor-blob-body"></i></div>
	<div class="ff-cursor-blob ff-cursor-blob--mid"><i class="ff-cursor-blob-body"></i></div>
	<div class="ff-cursor-blob ff-cursor-blob--tail"><i class="ff-cursor-blob-body"></i></div>
`;

interface CustomCursorApi {
	sync(): void;
}

type CustomCursorWindow = Window & {
	[INIT_FLAG]?: boolean;
	__ffCursor?: CustomCursorApi;
};

let host: HTMLElement | null = null;
let blobs: HTMLElement[] = [];
let enabled = false;
let armed = false;
let inView = true;
let lastTarget: EventTarget | null = null;

function pointerFine(): boolean {
	return window.matchMedia("(pointer: fine)").matches;
}

function reducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function storedEnabled(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) !== "off";
	} catch {
		return true;
	}
}

function shouldEnable(): boolean {
	return pointerFine() && !reducedMotion() && storedEnabled();
}

function ensureHost(): HTMLElement {
	if (host?.isConnected) return host;
	const existing = document.getElementById(HOST_ID);
	if (existing) {
		host = existing;
	} else {
		host = document.createElement("div");
		host.id = HOST_ID;
		host.className = "ff-cursor";
		host.setAttribute("aria-hidden", "true");
		host.innerHTML = HOST_HTML;
		document.body.appendChild(host);
	}
	blobs = Array.from(host.querySelectorAll<HTMLElement>(".ff-cursor-blob"));
	return host;
}

function place(el: HTMLElement, x: number, y: number): void {
	el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
}

function updateVisibility(): void {
	host?.classList.toggle("is-shown", enabled && armed && inView);
}

function resetTargetState(): void {
	lastTarget = null;
	host?.classList.remove("is-hover", "is-editing");
}

function applyTargetState(target: EventTarget | null): void {
	if (!host) return;
	const el = target instanceof Element ? target : null;
	const editable = el?.closest(EDITABLE_SEL) ?? null;
	const interactive = editable ? null : (el?.closest(INTERACTIVE_SEL) ?? null);
	host.classList.toggle("is-editing", editable !== null);
	host.classList.toggle("is-hover", interactive !== null);
}

function sync(): void {
	const wasEnabled = enabled;
	enabled = shouldEnable();
	document.documentElement.classList.toggle("ff-cursor-on", enabled);
	if (!enabled) {
		armed = false;
		if (host) host.style.display = "none";
		resetTargetState();
	} else {
		ensureHost().style.display = "";
		if (!wasEnabled) {
			// 刚重新启用：等下一次移动再显现，避免闪在旧坐标
			armed = false;
			resetTargetState();
		}
	}
	updateVisibility();
}

function init(): void {
	const win = window as CustomCursorWindow;
	if (win[INIT_FLAG]) {
		// Swup 切页/脚本重跑：只做幂等同步（重挂元素 + 重算开关状态）
		win.__ffCursor?.sync();
		return;
	}
	win[INIT_FLAG] = true;

	const onMove = (e: PointerEvent) => {
		if (!enabled || e.pointerType === "touch") return;
		for (const blob of blobs) place(blob, e.clientX, e.clientY);
		if (e.target !== lastTarget) {
			lastTarget = e.target;
			applyTargetState(e.target);
		}
		if (!armed) {
			armed = true;
			updateVisibility();
		}
	};

	const onDown = () => {
		if (enabled) host?.classList.add("is-press");
	};
	const onUp = () => host?.classList.remove("is-press");

	const onLeave = () => {
		inView = false;
		updateVisibility();
	};
	const onEnter = () => {
		inView = true;
		updateVisibility();
	};

	const onPageLoad = () => {
		// Swup 换入后目标 DOM 全新，清掉上一页残留的目标态再重算开关
		resetTargetState();
		sync();
	};
	const onBeforeSwap = () => {
		// 换出前清理：悬停/输入/按压态都指向即将被替换的 DOM
		resetTargetState();
		host?.classList.remove("is-press");
	};

	window.addEventListener("pointermove", onMove, { passive: true });
	window.addEventListener("pointerdown", onDown, { passive: true });
	window.addEventListener("pointerup", onUp, { passive: true });
	document.documentElement.addEventListener("pointerleave", onLeave);
	document.documentElement.addEventListener("pointerenter", onEnter);
	window.addEventListener("uttu-cursor-change", sync);
	window.matchMedia("(pointer: fine)").addEventListener("change", sync);
	window
		.matchMedia("(prefers-reduced-motion: reduce)")
		.addEventListener("change", sync);
	document.addEventListener("astro:page-load", onPageLoad);
	document.addEventListener("astro:before-swap", onBeforeSwap);

	sync();

	win.__ffCursor = { sync };
}

/** 由 layout-init.initLayout() 调用（内部自带幂等守卫） */
export function initCustomCursor(): void {
	init();
}
