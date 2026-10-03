# Project memory
_Durable project-level knowledge. Persists across all sessions in this project. Edit only content under italic instructions._

## Project context
_What is this project? What's its goal? High-level identity._

- **Firefly**（`package.json` name: `firefly`，v6.16.7）：个人博客/门户站点，Astro 7（7.2.10）+ Svelte 5 岛屿 + TypeScript，源码在 `C:\Users\JOKERW\Desktop\web\FireflyPriWeb`。
- 构建目标 Cloudflare（`@astrojs/cloudflare` + `wrangler`）；样式 Tailwind CSS 4 + Stylus；搜索用 Pagefind；Markdown 管线含 KaTeX、expressive-code、MDX。
- 功能模块（配置集中在 `src/config/*Config.ts`，经 `@/config` 导入）：文章、友链、书签导航（booknav）、友圈（fcircle）、画廊、音乐播放器（文章内 `::music` 由 `MusicPlayerManager.astro` + `src/plugins/music-player-script.js` 驱动；首页侧边栏播放器是独立的 `MusicPlayer.astro` 等 4 文件）、评论、看板娘（pio）、Live2D、动态（dynamic）等。
- 包管理强制 pnpm（`preinstall: only-allow pnpm`），Node ≥ 22.23，`pnpm build` 串联多个数据生成脚本（friend-json、github-card、lqip、vndb covers、字体子集、minify、pagefind）。
- 详细规范见根目录 `AGENTS.md`（每次会话自动注入）；Biome 管格式（tab 缩进、双引号）。

## Rules
_Hard constraints from user that every session must respect._

- **会话开工先读项目记忆（用户指定，2026-10-02）**：每个会话在开始动手前必须先读一遍当前项目的 MEMORY.md，了解现行约定与基线，避免遗漏规则（起因：未先读记忆导致"整理本次修改"的三段式约定被用户点名才执行）。触发点是**全局指令文件 `C:\Users\JOKERW\.config\mimocode\AGENTS.md`**（随每次对话对所有项目自动注入），不是本仓库的 AGENTS.md（曾在那里加过 Session Startup 段，已按用户要求回退）。**本文件已于 2026-10-02 从记忆系统目录（`...\memory\projects\95cf80b0...\MEMORY.md`）迁至项目根目录**——记忆搜索工具索引不到迁移后的文件，读取靠全局规则直接 Read 项目根目录；系统提示里 Memory system 段给出的旧路径已失效，勿再往旧路径写。

- **"整理本次修改"指令（用户指定，2026-10；以本条为准，全局指令同名段让位于本条）**：当用户说"整理一下本次修改"或类似意思（如"总结改动"、"看看改了什么"、"收拾一下"、"清理一下改动"）时，自动执行一次改动盘点，输出三部分：
  1. **修改清单**：本次会话改了哪些文件、每个文件改了什么（用 `git status` + `git diff --stat` 核对，不凭记忆列）；
  2. **多改检查**：对照当前任务范围，找出是否有任务之外的改动（尤其 `pnpm lint` 波及的无关格式化文件），列出并建议回退；
  3. **垃圾文件检查**：找出本次生成的没用文件（临时脚本、测试截图、误建的副本/中间产物），列出并建议删除；同时用 `git diff` 核对有没有不小心删除的内容。
  汇报后等用户确认再执行回退/删除，不要擅自清理。
  *注：本文件 `MEMORY.md` 已被 git 跟踪并推送到用户仓库（2026-10-02 用户确认保留）——盘点时它的改动属于"记忆更新"，单列说明即可，不按"多改的文件"处理。*

- **内容创作路径（用户指定，2026-09/10）**：
  - 写文章 → `src/content/posts/txt/`（如 `1文章.md`、`13文章.md`）；**文件名序号顺延**：取目录内现有最大 N，新文章命名为 `N+1文章.md`（2026-09 用户明确要求按序号排）
  - 发更新公告 → `src/content/posts/update/`（如 `更新公告20260928.md`）
  - 发动态 → `src/content/dynamic/`（如 `20260928-1933.md`）
  - 新建这三类内容时必须放对应目录，不要放 `posts/` 根目录（根目录下是示例/教程文章）。
