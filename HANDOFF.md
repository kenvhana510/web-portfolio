# HANDOFF — web-portfolio (LEGACRAFT Portfolio Top)

最終更新：2026-08-02

このリポジトリには README.md も HANDOFF.md も存在しなかったため、本ファイルを新規作成した。
今後の引き継ぎ事項はこのファイルに追記していく。

---

## WEB PRODUCTION SSOT（2026-08-22 確定）

**本番Web正本（Single Source of Truth）＝ このリポジトリ `~/web-portfolio` のみ。**

`https://legacraft.jp/` は GitHub Pages（`github.com/kenvhana510/web-portfolio`）から配信されている。
サイトのHTML/CSS/JSを変更する場合は、必ずこのリポジトリを編集する。

### ARCHIVED / DO NOT EDIT

`~/Desktop/web-business-launch/site/` にサイトHTMLの**古い重複コピー**が存在する。

- 本番と乖離している（例：`index.html` の `<title>` が旧版の「… | Web制作ポートフォリオ」のまま。
  本番は「… | LEGACRAFT」。canonical も `kenvhana510.github.io/web-portfolio/` を指したまま）
- 旧コピー側にのみ `faq.html` が存在するが、**本番には存在しない**（`https://legacraft.jp/faq.html` は404）
- **編集しても本番には一切反映されない**

このため旧コピーは **ARCHIVED / DO NOT EDIT** として扱う。
削除・移動はしない（履歴・経緯の参照用として残す）。

### 判別方法（迷ったとき）

```
git remote -v   # → github.com/kenvhana510/web-portfolio.git であれば正本
```

canonical が `https://legacraft.jp/...` になっているかでも判別できる。

---

## 直近の作業

### 1. LEGACRAFTブランド統一（コミット `b3512b5`）
`legacraft/brand/brand-guidelines.md` Version 1.0 に基づき、汎用的な
"Web Creation Portfolio"（ライトモード・青アクセント・サンセリフ）から
LEGACRAFTのダークモード・デザインシステム（Deep Green / Gold / Ivory、
セリフ体、角丸なし）へ全8ページを統一した。見出し階層の欠陥（複数ページで
`<h1>` が存在せず `<h2>` がページタイトルになっていた）、work-thumbnail /
case-study画像がalt無しのCSS背景画像だった点なども修正。

### 2. 実ブラウザQA（コミット `4759f21`）
Claude-in-Chrome MCP拡張はこの環境では利用不可のため、headless Chrome を
Chrome DevTools Protocol（CDPのWebSocket経由、`Emulation.setDeviceMetricsOverride`）
で直接操作してQAを実施した。

**重要な技術メモ**：このマシンでは `chrome.exe --headless=new --window-size=W,H`
の `--window-size` が実際のCSSビューポート幅を反映しない（実測では最小
500px程度にクランプされる。768/1024指定時も要求値より約26px小さい値になる）。
正確なモバイル幅の検証には CDP の `Emulation.setDeviceMetricsOverride` を
使う必要がある。今後この環境でスクリーンショットQAを行う場合は同じ問題に
当たるため、CDP経由の方法を使うこと（本コミットの実装参照）。

**検証したビューポート**：320 / 375 / 390 / 414 / 768 / 1024 / 1440 / 1920px
（全7ページ × 各幅で横スクロール・コンソールエラーをチェック）。

**発見・修正したバグ**：
- `.nav-cta`（ヘッダーの「相談する」ボタン）が `.btn` の
  `display:inline-flex`（無条件・後方定義）と同じ詳細度で負けており、
  900px未満でも常に表示されてLEGACRAFTロゴタイプと重なっていた。
  `.btn.nav-cta` に詳細度を上げて解消。
- `case-study.html` の320px幅で、外部サイトへの長いボタンラベルと
  前後作品ナビゲーションボタンが横に収まらず38pxの横スクロールが発生。
  `white-space:normal` とnav行の `flex-wrap:wrap` で解消。

修正後、全ビューポート×全ページで横スクロール・コンソールエラーともにゼロを確認。

**当初「報告されたバグ」について**：コーディネーターから「375pxでヒーロー
テキストが右端で切れる」という報告があったが、調査の結果これは
`--window-size` がこの環境で真の375px幅を再現できないことによる
スクリーンショット手法側のアーティファクトで、CDPで正しく375px幅を
再現すると本文テキストは正常に折り返されていた（実際のCSSバグではなかった）。
ただしヘッダーの重なりバグ（上記）は実在した。

### 3. インタラクション・アクセシビリティ確認
CDP経由でFAQアコーディオン（`<details>`クリック）、モバイルメニュー
トグル（ハンバーガー→×アイコンの切り替え、`aria-expanded`）、
`prefers-reduced-motion: reduce` 時の `.reveal` 要素表示、を確認。
いずれも正常動作。ホバー/フォーカス状態はCSSレビューで確認したが、
実際のキーボードTab操作の実機テストはこの環境では未実施
（`claude-in-chrome` 拡張が利用可能になれば実施可能）。

### 4. フォント確認
Trajan Proはこのマシンにインストールされていないため、英字見出しは
フォールバックの Georgia で表示される（ブランドガイドライン上も
想定内の代替）。Noto Serif JP は Google Fonts からネットワーク経由で
正常に読み込まれることをNetwork.responseReceivedイベントで確認済み。

### 5. OGP完成（コミット `4670d85`）
`og:image` がSVG（`ogp.svg`）を指しており、TwitterなどSVGを正しく
プレビューできないクローラーがあるため、同デザインを `images/ogp.png`
（1200×630、headless ChromeでSVGをレンダリングしてPNG化）として書き出し、
全6ページの `og:image` / `twitter:image` / JSON-LD の `image` フィールドを
差し替え、`og:image:type` / `width` / `height` を追加した。

## 既知の残課題（未対応・理由付き）

- **Lighthouseが本環境に存在しない** — インストールはせず、未実施として明記。
- **キーボードTab操作の実機確認は未実施** — headless CDPでは現実的なTab
  フォーカス移動の目視確認が難しいため。`claude-in-chrome` 拡張が使える
  セッションで再確認を推奨。
- **ホバー状態の実ブラウザ目視確認は未実施** — CSS上は `:hover` /
  `:focus-visible` を定義済みで、CDPでcomputed styleの静的確認はしたが、
  実際のマウスホバーによる視覚的トランジションはheadless環境の制約で
  未確認。
- `sitemap.xml` / `robots.txt` は未整備（前回セッションでも「時間があれば」
  として指摘済み、今回も対応せず）。

## Gitコミット履歴（今回のセッション）

```
4670d85 fix: complete OGP metadata and PNG image
4759f21 fix: resolve mobile header overlap and case-study button overflow
b3512b5 feat: align portfolio with LEGACRAFT brand system
```

**重要**：上記3コミットはすべてローカルのみ。`git push` は実行していない。
このリポジトリは元々 `origin/main` から1コミット進んだ状態（`4f407d8`）
だったが、今回の3コミットはその上にさらに積まれているため、
現在は `origin/main` から4コミット進んだ状態。デプロイ・公開は一切
行っていない。
