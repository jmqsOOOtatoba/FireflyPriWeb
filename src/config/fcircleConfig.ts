// 友链朋友圈 (Friend-Circle-Lite) 页面配置
export const fcircleConfig = {
	// 页面标题
	title: "友链朋友圈",

	// 页面描述
	description: "聚合朋友们的最新文章，数据来自各位友链的 RSS 订阅",

	// FCL 数据站地址（fork 仓库 page 分支部署后的站点根地址，末尾必须带 /）
	// 部署完成后把这里改成你自己的地址，例如 https://xxx.vercel.app/
	apiUrl: "https://fc.mstzuomu.space/",

	// 每次加载文章数量
	pageSize: 24,

	// 头像加载失败时的默认图片
	errorImg: "/favicon/sakura2.png",
};
