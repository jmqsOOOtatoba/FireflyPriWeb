# 📦 Components 组件目录

Firefly 项目中所有可复用组件的集中管理。组件按照功能和职责进行分类，提供清晰的架构和易于维护的代码组织。

## 📁 目录结构

### 🏗️ layout/ - 页面布局组件

负责整体页面框架和布局结构的组件。

- `BannerHomeTextOverlay.astro` - 首页横幅文字覆盖层（打字机副标题、社交与邮件图标，图标带 Magnet 磁吸）
- `BannerPostMetaOverlay.astro` - 文章页横幅覆盖层（横幅描述或文章元信息，由 `bannerPostInfoMode` 二选一）
- `CategoryBar.astro` - 分类栏组件
- `ConfigCarrier.astro` - 配置载体组件
- `DropdownMenu.astro` - 下拉菜单组件
- `Footer.astro` - 页脚组件（正文内容读自 `src/config/FooterConfig.html`）
- `GooeyNavIndicator.svelte` - 导航栏液态融合指示器（SVG goo 滤镜装饰层，只跟踪 hover，不接管链接渲染；触摸设备与 `prefers-reduced-motion` 下不启用）
- `HeaderTopRow.astro` - 导航栏外壳（从 `MainGridLayout.astro` 迁出，按 `navbarMode` 决定 fixed / static）
- `Navbar.astro` - 导航栏组件
- `NavMenuPanel.astro` - 导航菜单面板
- `PostCard.astro` - 文章卡片组件
- `PostMeta.astro` - 文章元数据组件
- `PostPage.astro` - 文章页面布局组件
- `PostStats.astro` - 文章统计（发布日期、字数、阅读时长，各自可开关）
- `SideBar.astro` - 侧边栏组件（按 `sidebarLayoutConfig` 的 `type` 经 `componentMap` 映射到 widget/ 组件）
- `SidebarColumn.astro` - 侧栏列容器（从 `MainGridLayout.astro` 迁出，判断有无可用组件后再渲染 `SideBar`）
- `WallpaperSection.astro` - 壁纸与横幅区域（图片轮播、`BackgroundPlayer`、两个 Overlay、水波纹、滚动提示）

### 🎮 controls/ - 导航和交互控件

页面导航和用户交互功能组件。

**导航控件**
- `BackToComment.astro` - 返回评论区按钮
- `BackToHome.astro` - 返回主页按钮
- `BackToTop.astro` - 返回顶部按钮
- `FloatingControls.astro` - 右下角悬浮控件容器（聚合 BackTo* / FloatingTOC / ImmersiveReading / ImmersiveTOC）
- `FloatingTOC.astro` - 浮动目录组件
- `ScrollDownIndicator.astro` - 向下滚动指示器
- `ArchivePanel.astro` - 归档面板组件（服务端渲染 + 客户端筛选/折叠）

**交互组件**
- `DisplaySettingsIntegrated.svelte` - 集成的显示设置面板（布局切换、壁纸模式、卡片边框、横幅、特效等开关的唯一入口）
- `ImmersiveReading.astro` - 沉浸阅读入口按钮（委托 `utils/immersive-reading-utils.ts` 管理进出状态）
- `ImmersiveTOC.astro` - 沉浸阅读模式的目录面板（加密文章不在服务端渲染标题，改由客户端解密后生成）
- `LightDarkSwitch.svelte` - 主题切换组件
- `Search.svelte` - 搜索功能组件
- `SquishSwitch.svelte` - 带弹簧回弹的开关控件（纯视觉层，状态由调用方持有）

> 说明：早期的 `DisplaySettings.svelte`、`LayoutSwitchButton.svelte`、`WallpaperSwitch.svelte` 已不存在，功能分别并入 `DisplaySettingsIntegrated.svelte` 与 `layout/WallpaperSection.astro`。

### 🔧 common/ - 公共可复用组件

通用的 UI 组件和工具组件，支持跨项目复用。

**下拉与基础 UI 组件**
- `ButtonLink.astro` - 链接按钮
- `ButtonTag.astro` - 标签按钮
- `DropdownItem.astro` / `.svelte` - 下拉选项（`.svelte` 版供 `LightDarkSwitch` 使用）
- `DropdownPanel.astro` / `.svelte` - 下拉面板容器（**`.svelte` 版当前无任何引用**，`DropdownMenu.astro` 用的是 `.astro` 版）
- `FloatingButton.astro` - 悬浮按钮基础组件
- `Icon.svelte` - 图标组件（带加载状态和错误处理）
- `Magnet.svelte` - 磁吸包装：hover 时内容向光标轻微位移（触摸设备与 `prefers-reduced-motion` 下禁用；不拦截点击/焦点）
- `WidgetLayout.astro` - 小部件布局容器
- `ToastHost.svelte` - Toast 宿主（`Layout.astro` 常驻岛；最多同时 3 条，超出丢最旧；挂载时接管剪贴板复制提示）
- `ToastCard.svelte` - 单条 Toast 卡片（滑入滑出、右滑与快速上滑关闭、橡皮筋阻尼）

