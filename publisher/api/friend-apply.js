/* POST /api/friend-apply：公开的友链申请端点（不走 Basic Auth / PUBLISH_TOKEN） */

import {
	applyCors,
	buildNotifyEmail,
	extractSiteurls,
	fetchFriendsConfigText,
	friendEnv,
	makeToken,
	normalizeSite,
	PUB_ORIGIN,
	validateApply,
} from "../lib/friends.js";
import { sendMail } from "../lib/mail.js";
import { json } from "../lib/shared.js";

/** 单实例内存去重（serverless 每实例独立，够挡住短时间重复提交） */
const seenSites = new Set();

export default async function handler(req, res) {
	applyCors(req, res);
	if (req.method === "OPTIONS") {
		res.statusCode = 204;
		res.end();
		return;
	}
	if (req.method !== "POST") {
		res.statusCode = 405;
		res.setHeader("Allow", "POST, OPTIONS");
		res.end("Method Not Allowed");
		return;
	}

	let body = req.body;
	if (typeof body === "string") {
		try {
			body = JSON.parse(body);
		} catch {
			json(res, 400, { ok: false, error: "请求体不是合法 JSON" });
			return;
		}
	}

	const v = validateApply(body);
	if (!v.ok) {
		json(res, 400, { ok: false, error: v.error });
		return;
	}
	const data = v.data;

	const { secret, notifyEmail } = friendEnv();
	if (!secret) {
		json(res, 500, {
			ok: false,
			error: "服务端未配置 FRIEND_SECRET 环境变量",
		});
		return;
	}

	const norm = normalizeSite(data.siteurl);
	if (seenSites.has(norm)) {
		json(res, 409, {
			ok: false,
			error: "该站点已提交过申请，请勿重复提交",
		});
		return;
	}
	const existing = await fetchFriendsConfigText();
	if (existing && extractSiteurls(existing).includes(norm)) {
		json(res, 409, { ok: false, error: "该站点已在友链列表中" });
		return;
	}

	const approveToken = makeToken(secret, "approve", data);
	const rejectToken = makeToken(secret, "reject", data);
	const approveUrl = `${PUB_ORIGIN}/api/friend-decide?token=${approveToken}`;
	const rejectUrl = `${PUB_ORIGIN}/api/friend-decide?token=${rejectToken}`;

	if (notifyEmail) {
		try {
			await sendMail({
				to: notifyEmail,
				subject: `[友链申请] ${data.title}`,
				text: buildNotifyEmail(data, approveUrl, rejectUrl),
			});
		} catch (err) {
			// 通知邮件失败不阻断申请（申请已收到，站长可人工处理）
			console.error("[friend-apply] 通知邮件发送失败：", err?.message || err);
		}
	}

	seenSites.add(norm);
	json(res, 200, { ok: true });
}
