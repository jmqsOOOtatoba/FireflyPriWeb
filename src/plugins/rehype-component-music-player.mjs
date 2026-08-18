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
				h("span", { class: "play-icon" }, "▶"),
				h("span", { class: "pause-icon hidden" }, "⏸"),
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
					h("span", { class: "volume-icon" }, "🔊"),
					h("span", { class: "mute-icon hidden" }, "🔇"),
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
