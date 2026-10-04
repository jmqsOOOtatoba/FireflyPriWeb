/**
 * 等待首次内容绘制（FCP）后，串行执行排队的回调（每帧一个）。
 *
 * 加载期脚本一旦读取 scrollY / 几何 / getComputedStyle / document.fonts.ready /
 * window.innerWidth，浏览器会被迫在脚本上下文里同步完成全量样式与布局结算
 * （强制重排），移动端 + CPU 降速下实测单次可达数百毫秒。首绘之后样式与
 * 布局已完成自然结算，同样的读取近乎零成本。
 *
 * 两个关键点：
 * 1. 不用双 rAF / requestIdleCallback：弱性能设备上首帧可能被丢弃，
 *    rAF 链会在真实绘制之前跑完；轮询 paint 条目才能保证等到真正首绘。
 * 2. 每帧只执行一个回调：若所有回调挤在同一帧，前一个的写入会让后一个的
 *    读取再次强制结算（互相弄脏）。串行化后每个回调都在上一帧绘制完成、
 *    样式干净的状态下执行，读取近乎零成本。
 * 超时兜底（约 2 秒 / 120 帧）防止 paint 条目异常时回调永不执行。
 */
const pending: Array<() => void> = [];
let scheduled = false;

function runNext(): void {
	const cb = pending.shift();
	if (cb) cb();
	if (pending.length > 0) {
		requestAnimationFrame(runNext);
	} else {
		scheduled = false;
	}
}

function schedule(): void {
	if (scheduled) return;
	scheduled = true;
	requestAnimationFrame(runNext);
}

export function afterFirstPaint(cb: () => void): void {
	pending.push(cb);
	if (pending.length > 1) {
		// 已有轮询/调度在进行，排队即可
		return;
	}

	let frames = 0;
	const check = () => {
		const paints = performance.getEntriesByType("paint");
		if (paints.some((p) => p.name === "first-contentful-paint")) {
			schedule();
			return;
		}
		if (++frames >= 120) {
			schedule();
			return;
		}
		requestAnimationFrame(check);
	};
	check();
}
