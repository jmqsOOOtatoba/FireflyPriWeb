import {
	BRANCH,
	encodeRepoPath,
	githubFetch,
	isSafeContentPath,
	json,
	REPO,
	requireAuth,
} from "../lib/shared.js";

export default async function handler(req, res) {
	const auth = requireAuth(req, res);
	if (!auth) return;
	const token = auth.githubToken;

	if (req.method === "GET") {
		const path = req.query?.path;
		if (!isSafeContentPath(path)) {
			json(res, 400, { ok: false, error: "非法路径" });
			return;
		}
		const { status, ok, data } = await githubFetch(
			"GET",
			`/repos/${REPO}/contents/${encodeRepoPath(path)}?ref=${BRANCH}`,
			token,
		);
		if (!ok || Array.isArray(data)) {
			json(
				res,
				status === 404 ? 404 : status >= 400 && status < 500 ? status : 502,
				{
					ok: false,
					error:
						status === 404
							? "文件不存在"
							: `读取失败：${data.message || `HTTP ${status}`}`,
				},
			);
			return;
		}
		json(res, 200, {
			ok: true,
			path,
			sha: data.sha,
			content: Buffer.from(data.content ?? "", "base64").toString("utf8"),
		});
		return;
	}

	if (req.method === "PUT" || req.method === "DELETE") {
		let body = {};
		try {
			body =
				typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
		} catch {
			json(res, 400, { ok: false, error: "请求体不是合法 JSON" });
			return;
		}
		const path = body.path;
		const sha = body.sha;
		if (!isSafeContentPath(path)) {
			json(res, 400, { ok: false, error: "非法路径" });
			return;
		}
		if (!sha || typeof sha !== "string") {
			json(res, 400, {
				ok: false,
				error: "缺少文件 sha（请先读取文件再提交）",
			});
			return;
		}
		const name = path.split("/").pop();

		if (req.method === "PUT") {
			const content = String(body.content ?? "");
			if (!content.trim()) {
				json(res, 400, { ok: false, error: "内容不能为空" });
				return;
			}
			const { status, ok, data } = await githubFetch(
				"PUT",
				`/repos/${REPO}/contents/${encodeRepoPath(path)}`,
				token,
				{
					message: `edit: ${name}`,
					content: Buffer.from(content, "utf8").toString("base64"),
					sha,
					branch: BRANCH,
				},
			);
			if (!ok) {
				json(res, status >= 400 && status < 500 ? status : 502, {
					ok: false,
					error: `保存失败：${data.message || `HTTP ${status}`}${
						status === 409 || status === 422
							? "（文件已被他人改动，请刷新后重试）"
							: ""
					}`,
				});
				return;
			}
			json(res, 200, {
				ok: true,
				path,
				sha: data.content?.sha,
				message: `已提交（${path}），构建约 3~5 分钟后生效`,
			});
			return;
		}

		// DELETE
		const { status, ok, data } = await githubFetch(
			"DELETE",
			`/repos/${REPO}/contents/${encodeRepoPath(path)}`,
			token,
			{ message: `delete: ${name}`, sha, branch: BRANCH },
		);
		if (!ok) {
			json(res, status >= 400 && status < 500 ? status : 502, {
				ok: false,
				error: `删除失败：${data.message || `HTTP ${status}`}`,
			});
			return;
		}
		json(res, 200, { ok: true, path, message: `已删除（${path}）` });
		return;
	}

	res.statusCode = 405;
	res.setHeader("Allow", "GET, PUT, DELETE");
	res.end("Method Not Allowed");
}
