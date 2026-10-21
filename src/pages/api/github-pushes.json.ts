import { execFileSync } from "node:child_process";
import type { APIRoute } from "astro";

export const prerender = true;

const repository = "jmqsOOOtatoba/FireflyPriWeb";

const ensureCommitDepth = () => {
	try {
		const countText = execFileSync("git", ["rev-list", "--count", "HEAD"], {
			cwd: process.cwd(),
			encoding: "utf8",
		});
		const count = Number.parseInt(countText.trim(), 10);
		if (Number.isFinite(count) && count >= 200) return;
		// 浅克隆下 log --since 只能看到少量提交，尝试加深后再统计
		execFileSync("git", ["fetch", "--deepen=2000"], {
			cwd: process.cwd(),
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch {
		// 加深失败则继续用现有深度统计
	}
};

const readCommitDates = () => {
	try {
		return execFileSync(
			"git",
			["log", "HEAD", "--since=53 weeks ago", "--format=%cI"],
			{
				cwd: process.cwd(),
				encoding: "utf8",
			},
		)
			.split(/\r?\n/)
			.map((value) => value.trim())
			.filter(Boolean);
	} catch {
		return [];
	}
};

export const GET: APIRoute = () => {
	ensureCommitDepth();
	return new Response(
		JSON.stringify({
			ok: true,
			source: "github-main-commits",
			repository,
			branch: "master",
			generatedAt: new Date().toISOString(),
			commits: readCommitDates(),
		}),
		{
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=300",
			},
		},
	);
};
