/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Bilibili user card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.uid - The Bilibili user UID.
 * @param {string} [properties.name] - Optional username (default: "未知用户").
 * @param {string} [properties.avatar] - Optional avatar image URL.
 * @param {string} [properties.sign] - Optional bio/signature.
 * @param {string} [properties.fans] - Optional fan count display text.
 * @param {string} [properties.following] - Optional following count display text.
 * @param {string} [properties.likes] - Optional likes count display text.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created Bilibili card component.
 */
export function BilibiliCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("bilibili" directive must be leaf type "::bilibili{uid="353880725"}")',
		]);

	if (!properties.uid)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid UID. ("uid" attribute is required)',
		);

	const uid = properties.uid;
	const name = properties.name || "未知用户";
	const avatar = properties.avatar || "";
	const sign = properties.sign || "这个人很懒，什么都没写";
	const fans = properties.fans || "0";
	const following = properties.following || "0";
	const likes = properties.likes || "0";

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
					h("div", {
						class: "bc-avatar",
						style: avatar
							? `background-image: url(${avatar}); background-color: transparent;`
							: "",
					}),
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
					h("span", { class: "bc-stat-value" }, likes),
					h("span", { class: "bc-stat-label" }, "获赞"),
				]),
			]),
		],
	);
}
