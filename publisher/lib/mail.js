/* 邮件发送：有 SMTP 配置走 nodemailer；缺配置（本地开发/测试）落入 outbox 不报错 */

import nodemailer from "nodemailer";
import { friendEnv } from "./friends.js";

/** 开发/测试：未配置 SMTP 时邮件存入此数组（local-harness 提供查询路由） */
export const outbox = [];

export async function sendMail({ to, subject, text }) {
	if (!to) return { skipped: "no-recipient" };
	const { smtp } = friendEnv();
	if (!smtp.host || !smtp.user || !smtp.pass) {
		outbox.push({ to, subject, text, at: new Date().toISOString() });
		return { skipped: true };
	}
	const port = smtp.port || 587;
	const transport = nodemailer.createTransport({
		host: smtp.host,
		port,
		secure: port === 465, // 465 → SSL；其余（如 587）→ STARTTLS 由 nodemailer 自动协商
		auth: { user: smtp.user, pass: smtp.pass },
	});
	await transport.sendMail({ from: smtp.user, to, subject, text });
	return { sent: true };
}
