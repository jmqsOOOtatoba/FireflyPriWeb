import { json, safeEqual } from "../lib/shared.js";

export default function handler(req, res) {
	if (req.method !== "POST") {
		res.statusCode = 405;
		res.setHeader("Allow", "POST");
		res.end("Method Not Allowed");
		return;
	}
	const publishToken = process.env.PUBLISH_TOKEN;
	if (!publishToken) {
		json(res, 500, { ok: false, error: "服务端未配置 PUBLISH_TOKEN" });
		return;
	}
	if (!safeEqual(req.headers["x-publish-token"], publishToken)) {
		json(res, 401, { ok: false, error: "口令错误" });
		return;
	}
	json(res, 200, { ok: true });
}
