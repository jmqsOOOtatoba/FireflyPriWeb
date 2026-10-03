import crypto from "node:crypto";

const REPO = process.env.GITHUB_REPO || "jmqsOOOtatoba/FireflyPriWeb";
const BRANCH = process.env.GITHUB_BRANCH || "master";
const GITHUB_API = "https://api.github.com";

/* ---------- 时间：一律用 Asia/Shanghai，避免 serverless UTC 偏移 ---------- */

function shanghaiNow() {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(new Date());
	const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
	const y = get("year");
	const mo = get("month");
	const d = get("day");
	const h = get("hour") === "24" ? "00" : get("hour");
	const mi = get("minute");
	const s = get("second");
	return {
		date: `${y}-${mo}-${d}`, // 2026-10-05（文章 published）
		dateStamp: `${y}${mo}${d}`, // 20261005（公告文件名）
		time: `${h}:${mi}`, // 12:30（动态文件名）
		timeStamp: `${h}${mi}`, // 1230
		datetime: `${y}-${mo}-${d} ${h}:${mi}:${s}`, // 动态 published
	};
}

/* ---------- 工具 ---------- */

function safeEqual(a, b) {
	const ab = Buffer.from(String(a ?? ""), "utf8");
	const bb = Buffer.from(String(b ?? ""), "utf8");
	if (ab.length !== bb.length) return false;
	return crypto.timingSafeEqual(ab, bb);
}

function yamlStr(value) {
	return JSON.stringify(String(value));
}

function githubHeaders(token) {
	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "firefly-publisher",
	};
}

function encodeRepoPath(path) {
	return path.split("/").map(encodeURIComponent).join("/");
}

