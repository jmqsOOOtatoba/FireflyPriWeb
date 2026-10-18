// 发布台 API 断言测试（需先启动 local-harness.mjs，监听 8788）
// 运行：node publisher/test/api-test.mjs
const BASE = "http://127.0.0.1:8788";
const TOKEN = "test-pass-123";
const results = [];
const assert = (cond, m) => results.push({ pass: !!cond, m });

async function call(
	path,
	{ method = "GET", token = TOKEN, body, query = "" } = {},
) {
	const res = await fetch(`${BASE}${path}${query}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			"x-publish-token": token,
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.status, data };
}

/* 1. 登录鉴权 */
{
	const wrong = await call("/api/auth", { method: "POST", token: "bad" });
	assert(wrong.status === 401, `错误口令 401（实际 ${wrong.status}）`);
	const right = await call("/api/auth", { method: "POST" });
	assert(right.status === 200 && right.data.ok, "正确口令 200");
}

/* 2. 列表 */
let items = [];
{
	const r = await call("/api/articles");
	assert(r.status === 200 && r.data.ok, "列表 200");
	items = r.data.items ?? [];
	assert(items.length === 4, `初始 4 项（实际 ${items.length}）`);
	const t17 = items.find((i) => i.name === "17文章.md");
	assert(t17?.title === "发布后端测试文章", `17 标题解析（${t17?.title}）`);
	assert(t17?.type === "post" && t17?.sha, "17 类型与 sha");
	const dyn = items.find((i) => i.type === "dynamic");
	assert(dyn?.published === "2026-10-03", `动态日期（${dyn?.published}）`);
	assert(
		items.every(
			(i) => i.type !== "post" || i.path.startsWith("src/content/posts/"),
		),
		"路径过滤正确",
	);
}

/* 3. 读取单篇 + 路径安全 */
{
	const r = await call("/api/article", {
		query: `?path=${encodeURIComponent("src/content/posts/txt/17文章.md")}`,
	});
	assert(r.status === 200 && r.data.ok && r.data.sha, "读取 200 带 sha");
	assert(r.data.content.includes("正文B"), "内容正确");

	const bad = await call("/api/article", {
		query: `?path=${encodeURIComponent("../../etc/passwd")}`,
	});
	assert(bad.status === 400, `非法路径 400（实际 ${bad.status}）`);
	const outside = await call("/api/article", {
		query: `?path=${encodeURIComponent("src/config/siteConfig.ts")}`,
	});
	assert(outside.status === 400, `非内容目录 400（实际 ${outside.status}）`);
}

/* 4. 编辑保存（含 sha 冲突） */
let sha17;
{
	const get = await call("/api/article", {
		query: `?path=${encodeURIComponent("src/content/posts/txt/17文章.md")}`,
	});
	sha17 = get.data.sha;
	const save = await call("/api/article", {
		method: "PUT",
		body: {
			path: "src/content/posts/txt/17文章.md",
			content:
				"---\ntitle: 改过的标题\npublished: 2026-10-03\n---\n\n改过的正文",
			sha: sha17,
		},
	});
	assert(save.status === 200 && save.data.ok, "保存 200");
	assert(save.data.sha && save.data.sha !== sha17, "返回新 sha");

	const again = await call("/api/article", {
		method: "PUT",
		body: {
			path: "src/content/posts/txt/17文章.md",
			content: "x",
			sha: sha17, // 旧 sha
		},
	});
	assert(again.status === 409, `旧 sha 冲突 409（实际 ${again.status}）`);

	const list = await call("/api/articles");
	const t17 = list.data.items.find((i) => i.name === "17文章.md");
	assert(t17?.title === "改过的标题", `列表标题已更新（${t17?.title}）`);
}

/* 5. 发布新文章（编号顺延 17 → 18） */
{
	const r = await call("/api/publish", {
		method: "POST",
		body: {
			type: "post",
			title: "吊床发布测试",
			content: "## 内容",
			tags: "测试",
			category: "技术分享",
			author: "左沐",
		},
	});
	assert(r.status === 200 && r.data.ok, `发布 200（${r.data.error ?? ""}）`);
	assert(
		r.data.path === "src/content/posts/txt/18文章.md",
		`编号顺延 18（实际 ${r.data.path}）`,
	);
	const list = await call("/api/articles");
	assert(list.data.items.length === 5, "发布后列表 5 项");
}

/* 6. 发布非法 updated 拒绝 */
{
	const r = await call("/api/publish", {
		method: "POST",
		body: { type: "post", title: "t", content: "c", updated: "2026/10/03" },
	});
	assert(r.status === 400, `非法 updated 400（实际 ${r.status}）`);
}

/* 7. 删除（含校验） */
{
	const get = await call("/api/article", {
		query: `?path=${encodeURIComponent("src/content/posts/txt/18文章.md")}`,
	});
	assert(get.status === 200, "读取新文章");
	const del = await call("/api/article", {
		method: "DELETE",
		body: { path: "src/content/posts/txt/18文章.md", sha: get.data.sha },
	});
	assert(del.status === 200 && del.data.ok, "删除 200");
	const gone = await call("/api/article", {
		query: `?path=${encodeURIComponent("src/content/posts/txt/18文章.md")}`,
	});
	assert(gone.status === 404, `删除后 404（实际 ${gone.status}）`);
	const list = await call("/api/articles");
	assert(list.data.items.length === 4, "删除后列表 4 项");

	const noSha = await call("/api/article", {
		method: "DELETE",
		body: { path: "src/content/posts/txt/17文章.md" },
	});
	assert(noSha.status === 400, `缺 sha 400（实际 ${noSha.status}）`);
}

/* 8. 友链申请：校验 / 蜜罐 / 去重 / 通知邮件 */
{
	const base = {
		title: "新朋友",
		siteurl: "https://new-friend.example",
		imgurl: "https://new-friend.example/avatar.png",
		desc: "一个新朋友的博客",
		tags: ["Blog"],
		email: "applicant@example.com",
		reason: "互换友链",
	};
	const noTitle = await call("/api/friend-apply", {
		method: "POST",
		body: { ...base, title: "" },
	});
	assert(noTitle.status === 400, `缺 title 400（实际 ${noTitle.status}）`);

	const badUrl = await call("/api/friend-apply", {
		method: "POST",
		body: { ...base, siteurl: "ftp://x.example" },
	});
	assert(badUrl.status === 400, `非法 siteurl 400（实际 ${badUrl.status}）`);

	const honeypot = await call("/api/friend-apply", {
		method: "POST",
		body: { ...base, nickname: "bot" },
	});
	assert(honeypot.status === 400, `蜜罐 400（实际 ${honeypot.status}）`);
	assert(
		!honeypot.data.error?.includes("nickname") &&
			!honeypot.data.error?.includes("蜜罐"),
		"蜜罐不暴露原因",
	);

	const tooManyTags = await call("/api/friend-apply", {
		method: "POST",
		body: { ...base, tags: ["a", "b", "c", "d", "e", "f"] },
	});
	assert(
		tooManyTags.status === 400,
		`6 个标签 400（实际 ${tooManyTags.status}）`,
	);

	const ok = await call("/api/friend-apply", { method: "POST", body: base });
	assert(
		ok.status === 200 && ok.data.ok,
		`合法申请 200（${ok.data.error ?? ""}）`,
	);

	const box = await call("/api/__outbox");
	const mails = box.data.mails ?? [];
	const notice = mails.find((m) => m.subject?.includes("[友链申请] 新朋友"));
	assert(!!notice, "通知邮件已生成");
	assert(
		notice?.to === "owner@test.local" &&
			notice?.text?.includes("确认通过：https://pub.mstzuomu.space") &&
			notice?.text?.includes("确认拒绝："),
		"通知邮件含通过/拒绝链接",
	);

	const dup = await call("/api/friend-apply", {
		method: "POST",
		body: { ...base, siteurl: "https://new-friend.example/" }, // 尾斜杠应被规范化后判重
	});
	assert(dup.status === 409, `重复申请 409（实际 ${dup.status}）`);

	const existing = await call("/api/friend-apply", {
		method: "POST",
		body: { ...base, siteurl: "https://existing.example" },
	});
	assert(existing.status === 409, `已存在友链 409（实际 ${existing.status}）`);
}

/* 9. friend-decide：验签 + 确认中转页 */
let approveToken = "";
{
	const forged = await fetch(
		`${BASE}/api/friend-decide?token=eyJ2IjoxfQ.deadbeef`,
	);
	assert(forged.status === 400, `伪造 token GET 400（实际 ${forged.status}）`);
	const forgedHtml = await forged.text();
	assert(
		forgedHtml.includes("无法处理该链接") && forgedHtml.includes("<html"),
		"验签失败返回错误 HTML",
	);

	const box = await call("/api/__outbox");
	const notice = box.data.mails.find((m) =>
		m.subject?.includes("[友链申请] 新朋友"),
	);
	const tokens = [
		...notice.text.matchAll(/friend-decide\?token=([\w-]+\.[\w-]+)/g),
	].map((m) => m[1]);
	assert(tokens.length === 2, `通知邮件含两个 token（实际 ${tokens.length}）`);
	approveToken = tokens[0];

	const page = await fetch(
		`${BASE}/api/friend-decide?token=${encodeURIComponent(approveToken)}`,
	);
	const pageHtml = await page.text();
	assert(page.status === 200, `有效 token GET 200（实际 ${page.status}）`);
	assert(
		pageHtml.includes("确认通过") && pageHtml.includes("新朋友"),
		"确认页显示摘要与按钮",
	);
	assert(!pageHtml.includes('id="reason"'), "通过确认页不含拒绝理由输入框");
	assert(
		pageHtml.includes('fetch("/api/friend-decide"') &&
			!pageHtml.includes("src="),
		"确认页同源 fetch 且无外部资源",
	);

	const badPost = await call("/api/friend-decide", {
		method: "POST",
		body: { token: "bad.token" },
	});
	assert(
		badPost.status === 400,
		`伪造 token POST 400（实际 ${badPost.status}）`,
	);
}

/* 10. approve：写入 friendsConfig.ts 并防重复执行 */
{
	const r = await call("/api/friend-decide", {
		method: "POST",
		body: { token: approveToken },
	});
	assert(r.status === 200 && r.data.ok, `approve 200（${r.data.error ?? ""}）`);

	const file = await call("/api/__file", {
		query: `?path=${encodeURIComponent("src/config/friendsConfig.ts")}`,
	});
	const content = file.data.content ?? "";
	assert(content.includes('title: "新朋友"'), "配置中已写入新标题");
	assert(
		content.includes('siteurl: "https://new-friend.example"') &&
			content.includes("weight: 1") &&
			content.includes("enabled: true"),
		"新条目字段完整",
	);
	const entryPos = content.indexOf('title: "新朋友"');
	const anchorPos = content.indexOf("/* friend-autogen-insert-above */");
	assert(entryPos > -1 && anchorPos > entryPos, "新条目插在锚点上一行");

	const again = await call("/api/friend-decide", {
		method: "POST",
		body: { token: approveToken },
	});
	assert(
		again.status === 200 && again.data.result?.includes("已存在"),
		`重复 approve 不重复插入（${again.data.result ?? again.data.error}）`,
	);

	const applicantMail = (await call("/api/__outbox")).data.mails.find(
		(m) => m.to === "applicant@example.com" && m.subject?.includes("已通过"),
	);
	assert(!!applicantMail, "申请人收到通过邮件");
}

/* 11. reject：婉拒邮件 */
{
	const second = await call("/api/friend-apply", {
		method: "POST",
		body: {
			title: "落选站",
			siteurl: "https://reject-friend.example",
			imgurl: "https://reject-friend.example/a.png",
			desc: "会被拒绝的站",
			email: "rejected@example.com",
		},
	});
	assert(second.status === 200, "第二份申请 200");

	const box = await call("/api/__outbox");
	const notice = [...box.data.mails]
		.reverse()
		.find((m) => m.subject?.includes("[友链申请] 落选站"));
	const tokens = [
		...notice.text.matchAll(/friend-decide\?token=([\w-]+\.[\w-]+)/g),
	].map((m) => m[1]);

	const rejPage = await fetch(
		`${BASE}/api/friend-decide?token=${encodeURIComponent(tokens[1])}`,
	);
	const rejPageHtml = await rejPage.text();
	assert(rejPageHtml.includes("拒绝理由"), "拒绝确认页含理由输入框");

	const rej = await call("/api/friend-decide", {
		method: "POST",
		body: { token: tokens[1], reason: "测试拒绝理由XYZ" }, // 第二条链接 = reject
	});
	assert(
		rej.status === 200 && rej.data.ok,
		`reject 200（${rej.data.error ?? ""}）`,
	);
	assert(rej.data.result?.includes("拒绝"), "reject 返回明确结果");

	const polite = (await call("/api/__outbox")).data.mails.find(
		(m) => m.to === "rejected@example.com" && m.subject?.includes("落选站"),
	);
	assert(!!polite && polite.text.includes("未能通过"), "申请人收到婉拒邮件");
	assert(
		polite?.text.includes("测试拒绝理由XYZ"),
		"婉拒邮件包含站长填写的拒绝理由",
	);

	const file = await call("/api/__file", {
		query: `?path=${encodeURIComponent("src/config/friendsConfig.ts")}`,
	});
	assert(
		!file.data.content.includes("reject-friend.example"),
		"reject 未写入配置",
	);
}

let fail = 0;
for (const r of results) {
	if (!r.pass) fail++;
	console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.m}`);
}
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
