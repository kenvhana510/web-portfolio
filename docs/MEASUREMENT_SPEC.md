# LEGACRAFT 計測仕様（Measurement SSOT）

Version 1.1 — CONVERSION SYSTEM v1 / PHASE 1
最終更新: 2026-08-28（GA4 管理画面の実施状況を同期）

このファイルが計測の正本。イベント名・パラメータ・UTM の書き方を変えるときは、
コードより先にここを更新する。GA4 管理画面の設定もここに記録する。

---

## 1. 送信の仕組み

GA4（`G-ZFSK3YRNJL`）を `js/site-config.js` から読み込む。全10ページが対象。

**gtag.js はイベントを約5秒のバッチにまとめて送る。** そのため、クリックしてすぐ
ページが遷移する内部リンクでは、送信前にページが破棄されてイベントが消える
（2026-08-28 に本番で実測）。

これを避けるため、`site-config.js` は次のように送り分ける。

| クリックの種類 | 送信方法 |
|---|---|
| 同一オリジンへこのタブで遷移する | `sessionStorage` に預け、**遷移先ページの読み込み直後に送る** |
| `target="_blank"` / 中クリック / Ctrl+クリック | その場で送る（ページが残るため届く） |
| `mailto:` / `tel:` / 外部ドメイン | その場で送る |

どちらか一方しか実行しないので、二重送信は構造的に起きない。

**預けたイベントの `page_location` は遷移先ページになる。** どこで押されたかは
`source_page` と `cta_position` で判断する。有効期限は120秒。

他のスクリプトからも使えるように `window.LEGACRAFT_TRACK.defer(name, params)` /
`window.LEGACRAFT_TRACK.send(name, params)` を公開している。

---

## 2. イベント一覧

### 2.1 自動計測（GA4 Enhanced Measurement）

| イベント | 備考 |
|---|---|
| `page_view` | 1訪問1回。SPAではないので二重送信なし |
| `scroll` | 90%到達のみ |
| `form_start` | contact / estimator の両フォームで発火 |
| `click` | 外部リンク（`outbound=true`） |

### 2.2 `cta_click`（全ページ共通）

サイト内のすべての `a[href]` が対象。ページ内アンカー（`#`）と `javascript:` は除外。

| パラメータ | 内容 | 例 |
|---|---|---|
| `cta_id` | CTA の安定した識別子 | `hero_contact` |
| `cta_type` | 遷移先の意味 | `contact` / `works` / `case_study` / `demo` / `estimator` / `service` / `email` / `tel` / `lancers` / `coconala` / `other` |
| `cta_position` | 置かれている場所 | `hero` / `works` / `value` / `flow` / `final` / `header` / `header_nav` / `mobile_nav` / `tool_nav` / `footer` / `result` / `body` |
| `destination` | 遷移先（同一オリジンは相対パス、外部はホスト名のみ。**クエリ文字列は送らない**） | `contact.html` / `nesta.legacraft.com` |
| `source_page` | 押されたページ（`body[data-page]`） | `top` |
| `cta_text` | 40文字までの短いラベル。`data-cta-label` があればそれを優先 | `相談する` |

`cta_id` は `data-cta-id` があればそれ、無ければ `<cta_position>_<cta_type>` から機械的に決める。
**巨大な `textContent` には依存しない。**

主要な `cta_id`:

```
hero_works / hero_contact
header_contact          （ヘッダー常設ボタン）
header_nav_contact / mobile_nav_contact
works_works             （すべての作品を見る）
final_contact / final_estimator
footer_contact / footer_works / footer_service / footer_estimator
estimator_contact       （見積り結果画面の「相談する」）
```

### 2.3 WORKS 作品識別（TOPギャラリーのみ）

`js/works-render.js` の `renderWorksGallery()` が `data-*` 属性で渡す。
`works.html` の `renderWorksGrid()` は FREEZE のため対象外。

| パラメータ | 内容 | 例 |
|---|---|---|
| `work_id` | 作品スラッグ | `work-03` |
| `work_name` | 作品名（`（…）` より前・40文字まで） | `NESTA ARCHITECTS` |
| `work_position` | ギャラリー上の並び順（1始まり） | `1` |
| `cta_action` | `case_study` / `demo` | `case_study` |

`cta_id` は `work_03_case_study` / `work_03_demo` の形になる。

### 2.4 見積りシミュレーター

| イベント | パラメータ | 意味 |
|---|---|---|
| `estimator_view` | `entry_source` | ツールに到達した |
| `estimator_start` | `first_step` | 最初の設問に回答した |
| `estimator_step` | `step`, `step_name` | 各設問の回答（離脱設問の特定用） |
| `estimator_complete` | `plan`, `range_min`, `range_max` | 概算結果が出た |
| `estimate_to_contact` | `method`, `plan`, `range_min`, `range_max` | 結果を見たうえで問い合わせへ進んだ |
| `lead_form_open` / `lead_submit_start` / `lead_submit_success` / `lead_submit_error` | | 結果画面のリードフォーム |

`estimate_to_contact` の `method`:
- `lead_form` … 結果画面の「相談する」を押してフォームを開いた
- `contact_page` … 結果を見たあとに `contact.html` へ移動した（遷移をまたぐため預けて送る）

### 2.5 問い合わせフォーム（contact.html）

