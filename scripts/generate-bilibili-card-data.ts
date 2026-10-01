import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const OUTPUT_FILE = "src/constants/bilibili-card-data.json";
const CONTENT_GLOB = "src/content/**/*.{md,mdx}";
const BILIBILI_DIRECTIVE_PATTERN =
	/::bilibili\s*\{[^}]*\buid\s*=\s*["'](\d+)["'][^}]*\}/g;
const API_BASE = "https://uapis.cn/api/v1/social/bilibili/userinfo";

interface BilibiliCardData {
	name: string;
	face: string;
	sign: string;
	follower: number;
	following: number;
	archiveCount: number;
}

type BilibiliCardCache = Record<string, BilibiliCardData>;

async function readCache(): Promise<BilibiliCardCache> {
	try {
		return JSON.parse(await fs.readFile(OUTPUT_FILE, "utf-8"));
	} catch {
		return {};
	}
}

async function findUids(): Promise<Set<string>> {
	const uids = new Set<string>();
	const contentFiles = await glob(CONTENT_GLOB);

	for (const file of contentFiles) {
		const content = await fs.readFile(file, "utf-8");
		for (const match of content.matchAll(BILIBILI_DIRECTIVE_PATTERN)) {
			uids.add(match[1]);
		}
	}

	return uids;
}

async function fetchUserInfo(uid: string): Promise<BilibiliCardData> {
	const response = await fetch(`${API_BASE}?uid=${encodeURIComponent(uid)}`, {
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok) {
		throw new Error(`UapiPro returned ${response.status}`);
	}

	const data = await response.json();
	if (typeof data?.name !== "string") {
		throw new Error("Unexpected response payload");
	}

	return {
		name: data.name,
		// B 站头像域可能返回 http，统一升级避免混合内容拦截
		face:
			typeof data.face === "string"
				? data.face.replace(/^http:\/\//, "https://")
				: "",
		sign: typeof data.sign === "string" ? data.sign : "",
		follower: Number(data.follower) || 0,
		following: Number(data.following) || 0,
		archiveCount: Number(data.archive_count) || 0,
	};
}

async function main() {
	const existingCache = await readCache();
	const uids = await findUids();
	const nextCache: BilibiliCardCache = {};
	let updated = 0;

	for (const uid of uids) {
		try {
			nextCache[uid] = await fetchUserInfo(uid);
			updated++;
			// 访客额度 4 QPS，留点余量
			await new Promise((resolve) => setTimeout(resolve, 300));
		} catch (error) {
			if (existingCache[uid]) {
				nextCache[uid] = existingCache[uid];
				console.warn(
					`[BILIBILI-CARD] Failed to refresh ${uid}; keeping cached data.`,
					error,
				);
			} else {
				console.warn(
					`[BILIBILI-CARD] Failed to load ${uid}; the card will use its fallback state.`,
					error,
				);
			}
		}
	}

	const sortedCache = Object.fromEntries(
		Object.entries(nextCache).sort(([a], [b]) => a.localeCompare(b)),
	);
	await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
	await fs.writeFile(
		OUTPUT_FILE,
		`${JSON.stringify(sortedCache, null, "\t")}\n`,
	);
	console.log(
		`[BILIBILI-CARD] Cached ${Object.keys(sortedCache).length} users (${updated} refreshed).`,
	);
}

main();
