import type { AnalyticsConfig } from "../types/analyticsConfig";

export const analyticsConfig: AnalyticsConfig = {
	// Google Analytics ID
	googleAnalyticsId: "",
	// Microsoft Clarity ID
	microsoftClarityId: "",
	// Umami 统计配置（2026-10-21 起为自建实例 umami.mstzuomu.space，Docker 部署于备案服务器）
	umamiAnalytics: {
		// Umami Website ID（自建实例中的站点 ID）
		websiteId: "b7133f9c-dd00-4788-bd60-070691faac3d",
		// Umami JS地址，支持使用自建
		scriptUrl: "https://umami.mstzuomu.space/script.js",
		// 公开分享链接（兼容保留；新逻辑优先用 shareId + shareApiBase 拼接）
		shareUrl: "https://umami.mstzuomu.space/share/JU1ln89R70HYBxnC",
		// Umami 公开分享 ID（/share/<id> 路径段）
		shareId: "JU1ln89R70HYBxnC",
		// Umami 实例 origin（公开分享 API 基址）
		shareApiBase: "https://umami.mstzuomu.space",
		// 云端历史累计（Umami Cloud，2026-08-14 ~ 2026-10-21 迁移至自建前的精确值）
		// 云端历史已于 2026-10-21 全量迁入自建库（session/website_event 合成记录），
		// 展示层偏移归零；如需回滚迁移，把这里改回 { visitors: 774, pageviews: 5605 }
		historicalStats: {
			visitors: 0,
			pageviews: 0,
		},
		// Umami 会话回放脚本地址，支持使用自建
		replaysScriptUrl: "https://cloud.umami.is/recorder.js",
		// 是否追踪出站链接
		trackOutboundLinks: true,
		// 是否收集浏览器性能指标
		collectWebVitals: false,
		// 会话回放配置
		replays: {
			// 是否启用会话回放
			enabled: false,
			// 录制会话采样率，范围 0-1，例如 0.15 表示记录 15% 的会话
			sampleRate: 0.15,
			// 隐私遮罩级别："moderate" 会遮罩所有输入框；"strict" 额外遮罩页面全部文本
			maskLevel: "moderate",
			// 单次录制最大时长（毫秒）
			maxDuration: 300000,
			// 需要排除录制的元素 CSS 选择器，例如 ".sensitive-widget"
			blockSelector: "",
		},
	},
	// 51la 统计配置
	la51Analytics: {
		// 51la 统计 ID
		Id: "",
		// 自定义 SDK JS 地址，防止 DNS 污染，留空使用默认地址
		sdkUrl: "",
		// 多个统计 ID 的数据分离标识，留空则使用 Id
		ck: "",
		// 是否开启事件分析功能
		autoTrack: false,
		//  Hash路由模式, 项目使用History API路由, 所以不必开启默认false
		hashMode: false,
		// 是否开启网站录屏功能
		screenRecord: true,
	},
};
