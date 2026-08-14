/// <reference types="mdast" />
import { h } from "hastscript";

export function BilibiliCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive.',
		]);

	if (!properties.uid)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid UID.',
		);

	const uid = properties.uid;
	const name = properties.name || "未知用户";
	const avatar = properties.avatar || "";
	const sign = properties.sign || "这个人很懒，什么都没写";
	const fans = properties.fans || "0";
	const following = properties.following || "0";
	const likes = properties.likes || "0";
	
	const cardUuid = `BC${Math.random().toString(36).slice(-6)}`;

	const nAvatar = h(`div#${cardUuid}-avatar`, { class: "bc-avatar" });
	
	const nTitle = h("div", { class: "bc-titlebar" }, [
		h("div", { class: "bc-titlebar-left" }, [
			nAvatar,
			h("div", { class: "bc-info" }, [
				h("div", { class: "bc-username" }, name),
				h("div", { class: "bc-sign" }, sign),
			]),
		]),
		h("div", { class: "bilibili-logo" }),
	]);

	const nFans = h(`div#${cardUuid}-fans`, { class: "bc-stat" }, [
		h("span", { class: "bc-stat-value" }, fans),
		h("span", { class: "bc-stat-label" }, "粉丝"),
	]);
	
	const nFollowing = h(`div#${cardUuid}-following`, { class: "bc-stat" }, [
		h("span", { class: "bc-stat-value" }, following),
		h("span", { class: "bc-stat-label" }, "关注"),
	]);
	
	const nLikes = h(`div#${cardUuid}-likes`, { class: "bc-stat" }, [
		h("span", { class: "bc-stat-value" }, likes),
		h("span", { class: "bc-stat-label" }, "获赞"),
	]);

	return h(
		`a#${cardUuid}-card`,
		{
			class: "card-bilibili no-styling",
			href: `https://space.bilibili.com/${uid}`,
			target: "_blank",
		},
		[
			nTitle,
			h("div", { class: "bc-stats" }, [nFans, nFollowing, nLikes]),
		],
	);
}