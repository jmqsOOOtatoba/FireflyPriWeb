export type AnalyticsConfig = {
	googleAnalyticsId?: string; // Google Analytics ID
	microsoftClarityId?: string; // Microsoft Clarity ID
	umamiAnalytics?: {
		websiteId?: string; // Umami Website ID
		scriptUrl?: string; // Umami JS地址，支持使用自建
		shareUrl?: string; // Umami 公开分享链接（兼容字段，新逻辑优先用 shareId+shareApiBase）
		shareId?: string; // Umami 公开分享 ID（/share/<id> 路径段）
		shareApiBase?: string; // Umami 实例 origin（如 https://umami.mstzuomu.space）
		historicalStats?: {
			// 迁移至自建实例前的历史累计，展示层 = 实时计数 + 此偏移
			visitors?: number;
			pageviews?: number;
		};
		replaysScriptUrl?: string; // Umami 会话回放脚本地址
		trackOutboundLinks?: boolean; // 是否追踪出站链接点击事件，默认 true
		collectWebVitals?: boolean; // 是否自动收集访客浏览器核心网页指标，默认 false
		replays?: {
			enabled?: boolean; // 是否启用会话回放，默认 false
			sampleRate?: number; // 录制会话采样率，范围 0-1，默认 0.15
			maskLevel?: "moderate" | "strict"; // 隐私遮罩级别，默认 moderate
			maxDuration?: number; // 单次录制最大时长（毫秒），默认 300000
			blockSelector?: string; // 需要完全排除录制的元素 CSS 选择器
		};
	};
	la51Analytics?: {
		Id?: string; // 51la 统计 ID
		sdkUrl?: string; // 自定义 SDK 地址，防止 DNS 污染，默认为 "//sdk.51.la/js-sdk-pro.min.js"
		ck?: string; // 多个统计 ID 的数据分离标识，默认与 id 相同
		autoTrack?: boolean; // 开启事件分析功能，默认 true
		hashMode?: boolean; // 单页面应用统计（Vue/React 等），默认 false
		screenRecord?: boolean; // 开启网站录屏功能，默认 true
	};
};
