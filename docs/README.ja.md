
<img src="./images/1131.png" width = "350" height = "500" alt="Firefly" align=right />

<div align="center">

# Firefly · 左沐の手册
> 美しくモダンな Astro 静的ブログテーマテンプレート
> 
> 本サイトは [Firefly](https://github.com/CuteLeaf/Firefly) の個人フォーク（v6.16.8）で、サイト名は「左沐の手册」、メインエントランスは [azuma.mstzuomu.space](https://azuma.mstzuomu.space) です
> 
> ![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen) 
![pnpm >= 11](https://img.shields.io/badge/pnpm-%3E%3D11-blue)
![Astro](https://img.shields.io/badge/Astro-7-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)
>
> [![Stars](https://img.shields.io/github/stars/jmqsOOOtatoba/FireflyPriWeb?style=social)](https://github.com/jmqsOOOtatoba/FireflyPriWeb/stargazers)
[![Forks](https://img.shields.io/github/forks/jmqsOOOtatoba/FireflyPriWeb?style=social)](https://github.com/jmqsOOOtatoba/FireflyPriWeb/network/members)
[![Issues](https://img.shields.io/github/issues/jmqsOOOtatoba/FireflyPriWeb)](https://github.com/jmqsOOOtatoba/FireflyPriWeb/issues)
> 
> [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z41NQALY)
>
> **QQ交流群：[1087127207](https://qm.qq.com/q/ZGsFa8qX2G)**
> 
> ![GitHub License](https://img.shields.io/github/license/jmqsOOOtatoba/FireflyPriWeb)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/CuteLeaf/Firefly)
[![Afdian Sponsor](https://img.shields.io/badge/Afdian-作者を支援-ff69b4.svg)](https://ifdian.net/a/cuteleaf)

</div>


---
📖 README：
**[简体中文](../README.md)** | **[繁體中文](README.zh-TW.md)** | **[English](../README.en.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)**

🚀 クイックガイド：
[**🖥️サイト入口**](https://azuma.mstzuomu.space/) /
[**📝テーマドキュメント**](https://docs-firefly.cuteleaf.cn/) /
[**📊公開アクセス解析**](https://azuma.mstzuomu.space/analytics/)

⚡ 静的サイト生成：Astro ベースの超高速読み込み速度と SEO 最適化

🎨 モダンデザイン：シンプルで美しいインターフェース、カスタマイズ可能なテーマカラー

📱 モバイルフレンドリー：完璧なレスポンシブ体験、モバイル専用最適化

🔧 高度にカスタマイズ可能：ほとんどの機能モジュールは設定ファイルでカスタマイズ可能

<table width="100%" align="center">
  <tr>
    <td colspan="3" align="center">
      <img src="./images/1.webp" >
      <br>バナーモード</td>
    </td>
  </tr>
  <tr>
    <td align="center"><img src="./images/3.webp" width="300"><br>オーバーレイモード</td>
    <td align="center"><img src="./images/2.webp" width="300"><br>全画面壁紙モード</td>
    <td align="center"><img src="./images/4.webp" width="300"><br>ソリッドカラーモード</td>
  </tr>
</table>
<img alt="Lighthouse" src="./docs/images/Lighthouse.png" />

>[!TIP]
>
>Firefly は、Astro フレームワークと Fuwari テンプレートをベースに開発された、清新で美しくモダンな個人ブログテーマテンプレートです。技術愛好家やコンテンツクリエイター向けに設計されており、モダンな Web 技術スタックを統合し、豊富な機能モジュールと高いカスタマイズ性を備えたインターフェースで、プロフェッショナルで美しい個人ブログを手軽に構築できます。
>
>**Firefly コンポーネント設計や関連コードを参考または利用する場合は、出典として Firefly を明記してください。**
>
>Firefly はオリジナルの fuwari レイアウトも保持しており、設定ファイルで好みに応じて自由に切り替えられます。
>
>**レイアウト設定とデモの詳細については、[Firefly レイアウトシステム詳解](https://firefly.cuteleaf.cn/posts/guide/firefly-layout-system/)をご覧ください**
>
>Firefly は i18n の多言語 UI をサポートしていますが、簡体字中国語以外の言語は AI 翻訳です。誤りがある場合は、[Pull Request](https://github.com/CuteLeaf/Firefly/pulls) の提出を歓迎します。

## ✨ 機能

### コア機能

- [x] **Astro + Tailwind CSS** - モダンな技術スタックベースの超高速静的サイト生成
- [x] **スムーズなアニメーション** - Swup ページトランジションアニメーションで滑らかなブラウジング体験
- [x] **レスポンシブデザイン** - デスクトップ、タブレット、モバイルデバイスに完璧に対応
- [x] **多言語サポート** - i18n 国際化UI、簡体字中国語、繁体字中国語、英語、日本語、ロシア語、韓国語をサポート
- [x] **全文検索** - Pagefind ベースのクライアントサイド検索、記事コンテンツのインデックスをサポート

### パーソナライゼーション
- [x] **動的サイドバー** - シングルサイドバー、デュアルサイドバー設定をサポート
- [x] **記事レイアウト** - リスト（単列）、グリッド（多列/メーソンリー）レイアウトをサポート
- [x] **フォント管理** - カスタムフォントをサポート、豊富なフォントセレクター
- [x] **フッター設定** - HTMLコンテンツ注入、完全カスタマイズ可能
- [x] **ライト/ダークモード** - ライト/ダーク/システム追従の3モードをサポート
- [x] **ナビゲーションバーのカスタマイズ** - ロゴ、タイトル、リンクを完全カスタマイズ
- [x] **壁紙モード切り替え** - バナー壁紙、フルスクリーン壁紙、フルスクリーン透明壁紙、単色背景
- [x] **テーマカラーのカスタマイズ** - 360° 色相調整


便利な機能や最適化があれば、[Pull Request](https://github.com/CuteLeaf/Firefly/pulls)を提出してください

### 個人による追加機能

- [x] **フレンドサークル** - `/fcircle/` フレンドリンクの RSS を収集して最新記事を一覧表示
- [x] **ブックマークナビ** - `/booknav/` カテゴリ別のブックマーク集。`booknavConfig.ts` で設定
- [x] **ギャラリー** - `/gallery/` 画像アルバムページ
- [x] **モーメント** - `/dynamic/` 短文タイムライン。固定表示・位置情報・Memos データソースに対応
- [x] **プロジェクト** - `/projects/` プロジェクト紹介ページ
- [x] **ゲストブック** - `/guestbook/` 訪問者からのメッセージ
- [x] **Bangumi と Bilibili** - Bangumi のコレクションと Bilibili の視聴進捗
- [x] **アクセス解析** - セルフホストの Umami（`umami.mstzuomu.space`）と公開統計ページ `/analytics/`。ナビゲーションバーから遷移可能。不蒜子（busuanzi）は完全に削除済み
- [x] **パブリッシャー** - `publisher/` は独立した Vercel プロジェクト（`pub.mstzuomu.space`）で、article / articles / auth / friend-apply / friend-decide / publish の 6 つの API を提供
- [x] **フレンドリンク自動申請** - フォームから申請し、メールで審査。却下理由も記入可能
- [x] **訪問者情報** - 訪問者の位置、天気、気温などを表示し、気象警報にも対応
- [x] **サイト統計** - 記事数、カテゴリ数、タグ数、総文字数、稼働日数などの統計
- [x] **読書体験の強化** - 読書進捗バーとリング表示、さらに没入読書モード
- [x] **Twikoo コメント** - セルフホストのコメントサービス（`twikoo.mstzuomu.space`）
- [x] **Bilibili カード** - `::bilibili{uid="..."}` ディレクティブで投稿者カードを埋め込み
- [x] **音楽プレーヤー** - 全ページ共通の音楽プレーヤーと `::music` ディレクティブ
- [x] **画像ホスティング** - `tu.mstzuomu.space` の専用ホスト
- [x] **ダブル ICP フッター** - 魯ICP備2026062086号-1 と公安备案番号＋アイコンを `FooterConfig.html` から挿入

## 🚀 クイックスタート

### 環境要件

- Node.js ≥ 22.23.0（`package.json` の `engines.node`）
- pnpm 11.22.0（`package.json` の `packageManager`）

### ローカル開発

1. **リポジトリのクローン：**
   ```bash
   git clone https://github.com/jmqsOOOtatoba/FireflyPriWeb.git
   cd FireflyPriWeb
   ```
   
   **このリポジトリを土台に自分のサイトを作る場合は、先に自分のリポジトリへ [Fork](https://github.com/jmqsOOOtatoba/FireflyPriWeb/fork) してからクローンしてください：**

   ```bash
   git clone https://github.com/you-github-name/FireflyPriWeb.git
   cd FireflyPriWeb
   ```
3. **依存関係のインストール：**
   ```bash
   # pnpmがインストールされていない場合、まずインストール
   npm install -g pnpm
   
   # プロジェクトの依存関係をインストール
   pnpm install
   ```

4. **ブログの設定：**
   - `src/config/`ディレクトリ内の設定ファイルを編集してブログをカスタマイズ

5. **開発サーバーの起動：**
   ```bash
   pnpm dev
   ```
   ブログは`http://localhost:4321`で利用可能になります

### プラットフォームホスティングデプロイ

本サイトは **Tencent Cloud EdgeOne Pages** にデプロイしています。GitHub の `master` ブランチへプッシュすると自動でビルド・公開され、成果物は純粋な静的ファイルです。

- フレームワークプリセット： `Astro`
- ルートディレクトリ： `./`
- 出力ディレクトリ： `dist`
- ビルドコマンド： `pnpm run build`
- インストールコマンド： `pnpm install`

Vercel、Netlify、Cloudflare Pages などの他の静的ホスティングでもそのまま使えます。[Astro 公式のデプロイガイド](https://docs.astro.build/ja/guides/deploy/)に従って設定してください。

**補足：**

- サイトのメインエントランスは <https://azuma.mstzuomu.space> で、`src/config/siteConfig.ts` の `site_url` に定義されています。`www.mstzuomu.space` と裸ドメインはメインサイトへ 302 リダイレクトされます（`Layout.astro`）。
- リポジトリ直下の `wrangler.jsonc`、`wrangler.toml`、`vercel.json` は上流テンプレートの残骸で、本サイトのデプロイ経路では使用していません。
- `astro.config.mjs` は環境変数 `CF_WORKERS` が存在する場合のみ Cloudflare アダプターを組み込みます。既定は純粋な静的ビルドで、アダプターは不要です。

## 📖 設定説明

> 📚 **詳細な設定ドキュメント**：[Fireflyドキュメント](https://docs-firefly.cuteleaf.cn/)で完全な設定ガイドを確認してください

### ウェブサイトの言語設定

ブログのデフォルト言語を設定するには、`src/config/siteConfig.ts`ファイルを編集します：

```typescript
// サイト言語を定義
const SITE_LANG = "zh_CN";
```

**サポートされている言語コード：**
- `zh_CN` - 簡体字中国語
- `zh_TW` - 繁体字中国語
- `en` - 英語
- `ja` - 日本語
- `ru` - ロシア語
- `ko` - 韓国語

### 設定ファイル構造

```
src/
├── config/
│   ├── index.ts                  # 設定インデックスファイル
│   ├── siteConfig.ts             # サイト基本設定
│   ├── analyticsConfig.ts        # アナリティクス設定
│   ├── announcementConfig.ts     # お知らせ設定
│   ├── backgroundWallpaper.ts    # 背景壁紙設定
│   ├── booknavConfig.ts          # ブックマークナビ設定
│   ├── commentConfig.ts          # コメントシステム設定
│   ├── coverImageConfig.ts       # カバー画像設定
│   ├── displaySettingsConfig.ts  # パネル構成の設定
│   ├── dynamicConfig.ts          # モーメントページ設定
│   ├── effectsConfig.ts          # アニメーションエフェクト設定（桜など）
│   ├── expressiveCodeConfig.ts   # コードハイライト設定
│   ├── fcircleConfig.ts          # フレンドサークル設定
│   ├── fontConfig.ts             # フォント設定
│   ├── FooterConfig.html           # フッター設定
│   ├── friendsConfig.ts          # 友人リンク設定
│   ├── galleryConfig.ts          # ギャラリー設定
│   ├── licenseConfig.ts          # ライセンス設定
│   ├── musicConfig.ts            # 音楽プレーヤー設定
│   ├── navBarConfig.ts           # ナビゲーションバー設定
│   ├── pioConfig.ts              # マスコット設定
│   ├── mermaidConfig.ts          # Mermaid 図表設定
│   ├── plantumlConfig.ts         # PlantUML 図表設定
│   ├── profileConfig.ts          # ユーザープロフィール設定
│   ├── sidebarConfig.ts          # サイドバーレイアウト設定
│   └── sponsorConfig.ts          # スポンサー設定
```

## ⚙️ 記事のFrontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg  # または「api」を使用してランダムカバー画像を有効化
tags: [Foo, Bar]
category: Front-end
draft: false
lang: zh-CN      # 記事の言語が `siteConfig.ts` のサイト言語と異なる場合のみ設定
pinned: false    # 記事を固定
comment: true    # コメントを有効化
---
```

## モーメント

モーメントは `src/content/dynamic/` に保存され、1つの Markdown ファイルが1件のモーメントに対応します。次のコマンドで作成できます：

```bash
pnpm new-d 今日はとても良い天気です
```

`pnpm new-dynamic <content>` も同じ機能の完全なコマンドです。

```yaml
---
published: 2026-07-15 16:15:29
pinned: true  # 記事を固定
location: China # 場所
---

本文では Markdown を使用できます。
```

[Memos](https://www.usememos.com/) をデータソースとして接続することもできます。`src/config/dynamicConfig.ts` の `memos` オプションを設定すると、ピン留めの同期や画像添付ファイルの表示に対応したリアルタイムデータ取得が可能です。詳細は[モーメントドキュメント](https://docs-firefly.cuteleaf.cn/en/guide/dynamic.html)をご参照ください。

## 🧩 Markdown拡張

Astro がデフォルトで対応している[GitHub Flavored Markdown](https://github.github.com/gfm/)に加えて、`src/plugins/` には 20 以上の remark / rehype プラグインが入っており、次の拡張機能を提供します：

- Admonitions（予告ブロック） - GitHub、Obsidian、VitePress、Docusaurus の4つのテーマ設定をサポート ([プレビューと使用方法](https://firefly.cuteleaf.cn/posts/markdown-extended/))
- GitHub リポジトリカード ([プレビューと使用方法](https://firefly.cuteleaf.cn/posts/markdown-extended/))
- Expressive Code ベースの強化コードブロック ([プレビュー](http://firefly.cuteleaf.cn/posts/code-examples/) / [ドキュメント](https://expressive-code.com/))
- Bilibili ユーザーカード - `::bilibili{uid="353880725"}`。アイコンとニックネームはビルド時に取得してカード全体を描画
- 音楽プレーヤー - `::music{url="..."}` または `::music{server="netease" id="..."}`
- PDF ビューア - `::pdf{url="https://example.com/file.pdf"}`
- Mermaid 図表 - コードブロックから描画、ズームとドラッグに対応
- PlantUML 図表 - コードブロックから描画、テーマ切り替えとズーム・ドラッグに対応
- Wiki リンク - `[[記事パス]]` 形式のサイト内リンク。タイトルと URL を自動解決
- 画像グリッド - 複数の画像を自動でグリッド配置
- メールアドレス保護 - 本文中のメールアドレスを自動でエンコードし、収集ボットを防ぐ
- 外部リンク処理 - 外部リンクに `target` / `rel` 属性を自動付与
- 図のキャプション - 画像を自動で `<figure>` に包み、キャプションにも対応
- 読了時間と抜粋 - ビルド時に読了時間と記事の抜粋を生成

## 🧞 コマンド

すべてのコマンドはプロジェクトルートディレクトリで実行する必要があります：

| Command                      | Action                                                    |
| :--------------------------- | :-------------------------------------------------------- |
| `pnpm install`               | 依存関係をインストール（`preinstall` で pnpm 限定を強制）  |
| `pnpm dev`                   | `localhost:4321`でローカル開発サーバーを起動（`pnpm start` も同等） |
| `pnpm build`                 | 10 ステップのビルドチェーンを実行し `./dist/` に出力      |
| `pnpm preview`               | ビルドされたサイトをローカルでプレビュー                  |
| `pnpm check`                 | Astro の診断を実行し、コード内のエラーをチェック          |
| `pnpm type-check`            | TypeScript の型チェックを実行（`tsc --noEmit`）           |
| `pnpm format`                | Biome で `src` と `scripts` をフォーマット                |
| `pnpm lint`                  | Biome で `src` と `scripts` を検査し安全に修正            |
| `pnpm new-post <filename>`   | 新しい記事を作成                                          |
| `pnpm new-d <content>`       | 新しいモーメントを作成（`new-dynamic` の別名）            |
| `pnpm new-dynamic <content>` | 新しいモーメントを作成（完全なコマンド）                  |
| `pnpm lqips`                 | 画像の LQIP プレースホルダーだけを再生成                  |
| `pnpm friend-json`           | フレンドリンクの JSON だけを再生成                        |
| `pnpm github-cards`          | GitHub カードのデータだけを再生成                         |
| `pnpm bilibili-cards`        | Bilibili カードのデータだけを再生成                       |
| `pnpm astro ...`             | `astro add`、`astro check` などのコマンドを実行           |
| `pnpm astro --help`          | Astro CLI ヘルプを表示                                    |

`pnpm build` は複合コマンドで、次の 10 ステップを順に実行します：

フレンドリンク JSON 生成 → GitHub カードデータ生成 → Bilibili カードデータ生成 → LQIP プレースホルダー生成 → VNDB カバー生成 → `astro build` → マスコット素材の整理 → フォントのサブセット化 → インラインスクリプトの圧縮 → Pagefind の検索インデックス生成。

## 🙏 謝辞

[fuwari](https://github.com/saicaca/fuwari) テンプレートを開発した[saicaca](https://github.com/saicaca)に深く感謝します。Firefly はこのテンプレートをベースに二次開発されています。

蛍関連の画像素材の著作権はゲーム[「崩壊：スターレイル」](https://sr.mihoyo.com/)の開発元 [miHoYo](https://www.mihoyo.com/) に帰属します。

### 技術スタック

- [Astro](https://astro.build) 
- [Tailwind CSS](https://tailwindcss.com) 
- [Iconify](https://iconify.design)

### インスピレーションプロジェクト

- [fuwari](https://github.com/saicaca/fuwari)
- [hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka)
- [astro-koharu](https://github.com/cosZone/astro-koharu)
- [Mizuki](https://github.com/matsuzaka-yuki/Mizuki)

### その他の参考
- ブロガー`霞葉`の [Bangumi コレクション](https://kasuha.com/posts/fuwari-enhance-ep2/) ページコンポーネント
- Bilibili クリエイター `公公的日常` のQ版 [蛍看板娘 Spine モデル](https://www.bilibili.com/video/BV1fuVzzdE5y)

## 📝 ライセンス

本プロジェクトは [MIT license](https://mit-license.org/) の下で公開されています。詳細は [LICENSE](../LICENSE) ファイルをご覧ください。

最初は [saicaca/fuwari](https://github.com/saicaca/fuwari) からフォークされました。元の作者の貢献に感謝します。

**著作権表示：**
- Copyright (c) 2024 [saicaca](https://github.com/saicaca) - [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) - [Firefly](https://github.com/CuteLeaf/Firefly)

MIT ライセンスに基づき、コードの自由な使用、変更、配布が許可されていますが、上記の著作権表示を保持する必要があります。

## 🍀 貢献者

このプロジェクトに貢献してくれた以下の貢献者に感謝します。質問や提案がある場合は、[Issue](https://github.com/CuteLeaf/Firefly/issues)または[Pull Request](https://github.com/CuteLeaf/Firefly/pulls)を提出してください。

><a href="https://github.com/CuteLeaf/Firefly/graphs/contributors">
>  <img src="https://contrib.rocks/image?repo=CuteLeaf/Firefly" />
></a>

このプロジェクトの基盤を築いた元のプロジェクト[fuwari](https://github.com/saicaca/fuwari)に貢献してくれた以下の貢献者に感謝します。

><a href="https://github.com/saicaca/fuwari/graphs/contributors">
>  <img src="https://contrib.rocks/image?repo=saicaca/fuwari" />
></a>

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CuteLeaf/Firefly&type=Date)](https://star-history.com/#CuteLeaf/Firefly&Date)


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
