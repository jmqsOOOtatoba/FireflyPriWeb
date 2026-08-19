/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Music Player component for embedding in articles.
 */
export function MusicPlayerComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("music" directive must be leaf type "::music{url="..."}" or "::music{server="netease" id="..."}")',
		]);

	const url = properties.url || "";
	const server = properties.server || "";
	const id = properties.id || "";
	const type = properties.type || "song";
	const title = properties.title || "未知歌曲";
	const artist = properties.artist || "未知艺术家";
	const cover = properties.cover || "";
	const autoplay = properties.autoplay !== "false" && properties.autoplay !== false;
	const loop = properties.loop === "true" || properties.loop === true;
	const volume = parseFloat(properties.volume) || 0.7;

	const useMeting = !!(server && server.trim() !== "" && id && id.trim() !== "");

	if (!url && !useMeting)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid parameters. Please provide either "url" or both "server" and "id" attributes.',
		);

	const playerId = `music-player-${Math.random().toString(36).slice(-6)}`;

	return h("div", { 
		class: "music-player-container",
		id: playerId,
		"data-url": url,
		"data-server": server,
		"data-id": id,
		"data-type": type,
		"data-use-meting": useMeting ? "true" : "false",
		"data-title": title,
		"data-artist": artist,
		"data-cover": cover,
		"data-autoplay": autoplay.toString(),
		"data-loop": loop.toString(),
		"data-volume": volume.toString(),
	}, [
		h("div", { class: "music-player-header" }, [
			// 封面 - 使用 background-image 方式，仿照B站头像样式
			h("div", { 
				class: "music-player-cover",
				style: cover ? `background-image: url(${cover}); background-color: transparent;` : ""
			}),
			h("div", { class: "music-player-info" }, [
				h("div", { class: "music-player-title" }, title),
				h("div", { class: "music-player-artist" }, artist),
				useMeting ? h("div", { class: "music-player-source" }, [
					h("span", { class: "music-source-tag" }, `${getPlatformName(server)} · ${getTypeName(type)}`)
				]) : null,
			]),
		]),
		h("div", { class: "music-player-controls" }, [
			h("button", { 
				class: "music-play-btn",
				"aria-label": "播放/暂停",
			}, [
				h("span", { class: "play-icon" }, [h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "1em", height: "1em", viewBox: "0 0 24 24", class: "icon-play", "aria-hidden": "true" }, [h("path", { fill: "currentColor", d: "M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712" })])]),
				h("span", { class: "pause-icon hidden" }, [h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "1em", height: "1em", viewBox: "0 0 24 24", class: "icon-pause", "aria-hidden": "true" }, [h("path", { fill: "currentColor", d: "M16 19q-.825 0-1.412-.587T14 17V7q0-.825.588-1.412T16 5t1.413.588T18 7v10q0 .825-.587 1.413T16 19m-8 0q-.825 0-1.412-.587T6 17V7q0-.825.588-1.412T8 5t1.413.588T10 7v10q0 .825-.587 1.413T8 19" })])]),
			]),
			h("div", { class: "music-progress-container" }, [
				h("div", { class: "music-progress-bar" }, [
					h("div", { class: "music-progress" }),
				]),
				h("div", { class: "music-time" }, [
					h("span", { class: "current-time" }, "0:00"),
					h("span", { class: "duration" }, "0:00"),
				]),
			]),
			h("div", { class: "music-volume-container" }, [
				h("button", { 
					class: "music-volume-btn",
					"aria-label": "音量",
				}, [
					h("span", { class: "volume-icon" }, [h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "1em", height: "1em", viewBox: "0 0 24 24", class: "icon-vol-high", "aria-hidden": "true" }, [h("path", { fill: "currentColor", d: "M19 11.975q0-2.075-1.1-3.787t-2.95-2.563q-.375-.175-.55-.537t-.05-.738q.15-.4.538-.575t.787 0Q18.1 4.85 19.55 7.063T21 11.974t-1.45 4.913t-3.875 3.287q-.4.175-.788 0t-.537-.575q-.125-.375.05-.737t.55-.538q1.85-.85 2.95-2.562t1.1-3.788M7 15H4q-.425 0-.712-.288T3 14v-4q0-.425.288-.712T4 9h3l3.3-3.3q.475-.475 1.088-.213t.612.938v11.15q0 .675-.612.938T10.3 18.3zm9.5-3q0 1.05-.475 1.988t-1.25 1.537q-.25.15-.513.013T14 15.1V8.85q0-.3.263-.437t.512.012q.775.625 1.25 1.575t.475 2" })])]),
					h("span", { class: "mute-icon hidden" }, [h("svg", { xmlns: "http://www.w3.org/2000/svg", width: "1em", height: "1em", viewBox: "0 0 24 24", class: "icon-vol-mute", "aria-hidden": "true" }, [h("path", { fill: "currentColor", d: "M16.775 19.575q-.275.175-.55.325t-.575.275q-.375.175-.762 0t-.538-.575q-.15-.375.038-.737t.562-.538q.1-.05.188-.1t.187-.1L12 14.8v2.775q0 .675-.612.938T10.3 18.3L7 15H4q-.425 0-.712-.288T3 14v-4q0-.425.288-.712T4 9h2.2L2.1 4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l17 17q.275.275.275.7t-.275.7t-.7.275t-.7-.275zm2.225-7.6q0-2.075-1.1-3.787t-2.95-2.563q-.375-.175-.55-.537t-.05-.738q.15-.4.538-.575t.787 0Q18.1 4.85 19.55 7.05T21 11.975q0 .825-.15 1.638t-.425 1.562q-.2.55-.612.688t-.763.012t-.562-.45t-.013-.75q.275-.65.4-1.312T19 11.975m-4.225-3.55Q15.6 8.95 16.05 10t.45 2v.25q0 .125-.025.25q-.05.325-.35.425t-.55-.15L14.3 11.5q-.15-.15-.225-.337T14 10.775V8.85q0-.3.263-.437t.512.012M9.75 6.95Q9.6 6.8 9.6 6.6t.15-.35l.55-.55q.475-.475 1.087-.213t.613.938V8q0 .35-.3.475t-.55-.125z" })])]),
				]),
				h("input", {
					type: "range",
					class: "music-volume-slider",
					min: "0",
					max: "1",
					step: "0.01",
					value: volume.toString(),
				}),
			]),
		]),
	]);
}

function getPlatformName(server) {
	const platforms = {
		'netease': '网易云音乐',
		'tencent': 'QQ音乐',
		'kugou': '酷狗音乐',
		'xiami': '虾米音乐',
		'baidu': '百度音乐',
	};
	return platforms[server] || server;
}

function getTypeName(type) {
	const types = {
		'song': '单曲',
		'playlist': '歌单',
		'album': '专辑',
		'artist': '歌手',
		'search': '搜索',
	};
	return types[type] || type;
}


