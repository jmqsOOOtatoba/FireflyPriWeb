import {
	BRANCH,
	encodeRepoPath,
	githubFetch,
	json,
	REPO,
	requireAuth,
} from "../lib/shared.js";

/** 从 frontmatter 里取展示用元数据（够列表用即可，不完整解析 YAML） */
function parseMeta(text) {
	const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
	const get = (key) =>
		new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(fm)?.[1]?.trim() ?? "";
	let title = get("title");
	if (
		(title.startsWith('"') && title.endsWith('"')) ||
		(title.startsWith("'") && title.endsWith("'"))
	) {
		title = title.slice(1, -1);
	}
	return {
		title,
		published: get("published").slice(0, 10),
		draft: /^draft:[ \t]*true/m.test(fm),
		pinned: /^pinned:[ \t]*true/m.test(fm),
	};
}

function contentType(path) {
	if (path.startsWith("src/content/dynamic/")) return "dynamic";
	if (path.startsWith("src/content/posts/update/")) return "update";
	return "post";
}

async function fetchMeta(githubToken, path) {
	try {
		const res = await fetch(
			`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${encodeRepoPath(path)}`,
			{ headers: { Authorization: `Bearer ${githubToken}` } },
		);
		if (!res.ok) return null;
		const text = await res.text();
		return parseMeta(text);
	} catch {
		return null;
	}
}

async function mapLimit(items, limit, fn) {
	const results = new Array(items.length);
	let next = 0;
	async function worker() {
		while (next < items.length) {
			const i = next++;
			results[i] = await fn(items[i]);
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, worker),
	);
	return results;
}

export default async function handler(req, res) {
	if (req.method !== "GET") {
		res.statusCode = 405;
		res.setHeader("Allow", "GET");
		res.end("Method Not Allowed");
		return;
	}
	const auth = requireAuth(req, res);
	if (!auth) return;

	const { status, ok, data } = await githubFetch(
		"GET",
		`/repos/${REPO}/git/trees/${BRANCH}?recursive=1`,
		auth.githubToken,
	);
	if (!ok) {
		json(res, status >= 400 && status < 500 ? status : 502, {
			ok: false,
			error: `读取仓库文件树失败：${data.message || `HTTP ${status}`}`,
		});
		return;
	}

	const entries = (data.tree ?? []).filter(
		(e) =>
			e.type === "blob" &&
			/^src\/content\/(posts|dynamic)\/.+\.(md|mdx)$/.test(e.path),
	);

	const metas = await mapLimit(entries, 6, (e) =>
		fetchMeta(auth.githubToken, e.path),
	);

	const items = entries.map((e, i) => ({
		path: e.path,
		name: e.path.split("/").pop(),
		sha: e.sha,
		type: contentType(e.path),
		title: metas[i]?.title || e.path.split("/").pop(),
		published: metas[i]?.published || "",
		draft: metas[i]?.draft ?? false,
		pinned: metas[i]?.pinned ?? false,
	}));

	json(res, 200, { ok: true, items, truncated: !!data.truncated });
}
