/// <reference types="mdast" />
import { h } from "hastscript";
import bilibiliCardData from "../constants/bilibili-card-data.json" with {
	type: "json",
};

/**
 * Creates a Bilibili user card component.
 *
 * 数据由 scripts/generate-bilibili-card-data.ts 在构建期从 uapis 接口抓取
 * 并写入 src/constants/bilibili-card-data.json，本插件构建期直接渲染完整 DOM。
 * MD 中只需写 ::bilibili{uid="353880725"}，name/avatar 等属性仅作手动兜底。
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.uid - The Bilibili user UID.
 * @param {string} [properties.name] - Optional username override.
 * @param {string} [properties.avatar] - Optional avatar image URL override.
 * @param {string} [properties.sign] - Optional bio/signature override.
 * @param {string} [properties.fans] - Optional fan count display override.
 * @param {string} [properties.following] - Optional following count display override.
 * @param {string} [properties.archive] - Optional archive count display override.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created Bilibili card component.
 */
export function BilibiliCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("bilibili" directive must be leaf type "::bilibili{uid=\\"353880725\\"}")',
		]);

	if (!properties.uid)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid UID. ("uid" attribute is required)',
		);

	const uid = String(properties.uid).trim();
	const data = bilibiliCardData[uid] ?? null;

	const name = properties.name || data?.name || "未知用户";
	const avatar =
		properties.avatar ||
		(data?.face ? data.face.replace(/^http:\/\//, "https://") : "");
	const sign = properties.sign || data?.sign || "这个人很懒，什么都没写";
	const fans = properties.fans || formatCount(data?.follower);
	const following = properties.following || formatCount(data?.following);
	const archive =
		properties.archive || properties.likes || formatCount(data?.archiveCount);

	return h(
		"a",
		{
			class: "card-bilibili no-styling",
			href: `https://space.bilibili.com/${uid}`,
			target: "_blank",
		},
		[
			h("div", { class: "bc-header" }, [
				h("div", { class: "bc-titlebar-left" }, [
					// B 站头像 CDN 防盗链（Referer 403），必须用 <img> + no-referrer，
					// background-image 无法设置 referrerpolicy
					h("div", { class: "bc-avatar" }, [
						avatar
							? h("img", {
									src: avatar,
									alt: name,
									loading: "lazy",
									referrerpolicy: "no-referrer",
								})
							: null,
					]),
					h("div", { class: "bc-info" }, [
						h("div", { class: "bc-username" }, name),
						h("div", { class: "bc-sign" }, sign),
					]),
				]),
			]),
			h("div", { class: "bc-stats" }, [
				h("div", { class: "bc-stat" }, [
					h("span", { class: "bc-stat-value" }, fans),
					h("span", { class: "bc-stat-label" }, "粉丝"),
				]),
				h("div", { class: "bc-stat" }, [
					h("span", { class: "bc-stat-value" }, following),
					h("span", { class: "bc-stat-label" }, "关注"),
				]),
				h("div", { class: "bc-stat" }, [
					h("span", { class: "bc-stat-value" }, archive),
					h("span", { class: "bc-stat-label" }, "视频"),
				]),
			]),
		],
	);
}

/** 紧凑计数（如 1万 / 87.9万），对齐 B 站展示习惯 */
function formatCount(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	if (value >= 10000) {
		return `${(value / 10000).toFixed(1).replace(/\.0$/, "")}万`;
	}
	return String(value);
}
