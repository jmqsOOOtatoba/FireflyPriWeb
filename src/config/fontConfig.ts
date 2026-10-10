/**
 * 字体配置（统一入口）
 *
 * 所有字体相关配置都在此文件中定义：
 *   详细用法请参考 Astro 官方文档：https://docs.astro.build/en/guides/fonts
 * - fonts：Astro Font API 字体定义（自动下载、缓存、优化加载）
 * - fontConfig：字体选择与区域覆盖
 *
 * 添加新字体只需编辑本文件：
 * 1. 在下方 fonts 数组中添加字体定义
 * 2. 在 fontConfig.selected 或区域字段中引用对应的 cssVariable
 *
 * 支持的 provider：https://docs.astro.build/en/reference/font-provider-reference/#built-in-providers
 *   "google"     - Google Fonts
 *   "fontsource" - Fontsource
 *   "local"      - 本地字体文件
 *   "bunny"      - Bunny Fonts
 *   "fontshare"  - Fontshare
 *   "npm"        - NPM 包（如 @fontsource/*）
 *
 * 本地字体子集化：在 fontConfig.subsetFonts 中添加对应 cssVariable 的配置，
 * 构建时脚本会自动扫描页面字符并生成轻量 woff2 子集。
 */
import type { FontDefinition, FontSelectionConfig } from "@/types/fontConfig";

// ─── Astro Font API 字体定义 ───────────────────────────────
// 适用于 Astro Font API 的字体配置，支持自动下载、缓存和优化加载
// 本地开发调试的情况下，修改后需要每次重启开发服务器才能生效
export const fontsList: FontDefinition[] = [
	{
		name: "Zen Maru Gothic",
		cssVariable: "--font-zen-maru-gothic",
		provider: "fontsource",
		weights: ["300", "400", "500", "600", "700"],
		styles: ["normal"],
		subsets: ["latin", "cyrillic"],
		fallbacks: ["sans-serif"],
	},
	{
		name: "Inter",
		cssVariable: "--font-inter",
		provider: "fontsource",
		weights: ["300", "400", "500", "600", "700"],
		styles: ["normal"],
		subsets: ["latin", "cyrillic"],
		fallbacks: ["sans-serif"],
	},
	// ─── UTTU 风格：正文拉丁字体（本地文件，代理不可用时也能构建）───
	{
		name: "Work Sans",
		cssVariable: "--font-work-sans",
		provider: "local",
		options: {
			variants: [
				{
					src: ["./public/assets/fonts/work-sans-latin-400-normal.woff2"],
					weight: "400",
					style: "normal",
				},
				{
					src: ["./public/assets/fonts/work-sans-latin-500-normal.woff2"],
					weight: "500",
					style: "normal",
				},
				{
					src: ["./public/assets/fonts/work-sans-latin-600-normal.woff2"],
					weight: "600",
					style: "normal",
				},
				{
					src: ["./public/assets/fonts/work-sans-latin-700-normal.woff2"],
					weight: "700",
					style: "normal",
				},
			],
		},
		fallbacks: ["sans-serif"],
	},
	// ─── UTTU 风格：标题衬线（拉丁，含斜体强调用）───
	{
		name: "Playfair Display",
		cssVariable: "--font-playfair",
		provider: "local",
		options: {
			variants: [
				{
					src: ["./public/assets/fonts/playfair-latin-700-normal.woff2"],
					weight: "700",
					style: "normal",
				},
				{
					src: ["./public/assets/fonts/playfair-latin-700-italic.woff2"],
					weight: "700",
					style: "italic",
				},
				{
					src: ["./public/assets/fonts/playfair-latin-900-normal.woff2"],
					weight: "900",
					style: "normal",
				},
				{
					src: ["./public/assets/fonts/playfair-latin-900-italic.woff2"],
					weight: "900",
					style: "italic",
				},
			],
		},
		fallbacks: ["serif"],
	},
	// ─── UTTU 风格：标题衬线（CJK，构建时由 subset-fonts 裁剪成 woff2）───
	{
		name: "Noto Serif SC",
		cssVariable: "--font-noto-serif-sc",
		provider: "local",
		options: {
			variants: [
				{
					src: ["./public/assets/fonts/NotoSerifSC-Bold.otf"],
					weight: "700",
					style: "normal",
				},
			],
		},
		fallbacks: ["serif", "Songti SC", "SimSun"],
	},
	{
		name: "JetBrains Mono",
		cssVariable: "--font-jetbrains-mono",
		provider: "fontsource",
		weights: ["400", "700"],
		styles: ["normal"],
		subsets: ["latin", "cyrillic"],
		fallbacks: [
			"ui-monospace",
			"SFMono-Regular",
			"Menlo",
			"Monaco",
			"Consolas",
			"Liberation Mono",
			"Courier New",
			"monospace",
		],
	},
	// ─── 本地字体示例 ───
	// 使用步骤：
	// 1. 将 TTF/OTF/WOFF2 字体文件放在 public/assets/fonts/ 目录下
	// 2. 参考下方配置填写正确的字体信息
	// 3. 在 fontConfig.selected 或区域字段中引用 cssVariable
	{
		name: "GreatVibes Regular 2",
		cssVariable: "--font-greatvibes",
		provider: "local",
		options: {
			variants: [
				{
					src: ["./public/assets/fonts/GreatVibes-Regular-2.otf"],
				},
			],
		},
		fallbacks: ["sans-serif"],
	},
	{
		name: "HanYi WenHei 85W",
		cssVariable: "--font-hanyi-wenhei",
		provider: "local",
		options: {
			variants: [
				{
					src: ["./public/assets/fonts/HYWenHei-65W-3.ttf"], // 改为实际的文件名
				},
			],
		},
		fallbacks: [
			"sans-serif",
			"PingFang SC",
			"Microsoft YaHei",
			"Hiragino Sans GB",
		],
	},
];

