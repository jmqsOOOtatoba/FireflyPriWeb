import fs from "node:fs/promises";
import path from "node:path";
import { getEnabledFriends } from "../src/config/friendsConfig";

// 生成 Friend-Circle-Lite 所需的友链数据文件
// 格式: { "friends": [["站点名", "站点地址", "头像地址"], ...] }
// 产物发布到站点根目录 (public/friend.json)，供 FCL 的 Action 定时拉取

const OUTPUT_FILE = path.join("public", "friend.json");

async function main() {
	const friends = getEnabledFriends();

	const data = {
		friends: friends.map((item) => [item.title, item.siteurl, item.imgurl]),
	};

	await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
	await fs.writeFile(
		OUTPUT_FILE,
		`${JSON.stringify(data, null, 2)}\n`,
		"utf-8",
	);

	console.log(`friend.json 已生成: ${OUTPUT_FILE} (${friends.length} 个友链)`);
}

main().catch((error) => {
	console.error("生成 friend.json 失败:", error);
	process.exit(1);
});
