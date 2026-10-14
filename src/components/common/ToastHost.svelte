<script lang="ts">
import { onMount } from "svelte";
import ToastCard from "@/components/common/ToastCard.svelte";
import { installClipboardToast } from "@/utils/toast";

interface ToastItem {
	id: number;
	message: string;
	duration: number;
}

/** 最多同时展示 3 条，超出丢弃最旧的 */
const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 3500;

let toasts = $state<ToastItem[]>([]);
let nextId = 0;

function enqueue(message: string, duration?: number) {
	const item: ToastItem = {
		id: nextId++,
		message,
		duration:
			typeof duration === "number" && duration > 0
				? duration
				: DEFAULT_DURATION,
	};
	toasts = [...toasts, item].slice(-MAX_VISIBLE);
}

function remove(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
}

onMount(() => {
	const onToast = (e: Event) => {
		const detail = (e as CustomEvent<{ message?: unknown; duration?: unknown }>)
			.detail;
		if (!detail || typeof detail.message !== "string" || !detail.message)
			return;
		enqueue(
			detail.message,
			typeof detail.duration === "number" ? detail.duration : undefined,
		);
	};

	window.addEventListener("firefly:toast", onToast);
	// 监听器就位后再装 clipboard 包装，包装回调 dispatch 时必有接收方
	installClipboardToast();
	// Swup 切页只替换容器内容，本岛挂 Layout 且容器在 Swup 容器外，
	// 监听器随组件存活整个会话，无需在 astro:page-load 重新注册。
	return () => {
		window.removeEventListener("firefly:toast", onToast);
	};
});
</script>

{#if toasts.length > 0}
	<div class="ft-toast-host" role="region" aria-label="Notifications">
		{#each toasts as toast (toast.id)}
			<ToastCard
				message={toast.message}
				duration={toast.duration}
				onDismiss={() => remove(toast.id)}
			/>
		{/each}
	</div>
{/if}

<style>
	.ft-toast-host {
		position: fixed;
		right: calc(1.5rem + env(safe-area-inset-right, 0px));
		bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		pointer-events: none;
	}

	@media (max-width: 600px) {
		.ft-toast-host {
			right: 1rem;
			bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		}
	}
</style>
