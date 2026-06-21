# STATUS — Cursorからの進捗報告

> Cursorはここに追記（最新を上）。形式：`[日付] T-xxx 状態 — 内容`
> 状態：着手 / 進行中 / 完了 / 要相談 / ブロック

---

[2026-06-22] CW通知 実装完了（AJ）— VPS `/root/aio-os/scripts/cw/` にSlack通知モジュール一式（notify_slack/notify_events/cli/watcher、cron 10分毎・送信なし通知のみ）。**残：社長がVPSの `/root/aio-os/.env` に `SLACK_WEBHOOK_URL` を設定→`cli.py test`で疎通確認／CW手動ログイン後 `save_session.py`（2FA）で返信監視を有効化**。既存スレッド返信の自動送信は不実装（ルール遵守）。

[2026-06-22] ops 完了 — Slack自動通知を**完全自動化**。post-commitフック（`scripts/git-hooks/post-commit`）を有効化し、`handoff/STATUS.md`／`DECISIONS.md` を含むコミットで**自動的に #omochi_デプロイ へ通知**（Claude Code / Cursor 共通・手動呼び出し不要）。VPSでの有効化は `git config core.hooksPath scripts/git-hooks` を1回実行。

[2026-06-19] T-004 完了 — `linkpage/config.json` + `build-linkpage` で `docs/index.html` 生成。GitHub Pages（/docs）デプロイ可能。商品URLは `#` プレースホルダ（要差替え）。

[2026-06-19] T-003 完了 — `src/shorts/`（VOICEVOX+ffmpeg）。`shorts --dry-run` で mp4 1本生成確認（92KB）。VOICEVOX未起動のため音声付きフル生成はエンジン起動後に要確認（D-003無料構成）。

[2026-06-19] T-002 完了 — `generate` コマンド実装（Claude API・themes.txt・note-audit参照・8:1:1比率）。`--dry-run` 確認済み。実API呼び出しは ANTHROPIC_API_KEY 設定後。

[2026-06-19] T-001 完了 — `src/autopost/` 一式実装。`import`/`run --dry-run`/`export-x` 動作確認済み。ThreadsAdapter（Graph API）、XAdapter（無効＋CSV/txtエクスポート、D-002）。実投稿は `.env` トークン未設定のため未実施。

<!-- 例：
[2026-06-20] T-001 完了 — Threadsアダプタ実装、--dry-runでログ出力確認。実投稿はトークン未設定のため未実施。
[2026-06-20] T-003 要相談 — 無料構成でも音質が低い。ElevenLabs(有料)検討可否を相談（DECISIONS D-003）。
-->
