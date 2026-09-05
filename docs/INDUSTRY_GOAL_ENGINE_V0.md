# INDUSTRY × GOAL SITE ENGINE — V0 スキーマ

作成: 2026-09-05 / 状態: **Knowledge Artifact**（実装システムではない）

これは巨大なシステムを作る計画ではない。
CASE 001 で得た判断を、**次のケースで参照できる形**にしただけのもの。
実装に踏み出すのは、エントリが3件以上たまり、共通部分が実データで見えてからでよい。

参照する知識: `DESIGN_KNOWLEDGE_2026-09-05.md` の PATTERN-01〜15

---

## 1. INPUT スキーマ

サイトを設計する前に、必ずこの8項目を確定させる。
**どれか1つでも埋まらないなら、まだ設計に入らない。**

```yaml
industry:            # 業種
goal:                # 目的（1つに絞る。複数なら別サイト or 別ランディング）
audience:            # 誰が読むか
offer:               # 何を、いくらで
traffic:             # どこから来るか（複数可・主従を明記）
primary_conversion:  # 取りたい行動（1つ）
trust_assets:        # 実在する証拠。無いものは書かない
constraints:         # 予算 / 運用体制 / 素材 / 法規制
```

### `trust_assets` の書き方が最重要
ここに**無いものを設計に入れてはいけない**（PATTERN-04）。
選択肢は次のいずれかで、実在するものだけを列挙する。

- `own_work_screenshots` … 自分が作った実物の画面
- `live_demos` … 実際に開けるURL
- `client_logos` … 掲載許可のあるクライアントロゴ
- `testimonials` … 実在する顧客の声
- `team_photo` … 実在する人物写真
- `process_artifacts` … 工程の記録（QA結果・計測値・設計図）
- `credentials` … 資格・受賞・所属

---

## 2. OUTPUT スキーマ

```yaml
site_strategy:            # 何で勝つか（1文）
information_architecture: # セクションの並び
hero_pattern:             # Hero の型
proof_pattern:            # 証拠の出し方
cta_pattern:              # 常設クローム型 / 本文反復型（PATTERN-01）
price_pattern:            # 価格の出し方
faq_pattern:              # FAQ の役割
visual_direction:         # 地の明暗・書体・配色の方針
mobile_strategy:          # 狭い画面での主従
performance_constraints:  # 守る数値
measurement_plan:         # 何を見て判断するか
```

---

## 3. 判断ルール（V0）

INPUT から OUTPUT を導くための、現時点で根拠のあるルールだけを載せる。

| # | 条件 | 出力 | 根拠 |
|---|---|---|---|
| R-1 | `goal = inquiry` かつ 単価を上げたい | `cta_pattern = 常設クローム型`（追従ヘッダーにCTA1つ） | PATTERN-01, 02 |
| R-2 | `goal = signup/purchase` かつ 回転で稼ぐ | `cta_pattern = 本文反復型` | PATTERN-01 |
| R-3 | `trust_assets` に `testimonials` `client_logos` `team_photo` が無い | `proof_pattern = own_work_screenshots + live_demos のみ`。他は作らない | PATTERN-04 |
| R-4 | ブランドが無名 | `hero_pattern = オファーを載せた H1`（大きさより情報） | PATTERN-05 |
| R-5 | ブランドが既知 | H1 なし / 画像主体でよい | PATTERN-05 counterexample |
| R-6 | 制作物・写真を並べるセクションがある | そのセクションは**明転**する。明地専用のアクセント色を別トークンで持つ | PATTERN-06 |
| R-7 | `traffic` に検索（価格意図）を含む | `price_pattern = 金額を先に出す + 「対応しないこと」を併記` | CASE 001（前後比較は未検証） |
| R-8 | 同一ドメインに別のランディングがある | 構造は共有してよいが**散文は書き分ける**。仕様の箇条書きは一致してよい | PATTERN-09 |
| R-9 | 常に | `performance_constraints`: CLS ≤ 0.1 / 転送量 ≤ 2.0MB / 主要画像は WebP + srcset | PATTERN-07 |
| R-10 | 常に | 宣言型の見出しを置いたら、直下に対応する実物を置く | PATTERN-10 |
| R-11 | JS で描画する主要コンテンツがある | 静的にも書き出し、JS が同一マークアップで置換する | PATTERN-11 |
| R-12 | 体験そのものが商品でない | 全画面WebGLは採らない | PATTERN-08 |

**まだルール化できていないもの**（根拠不足なので書かない）:
セクションの最適な並び順 / FAQ の適正問数 / ページ全長の上限 / 価格提示の最適位置。
これらは CASE 001 の公開後計測と、2件目以降のケースが出るまで保留する。

---

## 4. ENTRY 001 — LEGACRAFT公式サイト

### INPUT

