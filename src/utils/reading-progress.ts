/**
 * 阅读进度（顶部细条 + 悬浮百分比/预计剩余时间）。
 *
 * 进度语义：正文进入视口底边为 0%，正文底边到达视口底边为 100%，
 * 即 p = clamp((viewportHeight - rect.top) / rect.height, 0, 1)——
 * 横幅、评论区、推荐文章不计入。
 *
 * 每帧成本：一次 getBoundingClientRect + 算术。scrollFunction 先读 scrollTop
 *（布局脏时已在此强制计算），随后本函数的 rect 读取命中同一次新鲜布局，不触发额外回流。
 * 百分比文字仅在整数变化时写入，且 badge 带 contain:content，文字变更的布局失效
 * 被限制在 badge 子树内，不污染正文布局。
 * 正文元素被 Swup 替换后靠 isConnected 自愈重新查询，非文章页每帧仅一次
 * getElementById 哈希查找（与 scrollFunction 中已有的 navbar 查询同量级）。
 */

let initialized = false;
let enabled = false;

let bar: HTMLElement | null = null;
let badge: HTMLElement | null = null;
let pctEl: HTMLElement | null = null;
let remainEl: HTMLElement | null = null;

let article: HTMLElement | null = null;
let observer: ResizeObserver | null = null;
let totalMinutes = 0;
let remainTemplate = "";
let active = false;
let lastP = -1;
let lastPct = -1;
let lastRemain = -1;

/** Swup 换页/解密后旧引用断开 → 重查并重绑 ResizeObserver；非文章页 null===null 直接短路 */
function resolveArticle(): void {
	if (article?.isConnected) return;
	const next = document.getElementById("post-container");
	if (next === article) return;
	article = next;
	totalMinutes = Number(article?.dataset.readingMinutes) || 0;
	lastPct = -1;
	lastRemain = -1;
	if (observer) {
		observer.disconnect();
		if (article) observer.observe(article);
	}
}

function setActive(next: boolean): void {
	if (active === next) return;
	active = next;
	lastPct = -1;
	lastRemain = -1;
	bar?.classList.toggle("visible", next);
	badge?.classList.toggle("show", next);
}

export function initReadingProgress(): void {
	if (initialized) return;
	initialized = true;

	// 配置关闭时 DOM 不渲染；查询不到即永久空转
	bar = document.getElementById("reading-progress-bar");
	badge = document.getElementById("reading-progress-badge");
	pctEl = document.getElementById("reading-progress-pct");
	remainEl = document.getElementById("reading-progress-remain");
	if (!bar || !badge || !pctEl || !remainEl) return;

	enabled = true;
	remainTemplate = remainEl.dataset.template || "";

	if (typeof ResizeObserver !== "undefined") {
		// 正文高度变化（图片加载、代码块展开、解密）后无滚动也能重算
		observer = new ResizeObserver(() => updateReadingProgress());
	}

	// 移动端地址栏收起只改视口高度、不改正文尺寸 → 单独听 resize
	window.addEventListener("resize", updateReadingProgress, { passive: true });
	// 沉浸阅读切换改变正文位置且可能落在同一滚动位置（无 scroll 事件）→ 立即 + 过渡结束后各算一次
	document.addEventListener("immersiveReadingChange", () => {
		updateReadingProgress();
		window.setTimeout(updateReadingProgress, 400);
	});

	updateReadingProgress();
}

/** 由 scrollFunction 每帧调用；页面过渡期间 scrollFunction 提前返回，不会执行到这里 */
export function updateReadingProgress(): void {
	// enabled 为 true 时下列元素必然存在，显式判空仅为满足 TS 收窄
	if (!enabled || !bar || !badge || !pctEl || !remainEl) return;

	resolveArticle();
	if (!article) {
		setActive(false);
		return;
	}

	const rect = article.getBoundingClientRect();
	if (rect.height <= 0) return;

	const p = Math.min(
		1,
		Math.max(0, (window.innerHeight - rect.top) / rect.height),
	);
	setActive(true);

	// transform 只走合成层，逐帧写入开销可忽略；文字仅整数变化时写
	if (p !== lastP) {
		lastP = p;
		bar.style.transform = `scaleX(${p})`;
	}

	const pct = Math.round(p * 100);
	if (pct !== lastPct) {
		lastPct = pct;
		pctEl.textContent = `${pct}%`;
	}

	const remain = Math.ceil(totalMinutes * (1 - p));
	if (remain !== lastRemain) {
		lastRemain = remain;
		remainEl.textContent =
			remain > 0 && remainTemplate
				? ` · ${remainTemplate.replace("{n}", String(remain))}`
				: "";
	}
}
