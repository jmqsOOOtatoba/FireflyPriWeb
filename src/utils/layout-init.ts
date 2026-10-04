import {
	registerContentOverflowListeners,
	scheduleContentOverflowEnhancements,
} from "@/utils/content-overflow-utils";
import {
	initializeFloatingPanels,
	setClickOutsideToClose,
} from "@/utils/floating-panel-utils";
import {
	initFullscreenWallpaper,
	syncFullscreenStateAfterInit,
} from "@/utils/fullscreen-wallpaper-utils";
import {
	refreshSidebarStickyState,
	updateMainGridCols,
	updateSidebarComponentsVisibility,
} from "@/utils/grid-layout-utils";
import { afterFirstPaint } from "@/utils/after-first-paint";
import { initIconLoader } from "@/utils/icon-loader";
import { initImageLoadFadeIn } from "@/utils/lqip-utils";
import { initReadingProgress } from "@/utils/reading-progress";
import { initScroll } from "@/utils/scroll-utils";
import { initThemeListener, initWallpaperMode } from "@/utils/setting-utils";
import { setupSwupTransitions } from "@/utils/swup-transitions";
import { initTouchCodeCopyReveal } from "@/utils/touch-copy-utils";

/** 布局初始化编排（从 Layout.astro 迁出） */
export function initLayout(): void {
	// 防止 Swup 切页重跑模块化脚本时重复注册监听器/钩子（一次性注册；
	// 切页后的页面状态刷新由下方 swup 钩子与一次性注册的 document 监听器负责）
	if (window.__fireflyLayoutInit) return;
	window.__fireflyLayoutInit = true;

	initializeFloatingPanels();

	setClickOutsideToClose("display-setting", [
		"display-setting",
		"display-settings-switch",
	]);
	// nav-menu-panel 现为全屏抽屉（inset-0），点击外部永不触发且由遮罩点击关闭，
	// 不再注册 click-outside（见 NavMenuPanel.astro 的 document 委托）。
	setClickOutsideToClose("search-panel", [
		"search-panel",
		"search-bar",
		"search-switch",
	]);
	setClickOutsideToClose("wallpaper-mode-panel", [
		"wallpaper-mode-panel",
		"wallpaper-mode-switch",
	]);
	setClickOutsideToClose("theme-mode-panel", [
		"theme-mode-panel",
		"scheme-switch",
	]);

	setupSwupTransitions();
	initFullscreenWallpaper();
	registerContentOverflowListeners();
	// 滚动路径不再读取布局；侧边栏 top 容器可见性缓存的首次填充含几何读取，
	// 加载期执行会强制全量布局——推迟到首绘后（FCP 前不可能发生有意义的滚动）
	afterFirstPaint(refreshSidebarStickyState);
	initScroll();
	initReadingProgress();
	initTouchCodeCopyReveal();

	// 页面加载完成后初始化banner和内容溢出容器
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			scheduleContentOverflowEnhancements();
		});
	} else {
		scheduleContentOverflowEnhancements();
	}

	// Initialize wallpaper mode
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			// 网格列数/侧栏可见性含几何与计算样式读取，加载期会强制全量布局；
			// 推迟到首绘后（FCP 后读取近乎零成本，交互前必然完成）
			afterFirstPaint(() => {
				updateMainGridCols();
				updateSidebarComponentsVisibility();
			});
			initWallpaperMode();
			initThemeListener();
			initIconLoader();
			syncFullscreenStateAfterInit();
		});
	} else {
		afterFirstPaint(() => {
			updateMainGridCols();
			updateSidebarComponentsVisibility();
		});
		initWallpaperMode();
		initThemeListener();
		initIconLoader();
		syncFullscreenStateAfterInit();
	}

	initImageLoadFadeIn();
	// 切页换入后延到下一帧再重扫 LQIP fade-in，避免 astro:page-load 在同帧叠加
	// 一堆游标/事件重扫阻塞换入首帧（swup:contentReplaced 已 rAF，一并延后）
	document.addEventListener("astro:page-load", () => {
		requestAnimationFrame(initImageLoadFadeIn);
	});
	document.addEventListener("swup:contentReplaced", () => {
		requestAnimationFrame(initImageLoadFadeIn);
	});
}
