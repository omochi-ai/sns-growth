# リンク集約ページ（T-004）

X / Threads / 動画プロフィールから1リンクで全導線へ誘導する静的ページ。

## 使い方

1. `linkpage/config.json` の URL を実際の商品・SNSリンクに更新
2. ビルド:

```bash
npm run build:linkpage
```

3. 出力: `docs/index.html`

## GitHub Pages デプロイ（無料）

1. リポジトリ Settings → Pages → Source: **Deploy from branch**
2. Branch: `main` / Folder: **`/docs`**
3. `docs/index.html` をコミット・push

数分後 `https://<username>.github.io/<repo>/` で公開。

## note 無し運用

- 無料特典・商品リンクは `#` のままだと未設定。Gumroad / BOOTH / Google Drive 等の直リンクに差し替え
- note リンクは `optional: true` — URL未設定時はページに「未設定」表示のみ（必須ではない）