**内容和展示组件**
- `CoverImage.astro` - 封面图组件（支持本地图片和随机图API）
- `ImageWrapper.astro` - 图片包装器（支持本地和远程图片）
- `Markdown.astro` - Markdown 内容样式包装器
- `PioMessageBox.astro` - 消息框组件（Live2D/Spine 消息显示）
- `Timeline.astro` / `TimelineItem.astro` - MDX 时间线组件（左侧竖线节点，条目支持日期/标题/正文 Markdown、节点换色和内置图标）
- `Steps.astro` / `StepItem.astro` / `Badge.astro`  - MDX 内容组件（编号步骤条、内联徽章）
- `TabGroup.svelte` - MDX 标签页代码组（`::: code-group` 在 `::: tip` 里无法解析时的替代方案）
- `mdx-icons.ts` - `TimelineItem` / `StepItem` 共用的内置内联 SVG 图标表（喂给 `icon` 属性的名字）

**分页组件**
- `ClientPagination.svelte` - 客户端分页（JavaScript 控制）
- `Pagination.astro` - 静态路由分页（Astro 原生）
- `PageJump.svelte` - 页码跳转输入框（`ellipsis` / `current` 两种变体，被上面两个分页组件共用）

**列表与筛选组件**
- `FilterControls.svelte` - 胶囊筛选按钮组（被 `pages/bangumi/BangumiSection`、`pages/mal/MalSection`、`pages/vndb/VndbSection` 引用）
- `TabNav.svelte` - 标签导航组件（`useHash` 默认开启，选中项同步到 URL hash；被 `BangumiGrid`/`BilibiliGrid`/`MalGrid`/`VndbGrid` 引用）
- `GridSkeleton.svelte` - 媒体网格加载骨架

> 现状提醒：`pages/bangumi/TabNav.svelte` 是早期没有抽到 common 时的本地副本，目前只被 `pages/anime/AnimeGrid.svelte` 以 `../bangumi/TabNav.svelte` 跨目录引用；`pages/vndb/TabNav.svelte`、`pages/vndb/FilterControls.svelte`、`pages/bangumi/FilterControls.svelte` 没有任何引用。三份 `FilterControls` 内容完全一致（MD5 相同），三份 `TabNav` 已各自演化、行数不同（common 70 行 / vndb 65 行 / bangumi 63 行）。新代码一律引 `common/` 版本。

### 🔗 根级模块（src/components/）

不属于任何子目录的模块。

- `firefly-mdx.ts` - MDX 文章 UI 组件集合的再导出入口，`import { TabGroup, Timeline, TimelineItem } from "@/components/firefly-mdx"` 一次引全（Astro 组件靠 `src/astro-modules.d.ts` 的 `*.astro` 模块声明兜底）

### 🧩 widget/ - 小部件

侧边栏中使用的各种功能小部件。新增 widget 需同时改 `layout/SideBar.astro` 的 `componentMap` 与 `types/config.ts` 里的 `WidgetComponentType`。

- `Advertisement.astro` - 广告组件
- `Announcement.astro` - 公告组件
- `Calendar.astro` - 日历组件
- `Categories.astro` - 分类组件
- `Dynamic.astro` - 动态（说说）侧栏入口，包 `WidgetLayout` 后渲染 `DynamicSidebar.svelte`
- `DynamicSidebar.svelte` - 侧栏动态的客户端组件（从可配置 API 拉数据，支持 Memos 适配与请求去重）
- `Music.astro` - 侧栏音乐小部件（`WidgetLayout` + `features/MusicPlayer.astro`，受 `showInSidebar` 控制）
- `Profile.astro` - 个人信息/社交链接小部件（社交图标用 Magnet）
- `SidebarTOC.astro` - 侧边栏目录组件
- `SiteInfo.astro` - 站点信息组件
- `SiteStats.astro` - 站点统计组件
- `SpineModel.astro` - **未被任何文件引用**（实际生效的是 `features/SpineModel.astro`，由 `MainGridLayout.astro` 挂载）
- `Tags.astro` - 标签组件
- `VisitorInfo.astro` - 访客信息组件（IP / 地理位置等）

### ✨ features/ - 全局功能特效组件

全局加载的功能增强和特效组件。

