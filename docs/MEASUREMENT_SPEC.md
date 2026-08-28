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

### 4.4 例

```
https://legacraft.jp/?utm_source=lancers&utm_medium=proposal&utm_campaign=first_win_202608
https://legacraft.jp/tools/price-estimator/?utm_source=x&utm_medium=social&utm_campaign=price_tool_202609
```

### 4.5 やらないこと

- 既存の営業URLをこの規約導入と同時に一括で書き換えない。次に出すリンクから適用する。
- UTM に個人情報・案件名・クライアント名を入れない。

---

## 5. GA4 管理画面の設定状況

対象プロパティ: `legacraft.jp`（アカウント 398579084 / プロパティ 542351592）
対象ストリーム: `LEGACRAFT`（ストリーム ID 15489902429 / 測定 ID `G-ZFSK3YRNJL`）
同期日: 2026-08-28（CONVERSION SYSTEM v1 PHASE 1 リリース時点）

このプロパティには `愛知片付け窓口`（aichi-katazuke.com）のストリームも同居している。
本仕様が対象にするのは `LEGACRAFT` ストリームのみ。数値を見るときは必ず絞り込む。

### 5.1 完了済み（DONE）

**カスタム ディメンション 8件** — 管理 → データの表示 → カスタム定義 → カスタム ディメンション
すべてイベントスコープ。パラメータ名はディメンション名と同一。

| ディメンション | パラメータ | 用途 |
|---|---|---|
| `cta_id` | `cta_id` | CTA の識別子（`hero_contact` 等） |
| `cta_position` | `cta_position` | CTA の設置場所（`hero` / `works` / `final` / `footer` 等） |
| `work_id` | `work_id` | 作品スラッグ（`work-03` 等） |
| `work_name` | `work_name` | 作品名（`NESTA ARCHITECTS` 等） |
| `plan` | `plan` | 見積り診断のプラン（`lp` / `small` / `wordpress`） |
| `method` | `method` | 到達経路（`contact_form` / `lead_form` / `contact_page`） |
| `step_name` | `step_name` | 見積り設問名（離脱ステップの特定用） |
| `source_page` | `source_page` | CTA が押されたページ（`top` / `works` / `price-estimator` 等） |

**カスタム指標 4件** — 管理 → データの表示 → カスタム定義 → カスタム指標
すべてイベントスコープ・測定単位「標準」。

| 指標 | パラメータ | 用途 |
|---|---|---|
| `range_min` | `range_min` | 概算レンジの下限（円） |
| `range_max` | `range_max` | 概算レンジの上限（円） |
| `work_position` | `work_position` | TOP ギャラリーでの作品の並び順（1始まり） |
| `step` | `step` | 見積りシミュレーターの設問番号（1〜9） |

測定単位を「通貨」ではなく「標準」にしてある。`range_*` は概算のレンジであって
実売上ではないため、通貨として表示すると収益と取り違えられる。

**除外する参照のリスト** — データストリーム → LEGACRAFT → タグ設定を行う → 除外する参照のリスト

```
参照ドメインが次を含む   legacraft.com
参照ドメインが次を含む   kenvhana510.github.io
```

TOP の DEMO 6本がこの2ドメインにあるため、除外しないと「デモを見て戻ってきた訪問」が
別セッション扱いになり、流入元の attribution が切れる。

`onrender.com` は**追加しない**。Lead API は `fetch` でしか呼ばれず、ユーザーが
そのドメインからサイトへ遷移する経路が存在しないため、参照元として現れない。
追加しても無害だが効果がないので、設定を増やさない。

**内部トラフィックの除外** — データストリーム → タグ設定 → 内部トラフィックの定義／管理 → データフィルタ

```
ルール      HOME-PC
条件        IP アドレスが次と等しい  92.202.94.***（作業環境の IPv4・完全な値は GA4 管理画面のみに保持）
traffic_type internal
データフィルタ Internal Traffic（内部トラフィック／除外）= 有効
```