- **视觉/UI 改动的验证流程（用户指定，2026-09；2026-10 再澄清）**：静态检查（type-check、只读 `npx biome check <files>`）跑完后，优先让用户在本地浏览器直接看效果（dev server 本地跑着）。**Playwright 本身可以用**，用户不介意自动化截图/测量；唯一红线是**不许下载安装新浏览器**——一律 `playwright-core` + `channel:"chrome"` 连系统已装的 Chrome。注意 `playwright-cli` 会话易崩，用 Node API 方式调用；dev server 下 networkidle 永不满足，等 `domcontentloaded` 即可。**2026-10-01 起 playwright MCP 已修复可用，浏览器自动化优先走 MCP 工具**（navigate/snapshot/take_screenshot 等，不经过 shell），CLI/Node API 为备选。

- **`git pull` 轻量规则（用户指定，2026-10-03；同日简化）**：发布台只改三个内容目录——文章 `src/content/posts/txt/`、更新公告 `src/content/posts/update/`、动态 `src/content/dynamic/`，pull 的目的就是同步这三处的远程新内容。**每轮会话开工时 pull 一次即可，对话内不要反复 pull**（此前"每次编辑前必 pull"过于繁琐，用户明确简化）；提交推送时若 push 被拒绝（non-fast-forward）再 pull 一次属正常 git 操作。**pull 若因网络失败，必须明确告知用户、等用户解决网络问题并示意后再重试，不许静默反复重试、更不许跳过拉取直接改**（本机 GitHub 连接间歇抖动的分栈应对见下方"本机网络分栈差异"）。

## Architecture decisions
_Major design choices with rationale. The "why" matters more than the "what" for future sessions._

- **MD 扩展组件（`::xxx` 指令）标准结构**（2026-09 重构后确立，PDF/音乐/哔哩三组件均遵循）：
  - 插件 → `src/plugins/rehype-component-*.mjs`，hastscript 构建 DOM，叶子校验 + 缺参校验返回 `class="hidden"` 错误提示（提示文案要含正确语法示例），带 JSDoc
  - 注册 → `astro.config.mjs` 的 `rehypeComponents.components`（import 已按字母排序，保持之）
  - 样式 → 并入 `src/styles/markdown-extend.styl`（分区注释），由 `Markdown.astro` / `DynamicItemTemplate.astro` 加载，**只在有正文的页面生效**；颜色一律用主题变量（`--license-block-bg`、`--line-divider`、`--tw-prose-headings`、`--tw-prose-body`、`--btn-regular-bg`），不写死色值、不手写 `.dark` 覆盖
  - 客户端脚本 → Astro 组件 `<script>` 副作用导入（对齐 `GithubCardManager.astro` / `MusicPlayerManager.astro` 模式），由 Layout 渲染；**禁止**在 Layout `<head>` 手写 `<link>`/`<script src>` 指向 public
  - 有状态的播放器（loading/error/playing 类）CSS 状态类要跟脚本切换的类名一一对应
