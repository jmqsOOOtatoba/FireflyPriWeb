/* 友链自助申请共享逻辑：环境变量、校验、审核 token、CORS、friendsConfig 插入 */

import crypto from "node:crypto";
import { BRANCH, REPO, safeEqual } from "./shared.js";

export const FRIENDS_CONFIG_PATH = "src/config/friendsConfig.ts";
export const FRIEND_ANCHOR = "/* friend-autogen-insert-above */";
export const PUB_ORIGIN = "https://pub.mstzuomu.space";
export const CORS_ORIGINS = [
	"https://azuma.mstzuomu.space",
	"http://localhost:4321",
];
const TOKEN_TTL_SECONDS = 30 * 24 * 3600;

/** 环境变量集中读取（请求时取值，便于本地测试覆盖） */
export function friendEnv() {
	return {
		secret: process.env.FRIEND_SECRET || "",
		notifyEmail: process.env.NOTIFY_EMAIL || "",
		githubToken: process.env.GITHUB_TOKEN || "",
		smtp: {
			host: process.env.SMTP_HOST || "",
			port: Number(process.env.SMTP_PORT || "") || 0,
			user: process.env.SMTP_USER || "",
			pass: process.env.SMTP_PASS || "",
		},
	};
}

/* ---------- CORS ---------- */

export function applyCors(req, res) {
	const origin = req.headers.origin;
	if (origin && CORS_ORIGINS.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Vary", "Origin");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");
		res.setHeader("Access-Control-Max-Age", "86400");
	}
}

/* ---------- 校验 ---------- */