2026-08-28 に実測した作業環境のグローバル IPv4 と一致することを確認したうえで、
データフィルタを「テスト」から「有効」へ切り替えた。GA4 の警告どおり、
この操作は元に戻せず、遡って適用もされない。

> **このファイルは本番で公開配信される**（https://legacraft.jp/docs/MEASUREMENT_SPEC.md）。
> IP アドレス・認証情報・個人情報の完全な値をここへ書かないこと。上記の IPv4 を
> 伏せ字にしているのはこのため。正確な値は GA4 管理画面側だけが持つ。

> **MONITORING NOTE — IPv6**
> 作業環境は IPv6（`240d:1c:8e:...` 系）も持っている。アクセス経路によっては GA4 が
> IPv6 側を受け取り、上記の IPv4 ルールに一致しない可能性がある。
> 除外が効いているかは、数日後にレポートで `traffic_type = internal` を確認して判断する。
> **確認できていない段階で IPv6 条件を推測で追加しない。** ISP 側で変わる値のため、
> 実際に GA4 が受け取っているアドレスを見てから決める。

### 5.2 未完了（PENDING）

**`generate_lead` をキーイベントに登録**

| 項目 | 状態 |
|---|---|
| 実装（`js/contact-form.js`） | **DONE** |
| Safe mock acceptance | **PASS**（API 成功時のみ発火・失敗時 0 件を実測） |
| 本番への到達 | **WAITING FOR FIRST REAL LEAD** |
| GA4 キーイベント登録 | **PENDING** |

現在の GA4 UI では、キーイベントの登録は**イベント一覧の★をクリックする方式のみ**で、
イベント名を入力して新規作成する導線がない（画面の案内文も「イベント名の横にある
スターを選択します」）。`generate_lead` はまだ一度も GA4 に届いていないため一覧に出ない。

**これはシステムの欠陥ではなく、初回の実イベントが未到達であることによる activation 待ち。**

一覧に出すためだけにテストイベントを送ってはいけない。CV 件数が水増しされ、
これから使い始める指標そのものを汚染する。偽の問い合わせを送るのも同様に禁止。

なお `close_convert_lead` / `qualify_lead` / `purchase` がキーイベントとして登録済みだが、
いずれもデータ受信がなく、本仕様のイベントとは無関係。

---

### 5.3 FIRST REAL LEAD RUNBOOK（初回の本物の問い合わせが入ったら）

最初の1件が来たときにだけ実施する手順。以降は不要。

1. **Lead API 側で受信を確認する**
   lead-system に該当の Lead が保存されているか（`source: "ContactForm"`）。
   保存されていなければ計測ではなく送信側の問題なので、まずそちらを調べる。

2. **GA4 に `generate_lead` が届いたか確認する**
   管理 → データの表示 → イベント →「最近のイベント」タブ、または DebugView。
   `contact_form_submit_success` と対で届いていれば正常。

3. **イベント一覧への反映を待つ**
   新しいイベント名が一覧に出るまで最大24時間かかる。

4. **`generate_lead` をキーイベント化する**
   管理 → データの表示 → イベント →「最近のイベント」タブ →
   `generate_lead` の行の左端にある★（キーイベントのステータスを切り替える）をクリック。
   「キーイベント」タブに★点灯で出れば完了。

5. **完了を記録する**
   本ファイルの 5.2 を DONE に更新し、日付を残す。

6. **SYSTEM を昇格させる**
   `PRODUCTION / OPERATIONAL` → `PRODUCTION / DONE / FREEZE`

> **この手順の完了を待つ間、開発を止める必要はない。**
> キーイベント登録は「問い合わせ件数を GA4 の CV として数える」ためのものであり、
> それ以外の計測（CTA / WORKS / ESTIMATOR / attribution）はすべて既に稼働している。
> 初回リード待ちを理由に次フェーズを止めないこと。

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
