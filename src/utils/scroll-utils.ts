import { navbarMode } from "@/config";
import {
	BANNER_HEIGHT,
	BANNER_HEIGHT_HOME,
	BANNER_HEIGHT_NON_HOME,
} from "@/constants/constants";
import { afterFirstPaint } from "@/utils/after-first-paint";
import { isBannerMode, isFullscreenMode } from "@/utils/banner-utils";
import { updateSidebarStickySpacing } from "@/utils/grid-layout-utils";
import { updateReadingProgress } from "@/utils/reading-progress";

const backToTopBtn = document.getElementById("back-to-top-btn");
const navbar = document.getElementById("navbar-wrapper");

// 动态导航栏：记录上一次滚动位置，用于判断滚动方向（下滑隐藏 / 上滑显示）
let lastScrollTop = 0;

/** 优化的滚动处理函数（从 Layout.astro 迁出；visit:end 切页后也会调用） */
export function scrollFunction(): void {
	if (document.documentElement.classList.contains("is-page-transitioning")) {
		return;
	}

	// 只用 window.scrollY：documentElement.scrollTop 是几何读取，
	// 样式未结算时会强制全量布局（该函数初始化即被调用，曾是最大强制重排来源）
	const scrollTop = window.scrollY;
	const bannerHeight = window.innerHeight * (BANNER_HEIGHT / 100);
	const navbarElement = document.getElementById("navbar");

	// 阅读进度：紧跟 scrollTop 读取（布局已新鲜），后续 DOM 写入前完成 rect 测量
	updateReadingProgress();

	// 根据滚动位置动态更新侧边栏 sticky 间距
	updateSidebarStickySpacing();

	// 使用批量DOM操作优化性能
	const operations: (() => void)[] = [];

	if (backToTopBtn) {
		operations.push(() => {
			if (scrollTop > bannerHeight) {
				backToTopBtn.classList.remove("hide");
			} else {
				backToTopBtn.classList.add("hide");
			}
		});
	}

	// 滚动方向（收拢动画与动态显隐共用）：每帧同步 lastScrollTop
	const delta = scrollTop - lastScrollTop;
	lastScrollTop = scrollTop;

	// 三段胶囊收拢：向下滚动且超过 80px 时左右段收成圆形，上滑或回顶恢复
	if (navbarElement) {
		operations.push(() => {
			navbarElement.classList.toggle(
				"navbar-collapsed",
				scrollTop > 80 && delta > 0,
			);
		});
	}

	if (navbarMode === "fixed" && navbar) {
		operations.push(() => {
			navbar.classList.remove("navbar-hidden");
		});
	} else if (navbarMode === "dynamic" && navbar) {
		// 动态：下滑隐藏 / 轻微上滑立即显示 / 滚回顶部(<80px)常显
		operations.push(() => {
			const isHome = document.body.classList.contains("is-home");
			// 壁纸/hero 边界：banner 首页 65vh、非首页 45vh；fullscreen 仅首页整屏（100lvh），非首页无 hero 为 0。
			// 越过该边界才启用「下滑隐藏 / 上滑显示」。overHero 不 gate isHome，故非首页 banner 也会跨壁纸保持
			const heroBoundary = isFullscreenMode()
				? isHome
					? window.innerHeight
					: 0
				: isBannerMode()
					? window.innerHeight *
						((isHome ? BANNER_HEIGHT_HOME : BANNER_HEIGHT_NON_HOME) / 100)
					: 0;
			const overHero = scrollTop < heroBoundary;
			if (overHero || delta < 0 || scrollTop <= 80) {
				navbar.classList.remove("navbar-hidden");
			} else if (delta > 0 && scrollTop > 150) {
				navbar.classList.add("navbar-hidden");
			}
			document.body.classList.toggle(
				"dynamic-navbar-hidden",
				navbar.classList.contains("navbar-hidden"),
			);
		});
	} else if (navbar && (isBannerMode() || isFullscreenMode())) {
		// static + banner / fullscreen：跨壁纸保持，滚到内容区才释放
		operations.push(() => {
			const isHome = document.body.classList.contains("is-home");
			// fullscreen 首页内容在 100lvh（视图顶）；banner 按横幅高度阈值
			const threshold = isFullscreenMode()
				? window.innerHeight - 88
				: window.innerHeight *
						((isHome ? BANNER_HEIGHT_HOME : BANNER_HEIGHT_NON_HOME) / 100) -
					88;

			if (scrollTop >= threshold) {
				navbar.classList.add("navbar-hidden");
			} else {
				navbar.classList.remove("navbar-hidden");
			}
		});
	}

	if (navbarElement) {
		operations.push(() => {
			if (scrollTop > 8) {
				navbarElement.classList.add("navbar-sticky-shadow");
			} else {
				navbarElement.classList.remove("navbar-sticky-shadow");
			}
		});
	}

	// 批量执行DOM操作
	if (operations.length > 0) {
		requestAnimationFrame(() => {
			operations.forEach((op) => {
				op();
			});
		});
	}
}

let scrollTimeout: number;

/** 注册滚动 / 窗口尺寸监听并初始化滚动状态（从 Layout.astro 迁出） */
export function initScroll(): void {
	// 使用优化的滚动性能处理
	window.addEventListener(
		"scroll",
		() => {
			if (scrollTimeout) {
				cancelAnimationFrame(scrollTimeout);
			}
			scrollTimeout = requestAnimationFrame(scrollFunction);
		},
		{ passive: true },
	);

	// 初始化滚动状态（例如从历史位置恢复时）：
	// scrollFunction 内部读取 scrollY/rect，加载期执行会强制全量布局，
	// 等到首绘后再跑；此后滚动事件均在样式已结算状态下执行，读取近乎零成本
	afterFirstPaint(scrollFunction);
}