function isHttpUrl(v) {
	try {
		const u = new URL(v);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateApply(body) {
	const b = body && typeof body === "object" ? body : {};

	// 蜜罐：非空直接拒绝，不暴露具体原因
	const nickname = b.nickname == null ? "" : String(b.nickname).trim();
	if (nickname) return { ok: false, error: "请求参数不合法" };

	const title = String(b.title ?? "").trim();
	if (!title) return { ok: false, error: "站点标题不能为空" };
	if ([...title].length > 50)
		return { ok: false, error: "站点标题不能超过 50 字符" };

	const siteurl = String(b.siteurl ?? "").trim();
	if (!isHttpUrl(siteurl))
		return { ok: false, error: "站点链接必须是 http/https 格式的 URL" };

	const imgurl = String(b.imgurl ?? "").trim();
	if (!isHttpUrl(imgurl))
		return { ok: false, error: "头像链接必须是 http/https 格式的 URL" };

	const desc = String(b.desc ?? "").trim();
	if (!desc) return { ok: false, error: "站点简介不能为空" };
	if ([...desc].length > 100)
		return { ok: false, error: "站点简介不能超过 100 字符" };

	let tags = [];
	if (b.tags !== undefined && b.tags !== null) {
		if (!Array.isArray(b.tags))
			return { ok: false, error: "tags 必须是字符串数组" };
		tags = b.tags.map((t) => String(t).trim()).filter(Boolean);
		if (tags.length > 5) return { ok: false, error: "标签最多 5 个" };
		if (tags.some((t) => [...t].length > 20))
			return { ok: false, error: "单个标签不能超过 20 字符" };
	}

	const email = String(b.email ?? "").trim();
	if (email && !EMAIL_RE.test(email))
		return { ok: false, error: "邮箱格式不正确" };

	const reason = String(b.reason ?? "").trim();
	if ([...reason].length > 200)
		return { ok: false, error: "申请理由不能超过 200 字符" };

	const data = { title, siteurl, imgurl, desc };
	if (tags.length) data.tags = tags;
	if (email) data.email = email;
	if (reason) data.reason = reason;
	return { ok: true, data };
}

/** 站点 URL 规范化：host 小写、去尾斜杠、去 hash（用于去重比较） */
export function normalizeSite(url) {
	try {
		const u = new URL(String(url).trim());
		const path = u.pathname.replace(/\/+$/, "");
		return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`;
	} catch {
		return "";
	}
}

/* ---------- 审核 token：base64url(payload) + "." + HMAC-SHA256 hex ---------- */

export function signToken(payload, secret) {
	const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
		"base64url",
	);
	const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
	return `${body}.${sig}`;
}

export function verifyToken(token, secret) {
	if (!secret) return { error: "服务端未配置 FRIEND_SECRET 环境变量" };
	if (typeof token !== "string" || !token) return { error: "缺少 token" };
	const dot = token.lastIndexOf(".");
	if (dot <= 0) return { error: "链接无效" };
	const body = token.slice(0, dot);
	const sig = token.slice(dot + 1);
	const expected = crypto
		.createHmac("sha256", secret)
		.update(body)
		.digest("hex");
	if (!safeEqual(sig, expected)) return { error: "签名校验失败" };
	let payload;
	try {
		payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
	} catch {
		return { error: "链接内容无法解析" };
	}
	if (payload?.v !== 1) return { error: "链接版本不匹配" };
	if (payload.action !== "approve" && payload.action !== "reject")
		return { error: "链接用途不正确" };
	if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now())
		return { error: "链接已过期，请重新提交申请" };
	if (!payload.data || typeof payload.data !== "object")
		return { error: "链接缺少申请数据" };
	return { payload };
}

export function makeToken(secret, action, data) {
	const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
	return signToken({ v: 1, action, exp, data }, secret);
}

/* ---------- friendsConfig.ts 读取与去重 ---------- */

/** 拉取仓库中的友链配置原文；失败返回 null（调用方跳过检查，不阻断） */
export async function fetchFriendsConfigText() {
	try {
		const res = await fetch(
			`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FRIENDS_CONFIG_PATH}`,
			{ signal: AbortSignal.timeout(5000) },
		);
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

export function extractSiteurls(text) {
	const out = [];
	for (const m of String(text).matchAll(/siteurl:\s*"([^"]+)"/g)) {
		const n = normalizeSite(m[1]);
		if (n) out.push(n);
	}
	return out;
}

/* ---------- 插入新条目（锚点上一行） ---------- */

function fieldLine(indent, key, value, eol) {
	const line = `${indent}\t${key}: ${value}`;
	return [...line].length <= 80
		? `${line},${eol}`
		: `${indent}\t${key}:${eol}${indent}\t\t${value},${eol}`;
}

export function formatFriendEntry(data, indent = "\t", eol = "\n") {
	let s = `${indent}{${eol}`;
	s += fieldLine(indent, "title", JSON.stringify(data.title), eol);
	s += fieldLine(indent, "imgurl", JSON.stringify(data.imgurl), eol);
	s += fieldLine(indent, "desc", JSON.stringify(data.desc), eol);
	s += fieldLine(indent, "siteurl", JSON.stringify(data.siteurl), eol);
	if (data.tags?.length)
		s += fieldLine(indent, "tags", JSON.stringify(data.tags), eol);
	s += `${indent}\tweight: 1,${eol}`;
	s += `${indent}\tenabled: true,${eol}`;
	s += `${indent}},${eol}`;
	return s;
}

/** 在锚点注释行上一行插入条目；找不到锚点返回 null */
export function insertFriendEntry(content, data) {
	const idx = String(content).indexOf(FRIEND_ANCHOR);
	if (idx === -1) return null;
	const lineStart = content.lastIndexOf("\n", idx) + 1;
	const lineEnd = content.indexOf("\n", idx);
	const anchorLine = content.slice(
		lineStart,
		lineEnd === -1 ? undefined : lineEnd,
	);
	const indent = /^[ \t]*/.exec(anchorLine)[0];
	const eol = content.includes("\r\n") ? "\r\n" : "\n";
	return (
		content.slice(0, lineStart) +
		formatFriendEntry(data, indent, eol) +
		content.slice(lineStart)
	);
}

/* ---------- 邮件文案（中文） ---------- */

export function buildNotifyEmail(data, approveUrl, rejectUrl) {
	const lines = [
		"收到一条新的友链申请，请点击对应链接处理（30 天内有效，请勿转发）：",
		"",
		`标题：${data.title}`,
		`站点：${data.siteurl}`,
		`头像：${data.imgurl}`,
		`简介：${data.desc}`,
	];
	if (data.tags?.length) lines.push(`标签：${data.tags.join("、")}`);
	if (data.email) lines.push(`邮箱：${data.email}`);
	if (data.reason) lines.push(`理由：${data.reason}`);
	lines.push("", `确认通过：${approveUrl}`, `确认拒绝：${rejectUrl}`);
	return lines.join("\n");
}

export function buildApplicantMail(action, data, customText) {
	const subject =
		action === "approve"
			? `【友链申请】「${data.title}」已通过`
			: `【友链申请】关于「${data.title}」的申请结果`;
	const custom =
		typeof customText === "string" ? customText.trim().slice(0, 4000) : "";
	if (custom) return { subject, text: custom };
	const lines =
		action === "approve"
			? [
					"你好：",
					"",
					`你在 ${data.siteurl} 提交的友链申请已通过审核，已加入友链列表并推送上线。`,
					"博客构建完成后（约 3~5 分钟）即可看到，欢迎互换友链。",
					"",
					"—— 左沐",
				]
			: [
					"你好：",
					"",
					"感谢你申请友链。很遗憾这次未能通过审核，具体原因就不逐一说明了，还请理解。",
					"",
					"—— 左沐",
				];
	return { subject, text: lines.join("\n") };
}