- **文章内两套播放器是独立系统，勿混淆**：首页侧边栏播放器 = `music-player-widget` 类（样式内联在 `MusicPlayer.astro`）；文章 `::music` = `music-player-container` 类。改任何一个都不要碰另一个的文件。
- **友圈（Friend-Circle-Lite）三段式架构（2026-09-26 落地，设计详解见站内 `12文章.md`）**：
  - ①**博客=展示+名单**：`scripts/generate-friend-json.ts` 挂在 `pnpm build` 链首，从 `friendsConfig` 生成 `public/friend.json`（这是爬虫的**输入**，必须先于爬虫上线）；页面 `src/pages/fcircle.astro`、配置 `src/config/fcircleConfig.ts`（`apiUrl` 是数据站地址的**唯一回填点**，末尾必须带 `/`）、前端自托管在 `public/fclite/`（**不用 jsdelivr CDN**，国内不稳）；开关 `pages.fcircle` + 导航 `LinkPresets.Fcircle`。
  - ②**fork 仓库=数据生成**：`jmqsOOOtatoba/Friend-Circle-Lite`，Actions cron `22 */4 * * *`（UTC＝北京 00:22/04:22/08:22/12:22/16:22/20:22）爬 RSS 后**强推 `page` 分支**。`conf.yaml` 的 `json_url` 必须指向本站 `friend.json`——漏改会去爬上游作者的 200+ 陌生友链（真实事故）。
  - ③**Vercel=托管**：项目 `friend-circle-lite`（scope `azuma3`），生产分支 = `page`；自定义域名 **`fc.mstzuomu.space`**（`*.vercel.app` 国内 DNS 污染必须绑自有域名）；CORS 头来自 `static/vercel.json`，靠 workflow 里 `cp` 行拷进 `page` 分支（**改那行 cp 时别把 `./static/vercel.json` 弄丢**，丢了跨域就挂）。
  - 样式桥接是必须的：fclite.css 用 `[data-theme=light/dark]` 切色，本站 `data-theme` 装的是代码高亮主题名、暗色靠 `html.dark`，`fcircle.astro` 底部 `:root.dark #friend-circle-lite-root` 变量块负责翻译；`--hover-color` 覆盖成 `var(--primary)` 跟随主题色。
  - 页面内脚本顺序不可动：内联 `window.UserConfig` 必须在 `fclite.js` 之前（fclite 加载即读取，读不到 ReferenceError）；Swup 的 scripts 插件（reloadScripts 默认开）会在切页时重跑容器内脚本，所以站内跳转到该页也能初始化，无需额外 swup 适配。
- **自定义悬浮 UI 必须带 `card-base` 类才能跟随全局卡片设置**（2026-09 阅读进度徽章踩坑确立）：卡片透明度滑块（`--card-transparent-opacity` → `--card-bg-transparent`）、卡片边框（`.enable-card-border`）、主题色相背景，全部通过 `.card-base` **类选择器**挂钩（代表规则：`main.css` 的 `.wallpaper-transparent .card-base { background-color: var(--card-bg-transparent) !important }`，另有 `.btn-card`、`.bg-(--card-bg)` 两族）。自定义悬浮元素要像 `FloatingButton` 一样受这些设置控制，就必须：类列表带 `card-base`，且**背景/圆角/overflow 交给它提供**（`--radius-large`=1rem），组件只写自身特有样式（尺寸、毛玻璃、边框）；只在 scoped 样式里手写 `background: var(--card-bg)` 会游离于整套设置之外。参考实现：`FloatingControls.astro` 阅读进度徽章。

## Discovered durable knowledge
_Cross-task facts that survive across sessions. Promoted from session checkpoints' §7 when proven durable._