// ─── 字体选择与区域覆盖 ─────────────────────────────────────
export const fontConfig: FontSelectionConfig = {
	// 是否启用自定义字体功能
	enable: true,
	// 当前选择的字体 CSS 变量名（对应上方 fonts 中的 cssVariable）
	// 使用 "system" 表示系统字体（不加载任何自定义字体）
	// Work Sans 先渲染拉丁字符，CJK 字符自动回退到汉仪文黑
	selected: ["--font-work-sans", "--font-hanyi-wenhei"],

	// 各区域独立字体设置（填写上方 fonts 中的 cssVariable，留空则使用全局 selected 字体）
	// 例如：bannerTitleFont: "--font-inter", 表示主页横幅主标题使用 Inter 字体
	// 主页横幅主标题字体
	bannerTitleFont: "--font-zen-maru-gothic",
	// 主页横幅副标题字体
	bannerSubtitleFont: "--font-inter",
	// 导航栏标题字体
	navbarTitleFont: "",
	// 标题字体链：Playfair（拉丁衬线）→ 思源宋体（CJK 衬线）
	headingFont: ["--font-playfair", "--font-noto-serif-sc"],
	// 代码块字体（用于代码高亮和等宽字体场景）
	codeFont: "--font-jetbrains-mono",

	// 本地字体子集化配置（构建时由 scripts/subset-fonts.ts 处理）
	// key 为 fonts 数组中对应的 cssVariable，value 为子集化选项
	subsetFonts: {
		"--font-greatvibes": {
			// 额外包含的字符
			extraChars: "",
		},
		// 全站正文主字体（selected 引用），不配子集化会原样输出 3.1MB TTF
		"--font-hanyi-wenhei": {
			extraChars: "",
		},
		// 标题 CJK 衬线（12MB OTF，构建时裁剪为页面实际用字的 woff2）
		"--font-noto-serif-sc": {
			extraChars: "",
		},
	},
};
