# TASKS — Cursorへの指示キュー

> 上から順に実行。各タスク完了/詰まりは `STATUS.md` にタスクID付きで報告。
> 費用発生・破壊的・方針判断が必要 → 止めて `STATUS.md` に「要相談」。

凡例：`[ ]`未着手 `[~]`進行中 `[x]`完了 `[!]`要相談

---

## ✅ 完了済み（T-001〜T-004）

### T-001 [x] 自動投稿システム（Threads先行）
- 仕様：`SPEC_autopost.md`
- ゴール：`content/threads-x-posts.md` の投稿を Threads公式API経由で毎日3回（07:00/12:00/20:00 JST）自動投稿。`--dry-run` で動作確認できる状態にする。
- 成果物：`src/autopost/` 一式・`.env.example`・`README`。
- 備考：X投稿アダプタはインターフェースのみ用意し実投稿は無効化（X APIは有料＝要承認、D-002）。実投稿はトークン未設定で未実施。

### T-002 [x] 投稿文ジェネレータ
- 仕様：`SPEC_autopost.md`「フェーズ2」
- ゴール：テーマ配列＋Claude APIで投稿文を量産し `content/threads-x-posts.md` 形式（posts.json）に追記する `generate` コマンド。
- 既存note記事（`data/note-audit.md` の一覧）をネタ元に「ノウハウ8:実績1:誘導1」比率で生成。実API呼び出しは ANTHROPIC_API_KEY 設定後（→ブロッカー）。

### T-003 [x] 自動Shorts生成パイプライン（PoC）
- 仕様：`SPEC_autopost.md`「Shorts」節（※詳細SPECは別途 Claude Code が用意）
- ゴール：1本の投稿テキスト → 画面/テキストベースの縦型動画(15-30秒・顔出しなし・無料/低コスト構成)を自動生成。まずローカルで mp4 を1本生成できるところまで。
- 注意：有料動画AI（Runway/Kling/ElevenLabs等）を使う構成は採用前に `STATUS.md` で要相談（D-003）。無料構成（VOICEVOX＋スクショ/字幕）優先。

### T-004 [x] リンク集約ページ（プロフィールリンク用）
- ゴール：note無し前提でも回る軽量なリンクインページ（無料特典・本命商品・各SNS）を静的HTMLで生成し、無料ホスティング（GitHub Pages /docs）にデプロイできる形に。
- 用途：X/Threads/動画プロフィールから1リンクで全導線へ。
- 備考：商品URLは現在 `#` プレースホルダ（→ブロッカー）。

---

## 🔜 次にやること（未完了）

### T-005 [ ] 自動Shorts 本番化（音声付き＋キャプション＋手動投稿用セット）
- 仕様：`SPEC_shorts.md`
- ゴール：VOICEVOX音声付きmp4を1本完成 → `shorts batch` で量産 → 各動画にキャプション/ハッシュタグtxtを生成。
- 投稿は第1段階＝手動アップロード。自動投稿は規約/コスト調査後（要相談）。
- 無料構成のみ（D-003）。有料要素が要るなら実装前に `STATUS.md` で要相談。

### T-006 [ ] アフィリンク差し込み＆クリック計測（P1）
- 仕様：`strategy/01_affiliate-plan.md`
- ゴール：記事/linkpageのリンクをリダイレクト経由にしてクリック数を記録（無料構成）。ASP登録後に着手（→ブロッカー）。

### T-007 [ ] Threads完全自動投稿（GitHub Actions cron・無料）
- ゴール：Threadsアカウントが育ち次第、`src/autopost` のThreadsAdapterを **GitHub Actions の cron（無料枠）** で毎日3回自動実行。
- トークンは **GitHub Secrets** に格納（リポジトリにコミットしない）。posts.json はリポジトリ管理。
- 前提：Threads公式APIトークン取得（人手・無料）＋ウォームアップ完了（D-010）（→ブロッカー）。
- 効果：Threadsが「**完全無料で完全自動**」になる。Xは無料自動化不可のため対象外（D-002）。VPS不要（D-007回避）。

### T-008 [~] Cursor/VPSからSlackリアルタイム通知
- 仕様：`SPEC_slack-notify.md`／スクリプト：`scripts/notify-slack.sh`（作成済み）
- ゴール：STATUS/DECISIONS更新・要相談・停止のたびに `notify-slack.sh "メッセージ"` を呼び、`#omochi_デプロイ` へ投稿。
- 状況：`notify-slack.sh` のWebhook疎通テストOK（2026-06-22）。post-commitフック（`scripts/git-hooks/post-commit`）有効化済み＝STATUS/DECISIONS を含むコミットで自動通知。
- 残：Cursorは `notify-slack.sh` を**実際の更新フローに組み込む**（STATUS/DECISIONS追記とセットで呼ぶ）。特に**CW関連の進捗・要返信は頻回なので確実に通知**。
- フォールバック：投稿失敗時は STATUS.md に `[要Slack通知]` と明記→Claude Codeが代理投稿。
- ⚠️ Webhook URL は秘密。`.env` のみに置き、`.env.example`・コード・ログに書かない。

---

## ⛔ ブロッカー集約（社長/外部対応待ち）

> 秘密の値は書かない（キー名・設定先のみ）。設定先は各 `.env` ／ GitHub Secrets。

1. CW通知モジュール用に VPS `/root/aio-os/.env` へ `SLACK_WEBHOOK_URL` を設定 →`cli.py test` で疎通確認（STATUS 2026-06-22 の残作業）
2. CW手動ログイン後 `save_session.py`（2FA）で返信監視を有効化
3. `ANTHROPIC_API_KEY` を設定（T-002 の実API実行に必要）
4. Threads公式APIトークン取得＋アカウント育成（T-007 の前提、D-010）
5. linkpage の商品URL差し替え（現在 `#` プレースホルダ、T-004）
6. ASP登録（T-006 の前提）

---

## バックログ（P1以降）
- LINE公式ステップ配信の自動化
- アフィリンク差し込み＆クリック計測
- 投稿パフォーマンス集計ダッシュボード
