<script lang="ts">
import { onMount } from "svelte";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";

interface Props {
	/** 文章 id（entry.id），localStorage 计数键 */
	postId: string;
}

let { postId }: Props = $props();

const STORAGE_KEY = "firefly-likes";

let liked = $state(false);
let count = $state(0);
let heartEl: HTMLSpanElement | undefined = $state();

const label = i18n(I18nKey.postLike);

onMount(() => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const data = JSON.parse(raw) as Record<string, number>;
		const n = data[postId];
		if (typeof n === "number" && n > 0) {
			count = n;
			liked = true;
		}
	} catch {
		// 数据损坏时静默重置，不影响点击
	}
});

function persist(next: Record<string, number>) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch {
		// 配额满等异常：内存态照常，仅不持久化
	}
}

function toggle() {
	const wasLiked = liked;
	liked = !liked;
	count = Math.max(0, count + (wasLiked ? -1 : 1));

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const data = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
		if (count > 0) data[postId] = count;
		else delete data[postId];
		persist(data);
	} catch {
		persist({ [postId]: count });
	}

	if (
		heartEl &&
		!window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		// 只动 transform，不读布局
		heartEl.animate(
			[
				{ transform: "scale(1)" },
				{ transform: "scale(1.35)", offset: 0.4 },
				{ transform: "scale(0.92)", offset: 0.7 },
				{ transform: "scale(1)" },
			],
			{ duration: 480, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
		);
	}
}
</script>

<button
	type="button"
	class="ft-heart-btn"
	data-liked={liked}
	aria-pressed={liked}
	aria-label={label}
	title={label}
	onclick={toggle}
>
	<span bind:this={heartEl} class="ft-heart-icon" aria-hidden="true">
		<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			></path>
		</svg>
	</span>
	{#key count}
		<span class="ft-heart-count" aria-hidden="true">{count}</span>
	{/key}
</button>

<style>
	.ft-heart-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--line-color);
		border-radius: var(--radius-full);
		background: var(--btn-regular-bg);
		color: var(--btn-content);
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition:
			background-color var(--duration-normal, 150ms) ease,
			transform var(--duration-fast, 100ms) ease;
	}

	.ft-heart-btn:active {
		transform: scale(0.96);
	}

	.ft-heart-btn:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--primary) 60%, transparent);
		outline-offset: 2px;
	}

	.ft-heart-icon {
		display: block;
		width: 1.125rem;
		height: 1.125rem;
		color: var(--content-meta);
		transition: color var(--duration-normal, 150ms) ease;
	}

	.ft-heart-icon :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		fill: none;
		overflow: visible;
	}

	.ft-heart-btn[data-liked="true"] .ft-heart-icon {
		color: var(--primary);
	}

	.ft-heart-btn[data-liked="true"] .ft-heart-icon :global(svg path) {
		fill: currentColor;
	}

	.ft-heart-count {
		display: block;
		min-width: 0.6em;
		font-variant-numeric: tabular-nums;
		animation: ft-count-roll 300ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	@keyframes ft-count-roll {
		from {
			transform: translateY(0.55em);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* 触摸设备加大热区（≥44px），不依赖 hover */
	@media (pointer: coarse) {
		.ft-heart-btn {
			min-height: 2.75rem;
			padding: 0.6rem 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ft-heart-btn,
		.ft-heart-icon {
			transition: none;
		}

		.ft-heart-count {
			animation: none;
		}
	}
</style>