**管理器（初始化和管理功能）**
- `BackgroundPlayer.astro` - 背景视频播放器（`playerUrl` 支持单源或多源，`playerMode` 支持顺序/随机）
- `CodeGroupManager.astro` - Tab 代码块交互管理器（插件脚本绑 `DOMContentLoaded`，Swup 跳转后失效，这里用挂在 `document` 上的事件委托兜底，与插件脚本幂等共存）
- `FancyboxManager.astro` - Fancybox 图片查看器管理
- `FontSetup.astro` - 字体加载和管理（基于 Astro Font API）
- `GithubCardManager.astro` - GitHub 卡片运行时数据补全（stars/forks 请求 `api.github.com` 并写 localStorage 缓存 24h，失败回退构建期静态信息）
- `KatexManager.astro` - Katex 数学公式渲染管理
- `MusicManager.astro` - 全局音乐播放管理器（单例，管理唯一 audio 元素和播放状态，通过 CustomEvent 同步所有 MusicPlayer 视图实例）
- `MusicPlayerManager.astro` - **文章内嵌播放器**（`::music` 指令）的运行时管理器，对应构建期插件生成的静态 DOM，和上面那套全局播放器是两条独立链路

**音乐播放器四件套的关系**

| 文件 | 角色 |
|------|------|
| `MusicManager.astro` | 播放引擎（全局单例，唯一 audio 元素，`window.__fireflyMusic`） |
| `MusicPlayerView.astro` | 视图控制器（`Layout.astro` 全局挂载一次，遍历所有 `.music-player-widget` 初始化；必须保持 `is:inline`，靠 Swup 重跑内联脚本来完成换页后重新初始化） |
| `MusicPlayer.astro` | 纯视图标记（约 155 行，只有封面/进度条/控制按钮/歌词与播放列表抽屉的 DOM 骨架，不含播放逻辑），由 `widget/Music.astro` 与 `layout/Navbar.astro` 各自实例化 |
| `MusicPlayerManager.astro` | 文章正文内嵌播放器（`::music`）的独立运行时，与上面三个不是同一套 |

**功能组件**
- `DecryptedText.svelte` - 解密乱码渐现文字效果（乱码池优先复用文字自身字符）
- `EncryptedContent.astro` - 加密内容组件
- `EncryptedPost.astro` - 加密文章组件
- `Live2DWidget.astro` - Live2D 看板娘组件
- `SakuraEffect.astro` - 樱花飘落特效
- `SpineModel.astro` - Spine 看板娘组件（由 `MainGridLayout.astro` 挂载）
- `TypewriterText.astro` - 打字机动画效果
- `WavesEffect.astro` - 水波纹特效（Canvas 2D，首帧同步绘制避免闪烁，逐帧只对预渲染条带做 `drawImage`）

### 📃 pages/ - 页面特定组件

特定页面使用的组件，不用于其他页面。

- `AdvancedSearch.svelte` - 高级搜索组件（`src/pages/search.astro` 使用）