| イベント | 発火地点 |
|---|---|
| `contact_form_validation_error` | 入力エラー |
| `contact_form_submit_start` | 送信を開始した |
| `contact_form_submit_success` | Lead API が保存を確定した |
| `contact_form_submit_error` | 送信に失敗した |
| **`generate_lead`** | **Lead API が保存を確定した地点のみ**（成功時に `submit_success` と併せて発火） |

`generate_lead` のパラメータ: `method="contact_form"` / `source_page="contact"` /
`request_type`（相談種別の選択肢ラベル）。

**ボタンを押した時点・validation を通った時点・送信を開始した時点では発火させない。**

---

## 3. 個人情報を送らない（絶対ルール）

GA4 へ送ってよいのは非個人情報のみ。

**送信禁止**: 氏名 / メールアドレス / 電話番号 / 問い合わせ本文 / それらを含む URL・クエリ文字列。

`destination` でクエリ文字列を落としているのはこのため。`cta_text` は40文字で切る。
`request_type` は固定の選択肢ラベルのみで、自由入力を含まない。

---

## 4. UTM 規約

**サイト側のコードとは独立した運用ルール。** 営業リンクを作るときは必ずこの形にする。

### 4.1 チャネル別

| チャネル | `utm_source` | `utm_medium` |
|---|---|---|
| Google 検索（自然流入） | 付けない（GA4標準の Organic Search に任せる） | — |
| ランサーズ | `lancers` | `proposal` |
| クラウドワークス | `crowdworks` | `proposal` |
| ココナラ | `coconala` | `proposal` |
| X | `x` | `social` |
| Instagram | `instagram` | `social` |
| TikTok | `tiktok` | `social` |
| 直接営業（メール） | `direct_sales` | `email` |
| Google 広告 | `google` | `cpc`（自動タグ設定時は付けない） |

**自然流入に UTM を付けてはいけない。** 付けると Organic が Referral に化けて
チャネル分析が壊れる。

### 4.2 `utm_campaign` の命名規則

```
<目的>_<年月>
```

- 目的: `first_win` / `outreach` / `portfolio` / `price_tool` など英小文字とアンダースコアのみ
- 年月: `YYYYMM`

例: `first_win_202608` / `outreach_202609`

### 4.3 `utm_content`（任意）

同じキャンペーン内で出し分けを比較したいときだけ使う。
例: `proposal_a` / `proposal_b` / `profile_link`

### 4.4 PERMANENT PROFILE EXCEPTION（恒久プロフィールURLの例外）

次をすべて満たすリンクに限り、`utm_campaign` の `<YYYYMM>` を必須としない。

- SNS プロフィールの website 欄など、**一度設定したら差し替えない恒久リンク**である
- `utm_source` / `utm_medium` は 4.1 のとおり
- `utm_campaign=profile` 等の固定値で継続して測定する
- そのチャネルに他のキャンペーンが無く、campaign で区別する必要がない

年月を付けると、毎月差し替えなければ古い年月が残り続け、差し替えれば campaign が
分断されてチャネルの時系列が追えなくなる。**定期差し替えによる時系列の分断を避ける**
ことが、この例外の目的。

正式例（X プロフィールの website 欄）:

```
https://legacraft.jp/?utm_source=x&utm_medium=social&utm_campaign=profile
```

作品サイトからの逆導線も同じ理由で恒久リンクだが、こちらは6作品を1チャネルとして
まとめる必要があるため `utm_campaign=portfolio_referral` を固定値で付ける。

```
https://legacraft.jp/?utm_source=<作品slug>&utm_medium=portfolio&utm_campaign=portfolio_referral
```

### 4.5 例

```
https://legacraft.jp/?utm_source=lancers&utm_medium=proposal&utm_campaign=first_win_202608
https://legacraft.jp/tools/price-estimator/?utm_source=x&utm_medium=social&utm_campaign=price_tool_202609
```

### 4.6 やらないこと

- 既存の営業URLをこの規約導入と同時に一括で書き換えない。次に出すリンクから適用する。
- UTM に個人情報・案件名・クライアント名を入れない。

---

## 5. GA4 管理画面の設定

イベント定義とパラメータは本ファイルが正本。**GA4 管理画面側の設定状況
（キーイベント登録・内部トラフィック除外・参照元除外・カスタム定義の作成状況）と
その運用手順は、内部運用SSOTで管理している。**

このファイルは公開配信されるため、運用上の識別子・ネットワーク情報・手順書は置かない。

---

## 6. ファネル定義

```
訪問              page_view
↓
CTA クリック       cta_click (cta_id / cta_position / source_page)
↓
WORKS 作品         cta_click (work_id / work_name / work_position, cta_action=case_study)
↓
CASE STUDY        page_view (?work=work-0X)
↓
見積り開始         estimator_start
見積り完了         estimator_complete (plan / range_min / range_max)
↓
見積り→問い合わせ   estimate_to_contact (method)
↓
CONTACT 到達      page_view + cta_click(cta_id=*_contact) が同一ページに届く
↓
入力開始           form_start
↓
送信成功           contact_form_submit_success
↓
リード             generate_lead   ← キーイベント登録は初回リード到達後（5.2 / 5.3 参照）
↓
受注               GA4 外。lead-system 側の SSOT で管理する
```
