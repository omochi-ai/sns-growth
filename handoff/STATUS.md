# STATUS — Cursorからの進捗報告

> Cursorはここに追記（最新を上）。形式：`[日付] T-xxx 状態 — 内容`
> 状態：着手 / 進行中 / 完了 / 要相談 / ブロック

---

[2026-06-19] T-004 完了 — `linkpage/config.json` + `build-linkpage` で `docs/index.html` 生成。GitHub Pages（/docs）デプロイ可能。商品URLは `#` プレースホルダ（要差替え）。

[2026-06-19] T-003 完了 — `src/shorts/`（VOICEVOX+ffmpeg）。`shorts --dry-run` で mp4 1本生成確認（92KB）。VOICEVOX未起動のため音声付きフル生成はエンジン起動後に要確認（D-003無料構成）。

[2026-06-19] T-002 完了 — `generate` コマンド実装（Claude API・themes.txt・note-audit参照・8:1:1比率）。`--dry-run` 確認済み。実API呼び出しは ANTHROPIC_API_KEY 設定後。

[2026-06-19] T-001 完了 — `src/autopost/` 一式実装。`import`/`run --dry-run`/`export-x` 動作確認済み。ThreadsAdapter（Graph API）、XAdapter（無効＋CSV/txtエクスポート、D-002）。実投稿は `.env` トークン未設定のため未実施。

<!-- 例：
[2026-06-20] T-001 完了 — Threadsアダプタ実装、--dry-runでログ出力確認。実投稿はトークン未設定のため未実施。
[2026-06-20] T-003 要相談 — 無料構成でも音質が低い。ElevenLabs(有料)検討可否を相談（DECISIONS D-003）。
-->
