/* GET/POST /api/friend-decide：友链申请审核
 * GET 只渲染确认中转页（防邮件扫描器误触）；POST 才真正执行 approve / reject。 */

import {
	applyCors,
	buildApplicantMail,
	extractSiteurls,
	FRIEND_ANCHOR,
	FRIENDS_CONFIG_PATH,
	friendEnv,
	insertFriendEntry,
	normalizeSite,
	verifyToken,
} from "../lib/friends.js";
import { sendMail } from "../lib/mail.js";
import {
	BRANCH,
	encodeRepoPath,
	githubFetch,
	json,
	REPO,
} from "../lib/shared.js";

function html(res, status, out) {
	res.statusCode = status;
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.end(out);
}

function h(s) {
	return String(s ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function errorPage(message) {
	return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>无法处理该链接</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans SC",sans-serif;background:#f5f4f1;color:#333;display:flex;min-height:100vh;align-items:center;justify-content:center}
.card{max-width:28rem;margin:1rem;padding:2rem;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
h1{margin:0 0 .75rem;font-size:1.25rem}
p{margin:.5rem 0;line-height:1.7;color:#555}
</style>
</head>
<body>
<main class="card">
<h1>无法处理该链接</h1>
<p>${h(message)}</p>
<p>请回到申请页面重新提交一次友链申请，并使用最新的邮件链接。</p>
</main>
</body>
</html>
`;
}

function confirmPage(token, payload) {
	const { action, data } = payload;
	const isApprove = action === "approve";
	const title = isApprove ? "确认通过" : "确认拒绝";
	const rows = [
		["标题", data.title],
		["站点", data.siteurl],
		["头像", data.imgurl],
		["简介", data.desc],
		["标签", data.tags?.length ? data.tags.join("、") : "—"],
		["邮箱", data.email || "—"],
		["理由", data.reason || "—"],
	];
	const rowsHtml = rows
		.map(([k, v]) => `<dt>${h(k)}</dt><dd>${h(v)}</dd>`)
		.join("");
	return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>友链申请处理</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans SC",sans-serif;background:#f5f4f1;color:#333}
.card{max-width:32rem;margin:2rem auto;padding:2rem;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
h1{margin:0 0 .5rem;font-size:1.25rem}
.hint{margin:0 0 1.25rem;color:#777;font-size:.9rem;line-height:1.6}
dl{display:grid;grid-template-columns:4rem 1fr;gap:.5rem 1rem;margin:0 0 1.5rem;font-size:.95rem}
dt{color:#888}
dd{margin:0;word-break:break-all;line-height:1.6}
button{appearance:none;border:0;border-radius:8px;padding:.7rem 1.4rem;font-size:1rem;color:#fff;background:${isApprove ? "#2f7d4f" : "#a33b3b"};cursor:pointer}
button:disabled{opacity:.55;cursor:wait}
#out{margin-top:1rem;padding:.9rem 1rem;background:#faf9f7;border-radius:8px;white-space:pre-wrap;line-height:1.7;font-size:.9rem;min-height:1.2rem}
</style>
</head>
<body>
<main class="card">
<h1>友链申请处理</h1>
<p class="hint">以下是申请人提交的信息，请核对后点击按钮。此页面需手动确认，点击前不会执行任何操作。</p>
<dl>${rowsHtml}</dl>
<button id="btn" type="button">${title}</button>
<pre id="out"></pre>
</main>
<script>
const token = ${JSON.stringify(token)};
const btn = document.getElementById("btn");
const out = document.getElementById("out");
btn.addEventListener("click", async () => {
	btn.disabled = true;
	out.textContent = "处理中……";
	try {
		const res = await fetch("/api/friend-decide", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token }),
		});
		const data = await res.json().catch(() => ({}));
		out.textContent = data.ok
			? "结果：" + (data.result || "已完成")
			: "失败：" + (data.error || "未知错误");
	} catch (err) {
		out.textContent = "请求失败：" + err.message;
	} finally {
		btn.disabled = true;
	}
});
</script>
</body>
</html>
`;
}

function getToken(req) {
	if (req.query?.token) return String(req.query.token);
	try {
		return new URL(req.url, "http://localhost").searchParams.get("token") || "";
	} catch {
		return "";
	}
}

async function handleApprove(payload, res) {
	const data = payload.data;
	const { githubToken } = friendEnv();
	if (!githubToken) {
		json(res, 500, {
			ok: false,
			error: "服务端未配置 GITHUB_TOKEN 环境变量",
		});
		return;
	}

	const read = await githubFetch(
		"GET",
		`/repos/${REPO}/contents/${encodeRepoPath(FRIENDS_CONFIG_PATH)}?ref=${BRANCH}`,
		githubToken,
	);
	if (!read.ok || Array.isArray(read.data)) {
		json(res, read.status >= 400 && read.status < 500 ? read.status : 502, {
			ok: false,
			error: `读取 friendsConfig.ts 失败（HTTP ${read.status}）：${
				read.data?.message || "unknown"
			}`,
		});
		return;
	}

	const content = Buffer.from(read.data.content ?? "", "base64").toString(
		"utf8",
	);
	const norm = normalizeSite(data.siteurl);
	if (extractSiteurls(content).includes(norm)) {
		json(res, 200, {
			ok: true,
			result: "该站点已存在于友链配置，未重复插入",
		});
		return;
	}

	const next = insertFriendEntry(content, data);
	if (next === null) {
		json(res, 500, {
			ok: false,
			error: `friendsConfig.ts 中未找到锚点注释 ${FRIEND_ANCHOR}，无法插入（请确认前端已在数组末尾添加锚点）`,
		});
		return;
	}

	const write = await githubFetch(
		"PUT",
		`/repos/${REPO}/contents/${encodeRepoPath(FRIENDS_CONFIG_PATH)}`,
		githubToken,
		{
			message: `feat(friends): add friend link ${data.title}`,
			content: Buffer.from(next, "utf8").toString("base64"),
			sha: read.data.sha,
			branch: BRANCH,
		},
	);
	if (!write.ok) {
		json(res, write.status >= 400 && write.status < 500 ? write.status : 502, {
			ok: false,
			error: `提交到 master 失败（HTTP ${write.status}）：${
				write.data?.message || "unknown"
			}`,
		});
		return;
	}

	if (data.email) {
		const mail = buildApplicantMail("approve", data);
		try {
			await sendMail({
				to: data.email,
				subject: mail.subject,
				text: mail.text,
			});
		} catch (err) {
			console.error(
				"[friend-decide] 通过通知邮件发送失败：",
				err?.message || err,
			);
		}
	}

	json(res, 200, {
		ok: true,
		result: `已通过并提交 master（${data.title}），构建约 3~5 分钟后生效`,
	});
}

async function handleReject(payload, res) {
	const data = payload.data;
	if (data.email) {
		const mail = buildApplicantMail("reject", data);
		try {
			await sendMail({
				to: data.email,
				subject: mail.subject,
				text: mail.text,
			});
		} catch (err) {
			console.error("[friend-decide] 婉拒邮件发送失败：", err?.message || err);
		}
	}
	json(res, 200, { ok: true, result: "已拒绝该友链申请" });
}

export default async function handler(req, res) {
	applyCors(req, res);
	if (req.method === "OPTIONS") {
		res.statusCode = 204;
		res.end();
		return;
	}
	const { secret } = friendEnv();

	if (req.method === "GET") {
		const r = verifyToken(getToken(req), secret);
		if (r.error) {
			html(res, 400, errorPage(r.error));
			return;
		}
		html(res, 200, confirmPage(getToken(req), r.payload));
		return;
	}

	if (req.method === "POST") {
		let body = req.body;
		if (typeof body === "string") {
			try {
				body = JSON.parse(body);
			} catch {
				json(res, 400, { ok: false, error: "请求体不是合法 JSON" });
				return;
			}
		}
		const r = verifyToken(String(body?.token ?? ""), secret);
		if (r.error) {
			json(res, 400, { ok: false, error: r.error });
			return;
		}
		if (r.payload.action === "approve") {
			await handleApprove(r.payload, res);
		} else {
			await handleReject(r.payload, res);
		}
		return;
	}

	res.statusCode = 405;
	res.setHeader("Allow", "GET, POST, OPTIONS");
	res.end("Method Not Allowed");
}
