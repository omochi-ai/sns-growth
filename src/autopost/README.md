# 自動投稿システム（T-001）

Threads公式API経由の予約投稿 + Xはスケジューラ取込用エクスポート（D-002）。

## セットアップ

```bash
npm install
cp .env.example .env
# .env に THREADS_USER_ID / THREADS_ACCESS_TOKEN を設定
```

### Threads API トークン取得（概要）

1. [Meta for Developers](https://developers.facebook.com/) でアプリ作成
2. Threads API の `threads_basic` / `threads_content_publish` スコープで OAuth
3. 取得した User Access Token と Threads User ID を `.env` に設定

## コマンド

```bash
# Markdown → posts.json
npm run autopost -- import

# dry-run（実投稿なし・ログのみ）
npm run autopost -- run --dry-run

# 本番投稿（Threadsのみ）
npm run autopost -- run

# X用スケジューラ取込CSV（Typefully/Buffer等）
npm run autopost -- export-x
npm run autopost -- export-x --format txt -o exports/x-scheduler.txt

# 投稿文生成（T-002）
npm run autopost -- generate --theme-file data/themes.txt --count 30
npm run autopost -- generate --dry-run

# Shorts生成（T-003）
npm run autopost -- shorts --text "投稿テキスト"
npm run autopost -- shorts --dry-run --text-file content/threads-x-posts.md
```

## リンク集約ページ（T-004）

```bash
npm run build:linkpage   # → docs/index.html
```

詳細: [src/linkpage/README.md](src/linkpage/README.md)

## データ

| ファイル | 説明 |
|---|---|
| `content/threads-x-posts.md` | 人間が編集する投稿原稿 |
| `data/posts.json` | 実行用キュー（gitignore） |
| `logs/post-log.csv` | 投稿ログ（gitignore） |
| `exports/x-scheduler.csv` | Xスケジューラ取込用 |

## スケジュール

既定: 07:00 / 12:00 / 20:00 JST（`.env` の `POST_TIMES` で変更可）

ローカル cron 例（Windows タスクスケジューラ / Linux cron）:

```cron
0 7,12,20 * * * cd /path/to/sns-growth && npm run autopost -- run
```

## 設計メモ

- **ThreadsAdapter**: Graph API `auto_publish_text=true` で1リクエスト投稿
- **XAdapter**: 実投稿は無効。`export-x` で CSV/テキスト出力
- 失敗時3回リトライ → スキップして次へ
- 1日あたり3件/プラットフォーム上限（ログベースでカウント）

## 安全

- 自分の投稿の予約・投稿のみ（エンゲージ操作は実装しない）
- `.env` はコミット禁止
