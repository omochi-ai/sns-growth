# SNS収益化プロジェクト — 運用OS

顔出し不要・1人運営・AI活用・ほぼ完全自動化で、SNSから最短収益化する。
目標：月10万円 → 月30万円 → 月100万円。**収益化速度を最優先**。

## 自動投稿（T-001 実装済み）

`src/autopost/` に CLI 実装あり。詳細は [src/autopost/README.md](src/autopost/README.md)。

```bash
npm install
npm run autopost -- import          # Markdown → posts.json
npm run autopost -- run --dry-run   # 動作確認
npm run autopost -- export-x        # Xスケジューラ取込CSV
npm run autopost -- generate --dry-run  # 投稿文生成（API確認）
npm run autopost -- shorts --dry-run --text-file content/sample.txt  # Shorts PoC
npm run build:linkpage              # リンク集約ページ
```

---

## 体制（2層運用）

| 役割 | 担当 | 責務 | 触るファイル |
|---|---|---|---|
| **戦略責任者** | Claude Code | 調査・分析・戦略決定・優先順位付け | `strategy/`・`handoff/TASKS.md`・`handoff/SPEC_*.md`・`content/`・`data/` |
| **実行部隊** | Cursor | 実装・自動化構築・ツール開発 | `src/`・`handoff/STATUS.md` |

---

## ファイルベース連携プロトコル（重要）

戦略 → 実装 → 報告 → 再戦略 のループを「ファイル」だけで回す。

```
Claude Code                         Cursor
   │  ① handoff/TASKS.md に指示       │
   │  ② handoff/SPEC_*.md に仕様      │
   ├────────────────────────────────►│ ③ TASKS/SPEC を読む
   │                                  │ ④ src/ に実装
   │  ⑥ STATUS を読んで次の指示       │ ⑤ handoff/STATUS.md に報告
   │◄────────────────────────────────┤
```

**ルール**
1. Cursorは作業前に必ず `handoff/TASKS.md` と該当 `SPEC_*.md` を読む。
2. Cursorは完了・進捗・詰まりを `handoff/STATUS.md` に追記（タスクIDを明記）。
3. 確定事項・要承認事項は `handoff/DECISIONS.md` に追記（append-only）。
4. 仕様変更が必要なときCursorは勝手に方針を変えず、`STATUS.md` に「要相談」と書いて止める。
5. Claude Codeは `STATUS.md` を読み、`TASKS.md` を更新して次サイクルへ。

### Cursorへの初期プロンプト（コピペ用）
> このリポジトリの `handoff/TASKS.md` を上から実行してください。各タスクの仕様は `handoff/SPEC_*.md` にあります。実装は `src/` に置き、進捗・完了・詰まりは `handoff/STATUS.md` にタスクID付きで追記してください。費用が発生する・破壊的・方針に関わる判断が必要な場合は実装を止めて `handoff/STATUS.md` に「要相談」と書いてください。

---

## エスカレーション（ユーザー承認が必要 = 自律進行しない）

- **危険性が高い操作**（アカウントBANリスク、データ削除、外部公開の不可逆操作）
- **費用発生**（有料API・有料ツール契約・サーバー課金）
- **大きな方針転換**（主力チャネル変更、収益モデルの根本変更）

→ 上記は `handoff/DECISIONS.md` の「🔴 要承認」に記載し、ユーザーの判断を待つ。
それ以外は Claude Code / Cursor が**自律的に進める**。

---

## ディレクトリ

```
.
├─ README.md                 # このファイル（運用ルール）
├─ strategy/                 # 戦略・KPI・ロードマップ（Claude Code）
├─ handoff/                  # 2層連携の心臓部
│   ├─ TASKS.md              # Cursorへの指示キュー
│   ├─ SPEC_autopost.md      # 自動投稿システム仕様
│   ├─ STATUS.md             # Cursorの進捗報告
│   └─ DECISIONS.md          # 確定事項＋要承認ログ
├─ content/                  # 投稿・特典などの実コンテンツ（Claude Code）
├─ data/                     # 分析データ
└─ src/                      # 実装コード（Cursor）
```
