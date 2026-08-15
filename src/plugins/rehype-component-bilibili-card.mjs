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

	return h(
		`a#${cardUuid}-card`,
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
            style: avatar ? `background-image: url(${avatar}); background-color: transparent;` : ""
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