# PRODUCTION CANDIDATE — FREEZE

**凍結日時**: 2026-09-05
**ブランチ**: `prototype/ac-hybrid-top`
**凍結コミット**: `cb75744`
**ロールバック先（現在公開中）**: `1119966`

凍結後は **P0 / P1 以外の変更を行わない。**
P0 = 機能停止・不正なDOM・セキュリティ・虚偽表示・主要導線の不能
P1 = CV阻害・モバイル阻害・重大な視覚欠陥・重大な性能後退

---

## 1. コミット系列

| commit | 内容 |
|---|---|
| `1119966` | **現在公開中**（origin/main）。ロールバック先 |
| `c0d3980` | contact のコントラスト AA 修正 + 現状監査 |
| `afe7dd2` | PHASE 4-7 調査（ベンチマーク / Art Direction A/B/C） |
| `21aa754` | A/C ハイブリッド TOP 実装 |
| `c2ed4c6` | 価格表示の誤り・SEO head・a11y・カニバリ修正 |
| `41e7f7e` | /aichi/ に実物の証拠と常設CTA |
| `3d40508` | Critic 指摘（証拠・CTA階層・レイアウト）修正 |
| `0fc1f5f` | Acceptance / 計測計画 / 設計知識 / Industry×Goal V0 |
| `66b6212` | **privacy.html の矛盾（BLOCKER）** と works の開示欠落を修正 |
| `8d38c91` | PHASE 19 の記録と、過去の見積もり2件の訂正 |
| `cb75744` | **凍結点**。hero 画像の二重取得を解消 |

## 2. 公開時の差分

**47ファイル / +2,403行 / −61行**

| 種別 | 内容 |
|---|---|
| HTML 変更 | `index.html`（TOP全面）/ `aichi/index.html` / `about.html` / `works.html` / `case-study.html` / `privacy.html` / `service.html` / `tools/price-estimator/index.html` |
| CSS 新規 | `css/proto-top.css` / `css/proto-aichi.css`（いずれも `[data-page]` に完全スコープ） |
| CSS 変更 | `css/style.css`（accent-soft 上のコントラスト用トークン追加のみ） |
| JS 新規 | `js/proto-works.js` |
| 画像 新規 | WebP 24本（PC 720/1440 × 6作品、SP 390/780 × 6作品） |
| 文書 | `docs/` に9本（監査・ベンチマーク・Art Direction・QA・Acceptance・計測計画・設計知識・Industry×Goal・PHASE19） |
| その他 | `sitemap.xml`（lastmod 2件）/ `.gitignore` |

**触っていないもの**: `js/works-render.js` / `js/main.js` / `js/site-config.js` /
`js/ambient-hero.js` / `js/works-data.js` / `css/works-gallery.css` / `css/ambient-hero.css` /
`css/top-sections.css` / `contact.html` / `404.html` / `robots.txt` / `tools/lp-checklist/`

## 3. 想定される本番の変化

| 対象 | 変化 |
|---|---|
| `/`（TOP） | 全面改修。Hero分割・課題・料金・FAQ の追加、作品を明転面で PC+SP 表示 |
| `/aichi/` | WORKS に SP 実画面6件（横スクロール帯）、ヘッダー常設CTA、本文16px |
| `/works.html` | 「自主制作」の開示文を追加、meta/og/JSON-LD を実数に修正 |
| `/about.html` | 問い合わせ方法の記述を実導線に合わせ、「プロフィール写真準備中」を削除 |
| `/privacy.html` | **お問い合わせフォームの取得項目を追記**（実装との不一致の解消） |
| `/service.html` | 税別の明記、支払いFAQから存在しない窓口を削除 |
| `/case-study.html` | noscript 内の padding 潰れを修正 |
| `/tools/price-estimator/` | 存在しない機能の注記を削除、税別を明記 |
| `/contact.html` | **無変更**（`c0d3980` のコントラスト修正は `css/style.css` 側） |

## 4. 凍結時点の実測

| 項目 | 値 |
|---|---|
| 構造監査 | **検出なし**（重複ID / タグ閉じ / 旧マークアップ / CSSスコープ漏れ / リンク切れ すべて0） |
| ビューポートマトリクス | TOP 13幅・`/aichi/` 4幅・他7ページ×2幅。**横あふれ0 / ヘッダー衝突0 / CTA常時表示 / focus可視** |
| タップ標的 <24px | TOP・`/aichi/` で **0**（他ページは改修前と同値＝回帰ではない） |
| axe-core serious | **0**（本番は1種7〜11箇所） |
| CLS | 狭い画面 **0** / 広い画面 0.005〜0.026（本番 0） |
| 画像 | 壊れ0 / alt欠落0 / hero画像は全幅で**1本だけ取得** |
| 他ページ回帰 | 10ページ × 2ビューポート = **20組すべて差分なし** |
| 計測 | 二重発火0 / イベント欠損0 / `generate_lead` は保存確定時のみ1回 |
| 虚偽・誤認表示 | **0** |

### 既知の環境依存（本番では発生しない見込み）
ローカルの `python http.server` は同時リクエストで接続を切ることがあり、
1920px で最大アセット（`work-03-pc-1440.webp` 81KB）の取得が 3回中1回失敗する。
同ファイルへの curl は **5/5 で 200 / 81,428 bytes** を返し、実ファイルは健全。
GitHub Pages では発生しない見込みだが、**公開後の Smoke Test で必ず確認する**。

## 5. 凍結後に変更してよい条件

1. Final Multi-Critic が **CRITICAL / HIGH** を出した場合
2. 公開前の Smoke で機能停止が見つかった場合
3. 人間が公開判断のために明示的に求めた変更

上記以外の変更は、凍結を解除して再 Acceptance を通す。