- **B 站卡片（`::bilibili`）数据链 = 构建期抓取，浏览器零请求**（2026-10 重构确立，推翻同日更早的浏览器运行时方案）：
  - 根因：uapis.cn 对 `/api/v1/*` 的浏览器**跨域无 Key 调用一律 403 `CORS_FORBIDDEN`**（平台刻意策略，FAQ Q22/Q23），服务端/curl 无 Origin 则正常 200。以后接 uapis 接口给浏览器用先记这条：要么带 Key（`Authorization: Bearer`，会暴露前端）要么构建期/后端转发。
  - 链路：`scripts/generate-bilibili-card-data.ts`（挂 `pnpm build` 链、紧跟 github-card 之后；手动刷新 `pnpm bilibili-cards`）扫 `src/content/**` 的 `::bilibili{uid}` → Node fetch `uapis.cn/api/v1/social/bilibili/userinfo?uid=` → 写 `src/constants/bilibili-card-data.json`（uid → name/face/sign/follower/following/archiveCount，失败保留旧缓存）→ rehype 插件 import JSON 构建期渲染完整 DOM。
  - MD 只写 `::bilibili{uid="353880725"}`，`name/avatar/fans/...` 属性为可选手动兜底；接口无获赞数，第三统计位是 `archive_count`→「视频」。运行时管理器 `BilibiliCardManager.astro` 是废弃中间产物，已删勿复活。
  - **头像必须 `<img referrerpolicy="no-referrer">`，不能 background-image**：B 站头像 CDN（`i*.hdslb.com`）带 Referer 403、无 Referer 200，background-image 设不了 referrerpolicy；http 需 replace 成 https 防混合内容。
  - 样式坑：`.prose` 给正文所有 `img` 加 `margin: 2em 0`（32px）会把头像推出圆框 → `.bc-avatar img { margin: 0 }` 必须覆盖；中层 `.bc-titlebar-left` 要自带 flex（外层 `.bc-header` 的 flex 管不到其内部排列）。
- **Astro content layer 渲染缓存 `.astro/data-store.json`（2026-10 踩大坑）**：按内容文件哈希缓存**渲染后的整页 HTML**，**改插件/组件代码不会失效**——症状"重启 dev 后页面还是旧 DOM"（如卡片无 `uid` 属性、标签还是「获赞」）。解除需组合拳：改 md 触发重渲染 + 删 store + **重启 dev**。**运行中直接删 store 会让进程持失效引用，spec 页全部 500，只能重启恢复，别再犯**。判断 DOM 新旧的快速办法：curl 页面看有无新代码特征串（如 `uid=`、`fetch-waiting`）。
- **dev 对 `astro.config.mjs` import 链（rehype 插件等）不热更新**：改 `src/plugins/*.mjs` 必须重启 dev；改 config 文件本身可触发自动重启但**不可靠**（试过追加注释 PID 不变）。用"进程启动时间 vs 文件 mtime"判断新代码是否加载。Playwright CLI 在本机会话频繁 `ChildProcess.kill` 崩溃，验证改用 **playwright MCP（首选，见 Rules 的验证流程条）** 或 `playwright-core` + `channel:"chrome"`（系统 Chrome、不下载浏览器）+ `domcontentloaded`（dev 长连接让 networkidle 永不满足）。
- **uapis.cn 用量**：访客 1500 积分/月按 IP、4 QPS，`bilibili/userinfo` 每次 4 积分（抓取脚本已加 300ms 间隔）；天气组件 `VisitorInfo.astro` 是浏览器直连 `uapis.cn/api/v1/misc/weather`，若某天天气挂了优先查 403 `CORS_FORBIDDEN`。
- **2026-10-01 已交付形态**：访客信息天气组件（大温度 emoji + 宫格统计卡 + 预警横幅中性配色 `bg-neutral-100/60` + `--primary` 标题）；关于页两张 B 站卡片 uid 化；动态已发 `src/content/dynamic/20261001-1000.md`（记录四个坑）。