async function githubFetch(method, apiPath, token, body) {
	const res = await fetch(`${GITHUB_API}${apiPath}`, {
		method,
		headers: {
			...githubHeaders(token),
			...(body ? { "Content-Type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	return { status: res.status, ok: res.ok, data };
}

/* ---------- frontmatter 拼装（字段对齐 src/content.config.ts 的 schema） ---------- */

function buildFrontmatter(type, fields, now) {
	const lines = ["---"];

	if (type === "dynamic") {
		lines.push(`published: ${now.datetime}`);
		if (fields.location) lines.push(`location: ${yamlStr(fields.location)}`);
		if (fields.pinned) lines.push("pinned: true");
		lines.push("---");
		return `${lines.join("\n")}\n`;
	}

	// post / update —— 字段顺序与博客文章文档一致，留空一律不写
	lines.push(`title: ${yamlStr(fields.title)}`);
	lines.push(`published: ${now.date}`);
	if (fields.updated) lines.push(`updated: ${fields.updated}`);
	if (fields.description)
		lines.push(`description: ${yamlStr(fields.description)}`);
	if (fields.image) lines.push(`image: ${yamlStr(fields.image)}`);
	if (fields.tags?.length) lines.push(`tags: ${JSON.stringify(fields.tags)}`);
	if (fields.category) lines.push(`category: ${yamlStr(fields.category)}`);
	if (fields.draft) lines.push("draft: true");
	if (fields.pinned) lines.push("pinned: true");
	if (fields.slug) lines.push(`slug: ${yamlStr(fields.slug)}`);
	if (fields.lang) lines.push(`lang: ${yamlStr(fields.lang)}`);
	if (fields.author) lines.push(`author: ${yamlStr(fields.author)}`);
	if (fields.comment !== null) lines.push(`comment: ${fields.comment}`);
	if (fields.licenseName)
		lines.push(`licenseName: ${yamlStr(fields.licenseName)}`);
	if (fields.licenseUrl)
		lines.push(`licenseUrl: ${yamlStr(fields.licenseUrl)}`);
	if (fields.sourceLink)
		lines.push(`sourceLink: ${yamlStr(fields.sourceLink)}`);
	if (fields.password) lines.push(`password: ${yamlStr(fields.password)}`);
	if (fields.passwordHint)
		lines.push(`passwordHint: ${yamlStr(fields.passwordHint)}`);
	if (fields.series) lines.push(`series: ${yamlStr(fields.series)}`);
	if (fields.seriesOrder !== null && fields.seriesOrder !== undefined)
		lines.push(`seriesOrder: ${fields.seriesOrder}`);
	lines.push("---");
	return `${lines.join("\n")}\n`;
}

/* ---------- 路径生成（遵循项目创作路径约定） ---------- */

async function listDir(dir, token) {
	const { status, ok, data } = await githubFetch(
		"GET",
		`/repos/${REPO}/contents/${encodeRepoPath(dir)}?ref=${BRANCH}`,
		token,
	);
	if (!ok) {
		const err = new Error(
			status === 404
				? `仓库目录不存在：${dir}`
				: `GitHub 列目录失败（HTTP ${status}）：${data.message || "unknown"}`,
		);
		err.status = status;
		throw err;
	}
	return Array.isArray(data) ? data : [];
}

async function resolvePostPath(token) {
	const dir = "src/content/posts/txt";
	const entries = await listDir(dir, token);
	let max = 0;
	for (const e of entries) {
		const m = /^(\d+)文章\.mdx?$/.exec(e.name);
		if (m) max = Math.max(max, Number(m[1]));
	}
	return `${dir}/${max + 1}文章.md`;
}

async function uniquePath(basePath, token) {
	// basePath 形如 ".../更新公告20261005.md"；冲突时插序号 -2、-3
	const dot = basePath.lastIndexOf(".");
	const stem = basePath.slice(0, dot);
	const ext = basePath.slice(dot);
	for (let n = 1; n <= 99; n++) {
		const candidate = n === 1 ? basePath : `${stem}-${n}${ext}`;
		const { status, ok } = await githubFetch(
			"GET",
			`/repos/${REPO}/contents/${encodeRepoPath(candidate)}?ref=${BRANCH}`,
			token,
		);
		if (status === 404) return candidate;
		if (!ok) {
			const err = new Error(`GitHub 查文件失败（HTTP ${status}）`);
			err.status = status;
			throw err;
		}
	}
	throw new Error("同名文件冲突过多，停止发布");
}

async function resolvePath(type, token, now) {
	if (type === "post") return resolvePostPath(token);
	if (type === "update") {
		return uniquePath(
			`src/content/posts/update/更新公告${now.dateStamp}.md`,
			token,
		);
	}
	return uniquePath(
		`src/content/dynamic/${now.dateStamp}-${now.timeStamp}.md`,
		token,
	);
}

/* ---------- 提交 ---------- */

async function createFile(path, content, message, token) {
	const { status, ok, data } = await githubFetch(
		"PUT",
		`/repos/${REPO}/contents/${encodeRepoPath(path)}`,
		token,
		{
			message,
			content: Buffer.from(content, "utf8").toString("base64"),
			branch: BRANCH,
		},
	);
	if (!ok) {
		const err = new Error(
			`GitHub 提交失败（HTTP ${status}）：${data.message || "unknown"}`,
		);
		err.status = status;
		throw err;
	}
	return data;
}

/* ---------- handler ---------- */

function badRequest(res, message) {
	res.statusCode = 400;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.end(JSON.stringify({ ok: false, error: message }));
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.statusCode = 405;
		res.setHeader("Allow", "POST");
		res.end("Method Not Allowed");
		return;
	}

	const publishToken = process.env.PUBLISH_TOKEN;
	const githubToken = process.env.GITHUB_TOKEN;
	if (!publishToken || !githubToken) {
		res.statusCode = 500;
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.end(
			JSON.stringify({
				ok: false,
				error: "服务端未配置 PUBLISH_TOKEN / GITHUB_TOKEN 环境变量",
			}),
		);
		return;
	}

	const provided = req.headers["x-publish-token"];
	if (!safeEqual(provided, publishToken)) {
		res.statusCode = 401;
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.end(JSON.stringify({ ok: false, error: "口令错误" }));
		return;
	}

	let body;
	try {
		body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
	} catch {
		badRequest(res, "请求体不是合法 JSON");
		return;
	}
	body = body || {};

	const type = body.type;
	if (!["post", "update", "dynamic"].includes(type)) {
		badRequest(res, "type 必须是 post / update / dynamic 之一");
		return;
	}
	const content = String(body.content ?? "").trim();
	if (!content) {
		badRequest(res, "正文内容不能为空");
		return;
	}
	const title = String(body.title ?? "").trim();
	if (type === "post" && !title) {
		badRequest(res, "标题不能为空");
		return;
	}
	const now = shanghaiNow();
	const finalTitle =
		type === "update" ? title || `更新公告${now.dateStamp}` : title;

	const tags = Array.isArray(body.tags)
		? body.tags.map((t) => String(t).trim()).filter(Boolean)
		: String(body.tags ?? "")
				.split(/[,，]/)
				.map((t) => t.trim())
				.filter(Boolean);

	// updated 必须是 YYYY-MM-DD（原样写入 frontmatter，需 yaml 可解析为日期）
	const updated = String(body.updated ?? "").trim();
	if (updated && !/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
		badRequest(res, "updated 必须是 YYYY-MM-DD 格式的日期");
		return;
	}
	// seriesOrder 留空不写；填写则必须是数字
	const seriesOrderRaw = String(body.seriesOrder ?? "").trim();
	const seriesOrder = seriesOrderRaw === "" ? null : Number(seriesOrderRaw);
	if (seriesOrder !== null && !Number.isFinite(seriesOrder)) {
		badRequest(res, "seriesOrder 必须是数字");
		return;
	}
	const str = (v) => String(v ?? "").trim();

	const fields = {
		title: finalTitle,
		updated,
		description: str(body.description),
		image: str(body.image),
		category: str(body.category),
		slug: str(body.slug),
		lang: str(body.lang),
		author: str(body.author),
		licenseName: str(body.licenseName),
		licenseUrl: str(body.licenseUrl),
		sourceLink: str(body.sourceLink),
		password: str(body.password),
		passwordHint: str(body.passwordHint),
		series: str(body.series),
		seriesOrder,
		comment:
			body.comment === "true" ? true : body.comment === "false" ? false : null,
		location: str(body.location),
		draft: Boolean(body.draft),
		pinned: Boolean(body.pinned),
		tags,
	};

	try {
		const path = await resolvePath(type, githubToken, now);
		const markdown = `${buildFrontmatter(type, fields, now)}\n${content}\n`;
		const message =
			type === "post"
				? `post: ${finalTitle}`
				: type === "update"
					? `update: ${finalTitle}`
					: `dynamic: ${now.dateStamp}-${now.timeStamp}`;
		await createFile(path, markdown, message, githubToken);

		res.statusCode = 200;
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.end(
			JSON.stringify({
				ok: true,
				path,
				message: `已提交到 master（${path}），自动构建部署约 3~5 分钟后生效`,
			}),
		);
	} catch (err) {
		res.statusCode =
			err.status && err.status >= 400 && err.status < 500 ? err.status : 502;
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.end(JSON.stringify({ ok: false, error: err.message || "发布失败" }));
	}
}

// 便于本地单测引用（Vercel 忽略额外导出）
export { buildFrontmatter, resolvePostPath, shanghaiNow, uniquePath };
