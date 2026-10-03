---
title: "Firefly Publisher 发布台"
slug: firefly-publisher
published: 2026-10-03
order: 110
description: "给静态博客装一个随时随地发文的发布台——口令登录，发文 / 改稿 / 删除 / 预览全在浏览器完成，自动提交回 GitHub 仓库触发构建上线。路径与文件命名全部可用环境变量配置，其他静态博客也能直接使用。"
image: "images/firefly-publisher.png"
status: "published"
tags:
  - Vercel
  - GitHub
  - 自动化
  - 发布系统
link:
  - label: "GitHub"
    icon: "fa7-brands:github"
    value: "https://github.com/jmqsOOOtatoba/firefly-publisher"
  - label: "教程"
    icon: "material-symbols:menu-book"
    value: "https://azuma.mstzuomu.space/posts/azuma.zuomu-blog-17/"
---

## 功能特性

🔐 **口令登录** - 环境变量存口令，每次打开发布台都要登录（sessionStorage，关浏览器失效）

✍️ **三类内容** - 文章 / 更新公告 / 动态，文件名自动生成：序号顺延、日期时间戳、冲突自动加 `-2` 后缀

📋 **自动 frontmatter** - 18 项可选字段按常见文章 schema 排列，**留空不写**，发布产物与手写文件完全同构

🗂️ **内容管理** - 列表分组（草稿 / 置顶徽章）→ 编辑全文 → marked 本地预览 → 保存 / 删除，全部在浏览器完成

🔒 **并发安全** - 读写携带 Git sha，并发冲突返回 409 而不是互相覆盖；路径白名单锁死在配置目录的 markdown 文件

📦 **零构建** - 前端就是一个 HTML + 一个 JS，后端是 5 个 Vercel 无框架函数，没有任何打包步骤

## 架构

```mermaid
flowchart LR
    A["发布台前端<br/>（任意设备浏览器）"] -- "口令 + 内容" --> B["Vercel API 函数<br/>鉴权 · 命名 · 拼 frontmatter"]
    B -- "Contents API" --> C["GitHub 仓库"]
    C --> D["既有的自动构建"]
    D --> E["博客上线"]
```

博客本体一行架构都不用动——它继续是纯静态站，发布台只是另一个独立部署的小系统，两边靠仓库衔接。

## 快速开始

1. 创建 GitHub **Fine-grained PAT**（仅授博客仓库 Contents 读写）
2. Fork 本仓库导入 Vercel（或拷进你博客仓库的 `publisher/` 子目录）
3. 配置三个环境变量：`GITHUB_REPO`、`GITHUB_TOKEN`、`PUBLISH_TOKEN`
4. Deploy → 关掉 Deployment Protection → 打开地址登录发文

默认值适配 Firefly 博客约定；其他博客通过 `PUB_POST_DIR`、`PUB_POST_NAME` 等环境变量覆盖路径与文件名模板（支持 `{n}` / `{date}` / `{time}` 占位符），**不用改一行代码**。完整的部署步骤、五个真实踩坑清单与配置参考见 [仓库 README](https://github.com/jmqsOOOtatoba/firefly-publisher#readme)。

## 本地测试

仓库自带不碰真实仓库的测试吊床（mock GitHub）：

```bash
node test/local-harness.mjs   # http://127.0.0.1:8788 ，登录口令 test-pass-123
node test/api-test.mjs        # 另开终端，32 项断言
```

## License

[MIT](https://github.com/jmqsOOOtatoba/firefly-publisher/blob/main/LICENSE) © jmqsOOOtatoba