### Discovered
- `fcircle.astro` 在特定条件下 `Astro.redirect("/404/")`（友圈访问控制）。
- `pnpm build` 是长链脚本，缺任一生成脚本产物会失败；日常开发用 `pnpm dev` 即可。
- **Swup 页面切换事件真相（2026-09 踩坑，最重要）**：站点是 swup 4.9.2 + `@swup/astro`，其兼容层（产物 `page.js`）把钩子转成 astro 风格事件——`content:replace` 前派发 `astro:before-swap`，`page:view` 派发 `astro:page-load`，**这两个是切页时唯一可靠触发的 DOM 事件**。swup v3 时代的 `swup:contentReplaced` / `swup:willReplaceContent` 在 4.x **从不派发**（4.x 派发的是 `swup:content:replace` 冒号格式）；全站 20+ 处在监听这些死事件（历史遗留），勿模仿也勿据此判断"某事件不生效"。新写切页逻辑一律监听 `astro:before-swap`（换内容前）/ `astro:page-load`（新页就绪后）。曾因误判 `astro:page-load` 是死代码而删除，导致音乐播放器站内切页不初始化。
- `pnpm lint`（biome safe fix）**每次会波及十几个无关文件**（config/i18n/组件被自动格式化），跑完必须 `git status` 核对，把非本次任务的文件 `git checkout --` 回退，避免无关格式化churn（AGENTS.md 要求）。
- `pnpm check` 存量基线：**17 errors / 0 warnings**（`i18n/languages/*` 缺 `siteStatsTotalViews/Visitors` 5 个、`anime.astro` 9 个、`vndb.astro` 1 个、杂项），另有 `12文章/6文章` 构建时 minify 警告（代码示例里的 `<script>` 被误匹配，无害）。验证改动时以"错误数是否仍为 17"为准，勿误判为自己改坏。
- **幽灵 CSS 变量**：AI 生成的旧样式常用 `--text-primary`、`--text-secondary`、`--card-border`、`--avatar-bg` 等**主题里不存在的变量**（真实变量表在 `src/styles/variables.styl`）。表现为"颜色靠继承巧合正常、暗色不跟随"。新增样式先查 `variables.styl` 再用变量。
- 站内"哔哩哔哩"同名功能三处：导航栏**追番页**（`src/pages/bilibili.astro` + `components/pages/bilibili/*`，模板自带）≠ 路由开关（`astro.config.mjs` `/bilibili/` 判断）≠ **MD 卡片** `::bilibili{...}`（`rehype-component-bilibili-card.mjs`，用户功能，用在 `about.md`）。改追番页不要碰卡片插件，反之亦然；两者类名不冲突（追番页 Svelte 不用 `card-bilibili`/`bc-*`）。
- `src/styles/` 下的 CSS 必须被 import 才会进构建管线（`@apply` 同理）；放着没人 import 的 CSS 是死文件，Tailwind 扫描组件模板生成工具类与之无关。
- 三篇组件教程（内容侧）：`3文章.md`（PDF）、`6文章.md`（音乐，含 Swup 事件坑记录）、B 站卡片当年没写教程。重构组件实现后记得同步这三篇文章。
- **逐帧滚动功能的唯一挂载点**：`src/utils/scroll-utils.ts` 的 `scrollFunction()`——rAF 节流、读写分离（同步批量读，class 写入 defer 到嵌套 rAF）、`html.is-page-transitioning` 期间提前 return、`visit:end` 后被 swup 钩子再调一次。新逐帧逻辑（如阅读进度）插在**读阶段**（`scrollTop` 读取之后、任何 class 写入之前），实现"复用同一次布局计算、零额外回流"；不要自己注册 scroll 监听。已知消费方：`reading-progress.ts` 的 `updateReadingProgress()`。
- **自定义 class 名禁用 Tailwind utility 词**：全局 Tailwind v4，`.ring` 是焦点环工具类（`box-shadow: 0 0 0 1px currentColor`）——阅读进度圆环曾因 SVG 写 `class="ring"` 出现橙色直角描边（currentColor=主色、矩形轮廓、紧贴 SVG），且 scoped 样式没写 box-shadow 压不掉它。`grid`/`hidden`/`container`/`group`/`flex` 同雷。组件内自定义类统一加项目前缀（如 `rp-ring`）。
- **阅读进度功能索引**（2026-09 实现，`siteConfig.post.readingProgress` 开关）：核心 `src/utils/reading-progress.ts`；挂载 `scroll-utils.ts`（每帧）+ `layout-init.ts`（初始化）；DOM 在 `Layout.astro`（顶部细条）+ `FloatingControls.astro`（右下圆环徽章，`rp-ring-*` 类）。换页自愈靠 `#post-container` 的 `isConnected`（Swup 替换正文后重查），非文章页靠 `null===null` 短路零成本；进度语义 `p = clamp((innerHeight - rect.top) / rect.height, 0, 1)` 只算正文。**完整设计/复现/排查教程在 `src/content/posts/txt/13文章.md`**（含 Tailwind `.ring` 撞名、`card-base` 挂钩、SVG 半径三处联动等坑），改动此功能时同步更新该文。
- **友圈部署完整教程＝站内文章 `src/content/posts/txt/12文章.md`**（2026-09 实战复盘，两仓库全部代码 diff、平台操作步骤、14 条踩坑排查表都在里面）。动友圈相关代码前先读它；这篇本身也是待发布文章（发不发/何时发由用户决定，勿擅自 push）。
- **友圈运维排查要点**（真实踩过的）：
  - 数据链验证：`curl.exe -sI https://fc.mstzuomu.space/all.json` → 200 + `Access-Control-Allow-Origin: *`；异常先查 `page` 分支上有没有 `vercel.json`、`all.json` 的 `friends_num` 是不是自己的友链数。
  - fork 首次启用有**两道开关**：Actions 页的 "I understand my workflows…" banner + 单个工作流页面的 "Enable workflow"（fork 的 workflow 会停在 `disabled_fork`，只开第一道 dispatch 会报 422）。
  - Vercel 生产分支在 **Settings → Environments → Production → Branch Tracking**（新 UI 没有独立的 "Production Branch" 项，旧教程会指错路）；改之前 `page` 分支必须已存在，否则报 `Branch "page" not found`。
  - fclite 前端有 **10 分钟 localStorage 缓存**，改完数据要无痕窗口验证；友圈统计的「失败」数是友链可达性检测的正常结果，不是部署故障。
  - `mstzuomu.space` 会 301 到真实主机 **`azuma.mstzuomu.space`**（GitHub Pages + Cloudflare 反代，响应自带 `ACAO *`）；blog 的 `deploy.yml` 在 master push 时自动构建部署。
