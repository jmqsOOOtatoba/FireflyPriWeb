<script lang="ts">
import { untrack } from "svelte";

type Props = {
	text: string;
	/** 每帧乱码刷新间隔（ms） */
	speed?: number;
	class?: string;
};

let { text, speed = 55, class: className = "" }: Props = $props();

// svelte-ignore state_referenced_locally
const chars = Array.from(text);
// 乱码池：优先复用标题自身的字符（中文标题解密观感更自然），字符太少时补数字/大写字母
const pool: string[] = (() => {
	const unique = Array.from(new Set(chars.filter((c) => c !== " ")));
	if (unique.length >= 2) return unique;
	return unique.concat(Array.from("0123456789ABCDEF"));
})();

// 暖机帧先整体乱码，之后每帧从左往右锁定若干字
const WARMUP_TICKS = 4;
const LOCK_PER_TICK = Math.max(1, Math.ceil(chars.length / 12));

// SSR/首帧为定稿文本且全部锁定（无 JS 可读、reduced-motion 直接定稿）；
// 水合后的首个 effect 会在绘制前清零锁定数并切入乱码
let displayChars = $state([...chars]);
let revealed = $state(chars.length);
let tickCount = 0;

const randomChar = () => pool[Math.floor(Math.random() * pool.length)];

function scramble() {
	const next = [...displayChars];
	for (let i = 0; i < chars.length; i++) {
		next[i] = i < revealed ? chars[i] : randomChar();
	}
	displayChars = next;
}

$effect(() => {
	// 仅客户端执行；reduced-motion 保持定稿显示，不启动乱码
	if (typeof window === "undefined") return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	// 同步初始化必须 untrack：否则 displayChars/revealed 被本 effect 读了又写 → 自触发死循环
	untrack(() => {
		revealed = 0;
		scramble();
	});
	const id = window.setInterval(() => {
		tickCount += 1;
		if (tickCount > WARMUP_TICKS) {
			revealed = Math.min(chars.length, revealed + LOCK_PER_TICK);
		}
		if (revealed >= chars.length) {
			window.clearInterval(id);
			displayChars = [...chars];
			return;
		}
		scramble();
	}, speed);
	return () => window.clearInterval(id);
});
</script>

<span class="decrypted-text {className}">
	<!-- 无障碍：视觉层是乱码动画（aria-hidden），语义层保留定稿文本 -->
	<span class="decrypted-text-sr">{text}</span>
	<span aria-hidden="true">
		{#each displayChars as ch, i (i)}
			<span class={i < revealed ? "decrypted-text-char" : "decrypted-text-char decrypted-text-scramble"}>{ch}</span>
		{/each}
	</span>
</span>

<style>
	.decrypted-text {
		display: inline;
	}

	.decrypted-text-sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* 逐字锁定需要字级不被折行拆散 */
	.decrypted-text-char {
		display: inline-block;
	}

	/* 未锁定字符：主题色微透，做出「解密中」的跳动感 */
	.decrypted-text-scramble {
		color: var(--primary);
		opacity: 0.7;
	}
</style>
