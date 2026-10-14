import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";

/**
 * 全站 toast 通知触发器。
 * ToastHost.svelte（Layout 常驻岛）监听 `firefly:toast` 事件并展示；
 * 任何页面脚本 / Svelte 组件只需 `showToast(message)` 即可。
 * 另由 ToastHost 挂载时调用 `installClipboardToast()`，
 * 对每次成功的 `navigator.clipboard.writeText` 自动弹「已复制」。
 */
export interface FireflyToastOptions {
	/** 自动消失时长（ms），默认 3500 */
	duration?: number;
}

export function showToast(
	message: string,
	options: FireflyToastOptions = {},
): void {
	window.dispatchEvent(
		new CustomEvent("firefly:toast", {
			detail: { message, duration: options.duration },
		}),
	);
}

/** 标记在包装函数上：防 swup / 多入口模块实例导致的二次包装 */
const CLIPBOARD_TOAST_MARK = "__fireflyClipboardToast";

/**
 * 包装 `navigator.clipboard.writeText`：每次成功的剪贴板写入
 * 自动弹一次「已复制」toast。expressive-code 代码块、友链页、
 * RSS/Atom、分享海报等走 clipboard API 的复制均自动覆盖。
 * 幂等（只包装一次）；promise 拒绝时透传且不弹 toast；
 * 只在 ToastHost 已挂载后调用（其监听 `firefly:toast`）。
 */
export function installClipboardToast(): void {
	if (typeof navigator === "undefined" || !navigator.clipboard) return;
	const clipboard = navigator.clipboard;
	const original = clipboard.writeText;
	if (typeof original !== "function" || CLIPBOARD_TOAST_MARK in original)
		return;

	const wrapped = (text: string): Promise<void> =>
		original.call(clipboard, text).then((result) => {
			showToast(i18n(I18nKey.copied));
			return result;
		});
	Object.defineProperty(wrapped, CLIPBOARD_TOAST_MARK, { value: true });
	clipboard.writeText = wrapped;
}