```yaml
industry:            Web / Creative Service（Web制作）
goal:                Inquiry Acquisition（問い合わせ獲得）
audience:            個人事業主・中小企業。はじめてサイトを作る層
offer:               ホームページ制作。LP 30,000円〜 / 小規模サイト 80,000円〜 / WordPress 150,000円〜
traffic:             [Direct（主）, SEO（サービス意図・価格意図）, Google Ads, SNS]
primary_conversion:  無料相談（問い合わせフォーム）
secondary_conversion: 3分で概算費用（見積りツール）
trust_assets:
  - own_work_screenshots   # 6作品 × PC/SP = 12枚（実際に撮影）
  - live_demos             # 6件すべて公開URLあり・HTTP 200
  - process_artifacts      # works-data.js に工程・QA結果の記述あり
  # client_logos / testimonials / team_photo は存在しない
constraints:
  - 1人運用。維持できない物量のコンテンツは作らない
  - 実績構築段階。受注実績を示せない
  - 掲載作品はすべて架空クライアントを想定した自主制作（開示必須）
  - 既存ブランド（Deep Green + Gold + 明朝）と Ambient Hero は資産として維持
  - 公開は GitHub Pages。push = 即公開
```

### OUTPUT（適用したルールと結果）

| 項目 | 決定 | 適用ルール |
|---|---|---|
| site_strategy | 料金と「対応しないこと」を先に出し、実物の面積で信用を作る | R-3, R-7 |
| information_architecture | Hero → Problem → Capability → Proof → Price → Flow → FAQ → Final CTA | （ルール化保留。CASE 001 の判断） |
| hero_pattern | オファーを載せた H1（36〜44px）+ 価格レンジ + 2段CTA + 実物画像 | R-4 |
| proof_pattern | 自作の実画面 PC+SP 12枚 + 稼働デモへのボタン。人物・ロゴ・顧客の声は作らない | R-3 |
| cta_pattern | **常設クローム型**（追従ヘッダーに「無料相談」）+ 本文4箇所 | R-1 |
| price_pattern | 3プランの金額 + 「対応しないこと」+ 修正回数 + 納期を TOP に明記 | R-7 |
| faq_pattern | 全国・オンライン前提の7問。地域・対面は `/aichi/` へ送る | R-8 |
| visual_direction | Deep Green + Gold + 明朝を維持。**works セクションのみ Ivory に明転**、明地専用の濃い金 #6B5320 | R-6 |
| mobile_strategy | 追従ヘッダーCTA。TOP は PC 画面を主役、`/aichi/` は SP 画面を主役（主従を逆にして役割分離） | R-1, R-8 |
| performance_constraints | CLS ≤ 0.1 / 転送量 ≤ 2.0MB / WebP + srcset / 画像 lazy | R-9 |
| measurement_plan | `MEASUREMENT_PLAN_2026-09-05.md`。E-1〜E-7 の7仮説 | — |

### RESULT（実測。**効果ではなく状態**）

| 指標 | 改修前 | 改修後 |
|---|---|---|
| 狭い画面のヘッダーCTA | なし | 「無料相談」75×44px |
| 200px超の画像（TOP / `/aichi/`） | 6 / **0** | 7 / 6 |
| 本文文字数（TOP・狭い画面） | 1,569 | 3,353 |
| 本文サイズ | 14px | 16px |
| axe-core serious 違反 | 1（7〜11箇所） | **0** |
| タップ標的 <24px | 1〜2 | **0** |
| 作品画像の転送量 | 618KB（6枚） | 252KB（12枚） |

**CONVERSION の結果はまだ無い。** 公開していないため。
効果の欄を埋めるのは公開後 4〜8週間。

### CONFIDENCE
- 状態の改善: **高**（すべて実測）
- 成果への効果: **未検証**。ここを既知として次のケースに持ち込まない

---

## 5. 次のエントリで検証すべきこと

CASE 001 は「Web制作 × 問い合わせ獲得 × 実績なし」という1条件でしかない。
以下は**まだ一般化できていない**ので、2件目で条件を変えて確かめる。

| 検証したいこと | 変えるべき条件 |
|---|---|
| R-7（価格を先に出す）は業種を問わず有効か | 価格が定形でない業種（設計・コンサル）で試す |
| R-1（常設クローム型）は BtoC でも成立するか | 一般消費者向け・単価が低いケース |
| 明転（R-6）は写真主体のサイトでも必要か | もともと明るい地のブランド |
| `information_architecture` の並びは普遍か | goal を採用・信用形成に変えて比較 |

**次に取るべきケースの候補**（CASE 001 の資産が流用できる順）:
1. `建設・工事 × 採用` … 既存作品に採用LP（work-01）があり、構造の差分が学べる
2. `介護・医療 × 集客` … 既存作品に2件あり、規制のある業種での表現制約が学べる
3. `物流・BtoB × 法人問い合わせ` … 既存作品に1件あり、BtoB の信用構造が学べる
