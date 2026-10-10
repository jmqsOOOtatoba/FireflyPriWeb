/**
 * uttu-cursor.ts — UTTU 风格自定义光标
 *
 * 结构：橙色实心点（即时跟随）+ 奶油描边圆环（transition 滞后跟随），无 rAF 循环。
 * 开关：localStorage["uttu-cursor"]，"off" 关闭，缺省开启；
 *       显示设置面板可调（派发/监听 "uttu-cursor-change" 事件实时生效）。
 * 仅精确指针（pointer: fine）启用；prefers-reduced-motion 下自动禁用。
 * 原生光标隐藏通过 html.uttu-cursor-on 类（main.css），表单控件保留文本光标。
 */

const STORAGE_KEY = "uttu-cursor";
const INIT_FLAG = "__uttuCursorInit";

interface UttuCursorApi {
	sync(): void;
}

type UttuCursorWindow = Window & {
	[INIT_FLAG]?: boolean;
	__uttuCursor?: UttuCursorApi;
};

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

function ensureElements(): { dot: HTMLElement; ring: HTMLElement } {
	let dot = document.getElementById("uttu-cursor-dot");
	let ring = document.getElementById("uttu-cursor-ring");
	if (!dot || !ring) {
		dot = document.createElement("div");
		dot.id = "uttu-cursor-dot";
		dot.className = "uttu-cursor-dot";
		dot.setAttribute("aria-hidden", "true");
		ring = document.createElement("div");
		ring.id = "uttu-cursor-ring";
		ring.className = "uttu-cursor-ring";
		ring.setAttribute("aria-hidden", "true");
		document.body.appendChild(ring);
		document.body.appendChild(dot);
	}
	return { dot, ring };
}

function init(): void {
	const win = window as UttuCursorWindow;
	if (win[INIT_FLAG]) {
		// Swup 切页/重复执行时只重新同步开关状态
		win.__uttuCursor?.sync();
		return;
	}
	win[INIT_FLAG] = true;

	const { dot, ring } = ensureElements();
	const root = document.documentElement;
	let shown = false;

	const place = (el: HTMLElement, x: number, y: number) => {
		el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
	};

	const onMove = (e: PointerEvent) => {
		place(dot, e.clientX, e.clientY);
		place(ring, e.clientX, e.clientY);
		if (!shown) {
			shown = true;
			dot.style.opacity = "1";
			ring.style.opacity = "1";
		}
	};

	const onDown = () => ring.classList.add("is-active");
	const onUp = () => ring.classList.remove("is-active");

	// 指针离开视窗时隐藏圆环（保留页面内位置）
	const onLeave = () => {
		ring.style.opacity = "0";
	};
	const onEnter = () => {
		if (shown) ring.style.opacity = "1";
	};

	const applyState = () => {
		const on = shouldEnable();
		root.classList.toggle("uttu-cursor-on", on);
		dot.style.display = on ? "" : "none";
		ring.style.display = on ? "" : "none";
		if (!on) {
			shown = false;
			dot.style.opacity = "0";
			ring.style.opacity = "0";
		}
	};

	window.addEventListener("pointermove", onMove, { passive: true });
	window.addEventListener("pointerdown", onDown, { passive: true });
	window.addEventListener("pointerup", onUp, { passive: true });
	document.documentElement.addEventListener("pointerleave", onLeave);
	document.documentElement.addEventListener("pointerenter", onEnter);
	window.addEventListener("uttu-cursor-change", applyState);
	// 指针能力可能在会话中变化（如连上鼠标），监听媒体查询
	window.matchMedia("(pointer: fine)").addEventListener("change", applyState);
	window
		.matchMedia("(prefers-reduced-motion: reduce)")
		.addEventListener("change", applyState);

	applyState();

	win.__uttuCursor = {
		sync: applyState,
	};
}

/** 由 layout-init.initLayout() 调用（内部自带幂等守卫） */
export function initUttuCursor(): void {
	init();
}