- **本机网络分栈差异（2026-09 实测，做任何外部 API/部署操作前必看）**：
  - 同一域名不同栈结果不同：`curl.exe` 对 github.com / registry.npmjs.org / `*.vercel.app` 常直接 000，而 **node(fetch) 或 python(urllib) 往往通**（如 api.vercel.com node 通、python 超时）；GitHub/Vercel API 还间歇抖动——**一个栈失败就换栈 + 3~5 次重试**，不要过早下"被墙"结论。
  - PyPI 直连超时 → `pip install -i https://pypi.tuna.tsinghua.edu.cn/simple`；npm 装包 → `--registry=https://registry.npmmirror.com`；Windows 本地跑 FCL 爬虫必须补 `tzdata`（否则 `ZoneInfoNotFoundError`）。
  - `*.vercel.app` 被 DNS 污染（114 DNS 返回假 IP），本机和访客都解析不了 → 数据站只能靠自定义域名访问。
  - git 协议不受 API 封锁影响：`git push/ls-remote` 走 GCM 凭据正常可用；GitHub REST 需要 token 时可从 `git credential fill`（host=github.com）静默取用（勿回显内容）。
- **本机构建 OG 图 TLS 失败**：`Failed to render image / UNABLE_TO_VERIFY_LEAF_SIGNATURE` → `set NODE_OPTIONS=--use-system-ca` 后重跑（仅本机证书链问题，GitHub CI 不受影响，勿当成代码 bug 反复排查）。
- **playwright MCP（本项目浏览器自动化首选通道，2026-10-01 已修复可用）**：加载失败根因与 `cmd /c npx` 修复细节记在**全局记忆** `C:\Users\JOKERW\.local\share\mimocode\memory\global\MEMORY.md`（本机级知识，不在本文件重复）；本项目只需记住：截图/测量优先走 MCP 工具（navigate/snapshot/take_screenshot），CLI/Node API 为备选，一律不下载新浏览器。

### Dead ends