**pages/anime/** - 本地番剧页组件
- `AnimeCard.svelte` - 番剧卡片
- `AnimeDetailModal.svelte` - 番剧详情弹窗
- `AnimeGrid.svelte` - 番剧网格（分页 + 分类 tab；tab 组件来自 `../bangumi/TabNav.svelte`，是全项目唯一跨目录引用 pages 副本的地方）

**pages/bangumi/** - 番组计划页面组件
- `BangumiGrid.svelte` - 番组网格布局组件
- `BangumiSection.svelte` - 番组分类展示组件
- `Card.svelte` - 番组卡片组件
- `FilterControls.svelte` - **未被引用**（内容与 `common/FilterControls.svelte` 完全一致）
- `TabNav.svelte` - 只被 `pages/anime/AnimeGrid.svelte` 引用（见上方 common/ 的现状提醒）

**pages/bilibili/** - B 站追番页组件
- `BilibiliCard.svelte` - 追番卡片
- `BilibiliDetailModal.svelte` - 追番详情弹窗
- `BilibiliGrid.svelte` - 追番网格

**pages/dynamic/** - 动态（说说）页面组件
- `DynamicFeed.svelte` - 负责动态 JSON 加载、搜索、年份筛选和分页
- `DynamicGallery.astro` - 动态图片网格、轮播和灯箱（自定义元素 `<dynamic-gallery>`）
- `dynamic-gallery.ts` - 上述自定义元素的注册与运行时逻辑（`registerDynamicGallery()`）
- `DynamicInlineComments.astro` - 单条动态的按需评论区（自定义元素 `<dynamic-inline-comments>`）
- `dynamic-inline-comments.ts` - 上述自定义元素的注册与运行时逻辑（`registerDynamicInlineComments()`）
- `DynamicItemTemplate.astro` - 动态条目的客户端渲染模板（`src/pages/dynamic/index.astro` 使用）
- `DynamicItem.astro` - 动态条目的服务端渲染组件，**当前无任何引用**（保留的传统服务端渲染实现）

**pages/friends/** - 友链页面组件
- `FriendApplyForm.astro` - 友链申请表单（自定义元素 `<friend-apply-form>`，在 `content/spec/friends.mdx` 中引入）

**pages/gallery/** - 相册页面组件
- `AlbumCard.astro` - 相册卡片组件
- `PhotoCard.astro` - 照片卡片组件

**pages/mal/** - MAL 追番列表页组件
- `Card.svelte` - MAL 条目卡片
- `MalGrid.svelte` - 分类 tab 容器（引 `common/TabNav.svelte`，每类渲染一个 `MalSection`）
- `MalSection.svelte` - 单分类的分页 + 筛选区

**pages/projects/** - 项目页组件
- `ProjectCard.astro` - 项目卡片（`src/pages/projects/index.astro` 使用）

**pages/vndb/** - VNDB 列表页组件
- `Card.svelte` - VNDB 条目卡片
- `VndbGrid.svelte` - 网格 + tab（引 `common/TabNav.svelte`，加载中显示 `GridSkeleton`）
- `VndbSection.svelte` - 单分类的分页 + 筛选区
- `FilterControls.svelte` - **未被引用**（内容与 `common/FilterControls.svelte` 完全一致）
- `TabNav.svelte` - **未被引用**（`VndbGrid` 已改引 `common/TabNav.svelte`）

### 💬 comment/ - 评论系统组件

第三方评论系统集成组件。

- `index.astro` - 评论主组件（按 `commentConfig.type` 选择并渲染下面的具体实现）
- `Artalk.astro` - Artalk 评论集成
- `Disqus.astro` - Disqus 评论集成
- `Giscus.astro` - Giscus 评论集成（GitHub 讨论）
- `Twikoo.astro` - Twikoo 评论集成
- `Waline.astro` - Waline 评论集成

### 📊 analytics/ - 数据统计组件

网站分析和统计集成组件。

- `GoogleAnalytics.astro` - Google Analytics
- `La51Analytics.astro` - 51la 统计
- `MicrosoftClarity.astro` - Microsoft Clarity
- `UmamiAnalytics.astro` - Umami 统计

### 🔧 misc/ - 杂项工具组件

其他辅助和工具类组件。

- `License.astro` - 许可证信息显示
- `PulseHeart.svelte` - 文章点赞红心（localStorage 计数，`pages/posts/[...slug].astro` 使用）
- `RecommendedPost.astro` - 推荐文章组件
- `SeriesNav.astro` - 文章系列导航（前后篇跳转，`pages/posts/[...slug].astro` 使用）
- `SharePoster.svelte` - 分享海报生成

---

## 🗂️ 分类原则

| 分类 | 用途 | 特点 |
|------|------|------|
| **layout/** | 页面布局和结构 | 决定整体页面框架 |
| **controls/** | 导航和交互 | 用户交互功能 |
| **common/** | 通用可复用组件 | 跨多个页面/组件使用 |
| **widget/** | 侧边栏小部件 | 侧边栏特定组件，需在 `SideBar.astro` 的 `componentMap` 注册 |
| **features/** | 全局功能特效 | 全局加载的增强功能 |
| **pages/** | 页面特定组件 | 仅在特定页面使用 |
| **comment/** | 评论系统 | 第三方服务集成 |
| **analytics/** | 数据统计 | 分析和统计服务 |
| **misc/** | 工具和辅助 | 其他杂项功能 |

## ⚠️ 已知未引用与重复文件

以下文件当前没有任何引用，整理代码时可作为清理候选（删除前请先确认没有正在进行的重构依赖它们）：

| 文件 | 情况 |
|------|------|
| `pages/vndb/TabNav.svelte` | 未引用，`VndbGrid` 已改引 `common/TabNav.svelte` |
| `pages/vndb/FilterControls.svelte` | 未引用，与 `common/FilterControls.svelte` 逐字节相同 |
| `pages/bangumi/FilterControls.svelte` | 未引用，与 `common/FilterControls.svelte` 逐字节相同 |
| `pages/dynamic/DynamicItem.astro` | 未引用，动态页已改用 `DynamicItemTemplate.astro` 走客户端渲染 |
| `widget/SpineModel.astro` | 未引用，实际生效的是 `features/SpineModel.astro` |
| `common/DropdownPanel.svelte` | 未引用，`DropdownMenu.astro` 用的是 `DropdownPanel.astro` |

`pages/bangumi/TabNav.svelte` 不算死文件，但只在 `pages/anime/AnimeGrid.svelte` 里以相对路径引用，属于历史遗留的跨目录依赖。
