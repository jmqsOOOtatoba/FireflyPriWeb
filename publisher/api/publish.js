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

	// post / update
	lines.push(`title: ${yamlStr(fields.title)}`);
	lines.push(`published: ${now.date}`);
	if (type === "update") {
		lines.push(
			`tags: ${JSON.stringify(fields.tags?.length ? fields.tags : ["更新公告"])}`,
		);
		lines.push(`category: ${yamlStr(fields.category || "更新日志")}`);
		lines.push(`description: ${yamlStr(fields.description || "网站更新公告")}`);
	} else {
		if (fields.tags?.length) lines.push(`tags: ${JSON.stringify(fields.tags)}`);
		if (fields.category) lines.push(`category: ${yamlStr(fields.category)}`);
		if (fields.description)
			lines.push(`description: ${yamlStr(fields.description)}`);
	}
	lines.push(`author: ${yamlStr(fields.author || "左沐")}`);
	lines.push("draft: false");
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

	const fields = {
		title: finalTitle,
		description: String(body.description ?? "").trim(),
		category: String(body.category ?? "").trim(),
		author: String(body.author ?? "").trim(),
		location: String(body.location ?? "").trim(),
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
