/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Bilibili User Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.uid - The Bilibili user ID.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created Bilibili Card component.
 */
export function BilibiliCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("bilibili" directive must be leaf type "::bilibili{uid="用户ID"}")',
		]);

	if (!properties.uid)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid UID. ("uid" attribute must be a valid Bilibili user ID)',
		);

	const uid = properties.uid;
	const cardUuid = `BC${Math.random().toString(36).slice(-6)}`;

	// 创建卡片结构
	const nAvatar = h(`div#${cardUuid}-avatar`, { class: "bc-avatar" });
	const nUsername = h(`div#${cardUuid}-username`, { class: "bc-username" }, "加载中...");
	const nSign = h(`div#${cardUuid}-sign`, { class: "bc-sign" }, "获取用户信息...");
	
	// 统计数据
	const nFans = h(`div#${cardUuid}-fans`, { class: "bc-stat" }, [
		h("span", { class: "bc-stat-value" }, "0"),
		h("span", { class: "bc-stat-label" }, "粉丝"),
	]);
	
	const nFollowing = h(`div#${cardUuid}-following`, { class: "bc-stat" }, [
		h("span", { class: "bc-stat-value" }, "0"),
		h("span", { class: "bc-stat-label" }, "关注"),
	]);
	
	const nLikes = h(`div#${cardUuid}-likes`, { class: "bc-stat" }, [
		h("span", { class: "bc-stat-value" }, "0"),
		h("span", { class: "bc-stat-label" }, "获赞"),
	]);

	// JavaScript获取数据
	const nScript = h(
		`script#${cardUuid}-script`,
		{ type: "text/javascript", defer: true },
		`
			async function fetchBilibiliData() {
				try {
					// 获取用户基本信息
					const userResponse = await fetch('https://api.bilibili.com/x/space/acc/info?mid=${uid}', {
						referrerPolicy: "no-referrer"
					});
					const userData = await userResponse.json();
					
					// 获取用户统计数据
					const statResponse = await fetch('https://api.bilibili.com/x/relation/stat?vmid=${uid}', {
						referrerPolicy: "no-referrer"
					});
					const statData = await statResponse.json();
					
					// 获取用户空间信息（获赞数）
					const spaceResponse = await fetch('https://api.bilibili.com/x/space/upstat?mid=${uid}', {
						referrerPolicy: "no-referrer"
					});
					const spaceData = await spaceResponse.json();
					
					if (userData.code === 0 && statData.code === 0) {
						const user = userData.data;
						const stat = statData.data;
						const space = spaceData.data || {};
						
						// 更新用户名
						document.getElementById('${cardUuid}-username').innerText = user.name || '未知用户';
						
						// 更新签名
						document.getElementById('${cardUuid}-sign').innerText = user.sign || '这个人很懒，什么都没写';
						
						// 更新头像
						const avatarEl = document.getElementById('${cardUuid}-avatar');
						if (user.face) {
							avatarEl.style.backgroundImage = 'url(' + user.face + '@48w_48h.jpg)';
							avatarEl.style.backgroundColor = 'transparent';
						}
						
						// 更新统计数据
						document.getElementById('${cardUuid}-fans').querySelector('.bc-stat-value').innerText = 
							Intl.NumberFormat('en-us', { notation: "compact", maximumFractionDigits: 1 }).format(stat.follower || 0);
						document.getElementById('${cardUuid}-following').querySelector('.bc-stat-value').innerText = 
							Intl.NumberFormat('en-us', { notation: "compact", maximumFractionDigits: 1 }).format(stat.following || 0);
						document.getElementById('${cardUuid}-likes').querySelector('.bc-stat-value').innerText = 
							Intl.NumberFormat('en-us', { notation: "compact", maximumFractionDigits: 1 }).format(space.likes || 0);
						
						// 移除加载状态
						document.getElementById('${cardUuid}-card').classList.remove("fetch-waiting");
						console.log("[BILIBILI-CARD] Loaded card for UID: ${uid} | ${cardUuid}");
					} else {
						throw new Error('API返回错误');
					}
				} catch (err) {
					console.error("[BILIBILI-CARD] Error loading card for UID: ${uid}", err);
					document.getElementById('${cardUuid}-card').classList.add("fetch-error");
					document.getElementById('${cardUuid}-username').innerText = '加载失败';
					document.getElementById('${cardUuid}-sign').innerText = '请检查UID是否正确';
				}
			}
			
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', fetchBilibiliData);
			} else {
				fetchBilibiliData();
			}
		`,
	);

	// 构建卡片
	return h(
		`a#${cardUuid}-card`,
		{
			class: "card-bilibili fetch-waiting no-styling",
			href: `https://space.bilibili.com/${uid}`,
			target: "_blank",
			uid: uid,
		},
		[
			// 头部：头像和用户名
			h("div", { class: "bc-header" }, [
				nAvatar,
				h("div", { class: "bc-info" }, [
					nUsername,
					nSign,
				]),
			]),
			// 统计数据
			h("div", { class: "bc-stats" }, [
				nFans,
				nFollowing,
				nLikes,
			]),
			nScript,
		],
	);
}