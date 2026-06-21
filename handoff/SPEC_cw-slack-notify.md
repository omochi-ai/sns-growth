# AJ向け指示：CW自動化にSlackリアルタイム通知を実装

> 対象：Yserver / aio-os 上のCW（クラウドワークス）自動化コード（sns-growthとは別リポジトリ）
> 目的：社長がスマホ（Slack `#omochi_デプロイ`）でCWの動きに即気づけるようにする

## ゴール
CWの要所で **Slack Incoming Webhook へ1回POST** する通知を追加する。
（投稿先は既存の `#omochi_デプロイ`。同じwebhookを使う）

## 1. Webhookの設定（秘密情報）
- VPSの環境変数 / `.env` に `SLACK_WEBHOOK_URL` を設定（社長から共有済みのもの）。
- **絶対にコミットしない。** `.env` は `.gitignore` へ。コードやログにURLを出さない。

## 2. 通知関数（ドロップイン）
Python:
```python
import os, requests
def notify_slack(msg: str):
    url = os.environ.get("SLACK_WEBHOOK_URL")
    if not url:
        return
    try:
        requests.post(url, json={"text": msg}, timeout=10)
    except Exception:
        pass  # 通知失敗で本処理を止めない
```
シェル/cron:
```bash
curl -sS -X POST -H 'Content-type: application/json' \
  -d "{\"text\":\"$MSG\"}" "$SLACK_WEBHOOK_URL" || true
```

## 3. 呼ぶ場所（CWの通知ポイント）
優先度順に、該当処理の直後で `notify_slack(...)` を呼ぶ：
1. 📨 **CWで新着返信を検知したとき**（最優先）
   例：`notify_slack("📨 CW返信あり｜案件: {title}｜要対応。テンプレ確認→社長送信")`
2. ✅ **新規応募を送信したとき**
   例：`notify_slack("✅ CW応募送信｜{title}｜報酬: {price}")`
3. 🎉 **受注・入金を検知したとき**
   例：`notify_slack("🎉 CW受注/入金｜{title}｜{amount}")`
4. ⚠️ **自動処理がエラー/停止したとき**
   例：`notify_slack("⚠️ CW自動化エラー｜{detail}")`

メッセージは先頭に絵文字で種別、案件名・金額・必要アクションを1行で。可能ならCWのURLも添える。

## 4. 厳守ルール（不変）
- **CW既存スレッドへの返信は手動のみ。自動送信は絶対にしない**（通知だけ。送信は社長）。
- お金が動く操作（入金/送金/契約確定）は社長の手。AJは通知まで。
- webhook URLはコミット・ログ出力・Slack本文に含めない。

## 5. 動作テスト
実装後、1回テスト送信して `#omochi_デプロイ` に届くこと確認：
```bash
SLACK_WEBHOOK_URL="（VPSの.envの値）" \
  curl -sS -X POST -H 'Content-type: application/json' \
  -d '{"text":"🔧 CW通知テスト from Yserver"}' "$SLACK_WEBHOOK_URL"
```

## 6. 完了報告
実装・テストできたら、CW側の作業ログ（またはこのsns-growthの `handoff/STATUS.md`）に
「CW Slack通知 実装完了（2026-06-xx）」と1行残す。
（sns-growth側のSTATUS更新なら、post-commitフックで自動的に社長へも通知される）
