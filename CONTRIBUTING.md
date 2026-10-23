# Contributing

Thank you for your interest in contributing!

## Before You Start

If you plan to make major changes (especially new features or design changes), please open an issue or discussion before starting work. This helps ensure your effort aligns with the project's direction.

## Submitting Code

Please keep each pull request focused on a single purpose. Avoid mixing unrelated changes in one PR, as this can make reviewing and merging code more difficult.

Please use the [Conventional Commits](https://www.conventionalcommits.org/) format for your commit messages whenever possible. This keeps our history clear and consistent.

Before submitting code, please run the commands below in order. This is the same gate the project uses to accept changes: a PR is not considered ready until every step passes.

```bash
pnpm install       # 依赖安装（preinstall 强制 pnpm）
pnpm check         # astro check —— Astro/内容/语言文件诊断
pnpm type-check    # tsc --noEmit --isolatedDeclarations —— 全量类型检查
pnpm lint          # biome check --write ./src ./scripts —— 覆盖 src/ 与 scripts/ 的 lint + 格式化
pnpm build         # 完整构建（生成图标/LQIP/字体子集/Pagefind 等 10 步长链）
```

Notes:

- `pnpm lint` 与 `pnpm format` 的覆盖范围都是 **`./src` 与 `./scripts`**；仓库其他目录（如 `docs/`、`public/`）不在 Biome 作用域内。
- `pnpm lint` 会修改文件（Biome safe fix + 格式化）。跑完请 `git status` 复核，把与本次改动无关的自动格式化文件回退，避免无关 churn。
- `pnpm build` 是长链脚本，缺任一生成脚本产物都会失败；只做静态检查时可用 `pnpm check` + `pnpm type-check`。
- 如果改动涉及 UI，请在本地 `pnpm dev` 或 `pnpm preview` 中实际点一遍，并在 PR 里附截图。