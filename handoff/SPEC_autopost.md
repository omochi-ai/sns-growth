# SPEC — 自動投稿システム

対象タスク：T-001 / T-002 / T-003

## 技術前提
- 言語：TypeScript (Node.js 20+)
- 秘密情報：`.env` 管理（`.env.example` を用意）。**ハードコード禁止・コミット禁止**（`.gitignore`）。
- 実行：初期はローカル cron / 手動実行。将来 VPS 常駐に移行できる構成。

## データモデル
`data/posts.json`
```json
[
  { "id": "p001", "text": "投稿本文", "platform": "threads",
    "scheduleAt": "2026-06-20T07:00:00+09:00", "used": false, "postedId": null }
]
```
- `content/threads-x-posts.md` を人間が編集 → `import` コマンドで posts.json に変換、でもよい。

## T-001 機能要件（Threads先行）
1. posts.json から `used=false かつ scheduleAt<=now` を取得。
2. platform に応じたアダプタで投稿。
   - `ThreadsAdapter`：Threads Graph API（公式・無料）で投稿。
   - `XAdapter`：**インターフェースのみ実装し、実投稿はthrow/skip**（有料のため。D-002承認後に有効化）。
3. 成功で `used=true`・`postedId` 記録。
4. 失敗は3回リトライ→スキップしてログ継続。
5. 1日の投稿上限（既定3/プラットフォーム）。
6. `logs/post-log.csv` に 日時/platform/成否/postedId 追記。
7. `--dry-run`：実投稿せずログのみ。

## T-002 機能要件（投稿文ジェネレータ）
- `generate --theme-file themes.txt --count 30`：Claude API（`claude-opus-4-8` 等、モデルIDは `.env` 切替）で投稿文生成。
- プロンプトに「ペルソナ：事務に追われるひとり社長」「比率 ノウハウ8:実績1:誘導1」「1投稿=保存される実用Tips」「絵文字は控えめ・煽らない」を含める。
- 出力を posts.json 形式へ。生成と投稿は**コマンド分離**。

## T-003 機能要件（Shorts PoC）
- 入力：投稿テキスト1本。
- 出力：縦型 1080x1920・15-30秒 mp4。顔出しなし。
- **無料/低コスト構成を優先**：
  - 音声：VOICEVOX（無料・ローカル）
  - 画面：テキスト字幕＋単色/グラデ背景 or スクショ（ffmpeg合成）
  - 字幕焼き込み：ffmpeg
- 有料AI（Runway/Kling/ElevenLabs）採用は要相談（D-003）。
- 投稿自動化（TikTok/Reels/YT）は次段階（各API/規約を調査の上、別SPEC）。

## 規約・安全（厳守）
- 自動化対象は「自分の投稿の予約・投稿」のみ。
- 自動フォロー/自動いいね/自動DM等のエンゲージ操作は**実装しない**（BANリスク）。
- 各プラットフォームのAPI利用規約・レート制限を守る。
