# PHASE 4-5: DESIGN BENCHMARK RESEARCH / REFERENCE DECOMPOSITION

計測日: 2026-09-05
方法: LEGACRAFT の監査と**同一の Playwright ハーネス**で参考サイトを実測。
印象評価ではなく、同じ物差しで比較できる数値だけを根拠にする。
生データ: `bench.json`（意匠・性能）/ `bench2.json`（Conversion Surface）※scratchpad、リポジトリ外

---

## PHASE 4 RESULT — BENCHMARKS

### 計測できた参考サイト（15件 / 全て HTTP 200）

| # | サイト | カテゴリ | Goal / Audience |
|---|---|---|---|
| 1 | baigie.me | Web/Creative Agency (JP) | BtoB制作受注 / 事業会社の担当者 |
| 2 | lig.co.jp | Web/Creative Agency (JP) | 認知・採用 / 一般 |
| 3 | basicagency.com | Web/Creative Agency (海外) | ブランド提示 / 大手クライアント |
| 4 | goodpatch.com | Design Studio (JP) | 信用形成・採用・受注 / 事業会社 |
| 5 | locomotive.ca | Design Studio (海外) | 作品力の誇示 / 海外クライアント |
| 6 | anthropic.com | AI/Technology | 製品利用・信頼 / 開発者・企業 |
| 7 | linear.app | AI/Technology | サインアップ / 開発チーム |
| 8 | stripe.com | AI/Technology | 利用開始・営業問い合わせ / 事業者 |
| 9 | nakagawa-masashichi.jp | Premium JP Corporate | EC購入 / 一般消費者 |
| 10 | toraya-group.co.jp | Premium JP Corporate | ブランド・購買 / 一般消費者 |
| 11 | smarthr.jp | Conversion-focused | 資料請求・問い合わせ / 人事担当 |
| 12 | freee.co.jp | Conversion-focused | 無料登録 / 個人事業主・中小企業 |
| 13 | igloo.inc | Award / Experimental | 体験そのもの |
| 14 | bruno-simon.com | Award / Experimental | 個人の技術誇示 |
| 15 | kaikado.jp | Premium JP Corporate | ― **計測不能** |

**kaikado.jp は言語選択のスプラッシュ1枚（© 2010）** で、本体サイトが別階層にある。
参考として扱わない（ここに書くのは、憶測で benchmark に混ぜないため）。

**igloo.inc / bruno-simon.com は全画面 WebGL** で DOM テキストが 0〜5文字。
スクロールドキュメントを持たない。数値比較の対象外だが、**後述の反面教師**として意味がある。

---

### 4-1. タイポグラフィ実測

| サイト | H1 | 本文 | 行間比 | 行長(全角換算) | 書体系統 |
|---|---|---|---|---|---|
| baigie | 25px/700 | **16px** | 1.70 | 48字 | Ryo Gothic |
| goodpatch | 16px/500 | **16px** | 1.50 | 46字 | Ryo Gothic |
| anthropic | 61px/700 | **20px** | 1.40 | 17字 | 自社Serif+Sans |
| linear | 64px/510 | 15px | 1.60 | 48字 | Inter |
| stripe | 44px/300 | **16px** | 1.40 | 23字 | Söhne |
| nakagawa | ― | **16px** | 2.00 | 49字 | 游ゴシック |
| toraya | ― | **16px** | 1.60 | 59字 | 游ゴシック |
| smarthr | 16px/400 | **16px** | 1.50 | 84字 | 游ゴシック |
| freee | ― | 13px | 1.50 | 28字 | Noto Sans JP |
| locomotive | 70px/400 | 15px | 1.30 | 89字 | Helvetica Now |
| **LEGACRAFT** | **86px/500** | **14px** | **2.06** | **57字** | Georgia+明朝 |
| **LEGACRAFT /aichi/** | 38px/700 | 14px | 1.85 | 70字 | Georgia+明朝 |

**判明したこと**

1. **LEGACRAFT の H1 86px は計測した全サイト中で最大。** award/experimental の
   locomotive(70px) すら上回る。しかも中身は「未来へ、遺す。」の6文字で、
   オファー情報を1文字も含まない。**サイト最大の面積を、最も情報量の少ない要素に使っている。**
2. **本文 14px は計測群で最小クラス。** 日本語サイトの実測標準は 16px（baigie/goodpatch/
   nakagawa/toraya/smarthr/stripe すべて16px）。LEGACRAFT だけ 2px 小さい。
3. **行間 2.06 も最大。** 小さい字を広い行間で置いているため、
   「面積は使うが読み取れる量が少ない」状態になっている。

→ 1〜3 は独立した好みの問題ではなく、**同じ一つの結果**を生んでいる：
TOPは 7,547px スクロールして本文1,569文字。**情報密度が構造的に低い。**

> ### 訂正（2026-09-05・PHASE 8 で発覚）
>
> **上表の「行長」列は誤りだった。** 計測式で全角1文字を 0.5em として割っており、
> 実際の約2倍の値が出ていた。この列はサイト間の相対比較にしか使えない。
>
> canvas で実字幅を測り直した正しい値：
>
> | | 実測した行長 |
> |---|---|
> | LEGACRAFT TOP（Desktop） | **36文字**（498px / 14.4px） |
> | LEGACRAFT TOP（Mobile） | **25文字**（342px / 14.4px） |
>
> 日本語の可読域は 35〜45文字とされる。**LEGACRAFT の行長は元から適正範囲にあり、
> 欠陥ではなかった。** 当初「57字で長すぎる」と書いたのは、この計算誤りによるもの。
>
> したがって、後続の Art Direction で「行長を縮める」ことは要件から外す。
> **本文 14px → 16px（P-5）だけが実在する指摘**として残る。

### 4-2. 色

| サイト | 地の色 | 系統 |
|---|---|---|
| anthropic | #FAF9F5 | 明 |
| goodpatch | #F0F1F2 | 明 |
| baigie | #F5F5F5 | 明 |
| basic | #F4F4F4 | 明 |
| nakagawa / toraya / stripe / freee / smarthr | #FFFFFF 系 | 明 |
| linear | #08090A | **暗** |
| **LEGACRAFT** | **#22372E** | **暗** |

**Premium Japanese Corporate（nakagawa / toraya）はいずれも明るい地。**
暗い地で成立しているのは linear（開発者向けSaaS）だけ。
LEGACRAFT の Deep Green + Gold は**このカテゴリで明確に差別化されている**が、
同時に「写真・作品画像を見せる面としては不利」という代償を払っている。
→ 捨てる理由にはならないが、**作品を見せる面だけ明転させる**判断が必要。

### 4-3. 性能（「良いデザインは重い」は成立しない）

| サイト | 転送量 | LCP | CLS |
|---|---|---|---|
| basicagency | **81.2MB** | 1,620ms | 0 |
| goodpatch | 27.3MB | 4,576ms | 0.001 |
| locomotive | 19.9MB | 328ms | **0.904** |
| igloo (WebGL) | 15.7MB | 1,200ms | 0 |
| baigie | 14.6MB | **24,364ms** | **0.185** |
| freee | 10.8MB | 760ms | 0.041 |
| nakagawa | 4.0MB | 5,160ms | 0.188 |
| toraya | 3.8MB | 6,220ms | 0 |
| smarthr | 3.6MB | 984ms | 0 |
| stripe | **1.9MB** | 824ms | **0** |
| anthropic | **1.7MB** | 604ms | 0.08 |
| **LEGACRAFT** | **1.4MB** | 2,608ms | **0** |
| linear | **0.6MB** | 4,488ms | **0** |

**LEGACRAFT は転送量で下から2番目、CLS 0。**
最上位のデザイン品質を持つ anthropic / stripe / linear と同じ帯にいる。
一方 baigie は LCP 24.4秒、locomotive は CLS 0.904。
**「デザイン品質のために性能を犠牲にする」は、優れた参照先ほど選んでいない。**
→ LEGACRAFT の技術基盤は資産。Art Direction の選定で**これを手放す案は採らない**。

### 4-4. Conversion Surface（行き先で定義して再計測）

PHASE 1 では文言でCTAを数えていたが、それだと「デモを見る」「事例を見る」まで
CTAに数えてしまい、サイト間比較に使えない。**href の行き先が成約導線かどうか**で
定義し直して再計測した。

`bodyCTA` = ヘッダー/フッターを除く本文中の、ボタン形状の成約CTA。

| サイト（Mobile） | bodyCTA | 最大空白帯 | **モバイル固定ヘッダー内のCTA** | 下部固定CTAバー |
|---|---|---|---|---|
| freee | 6 | 35.2% | **「無料ではじめる」** | なし |
| stripe | 5 | 55.7% | ― | なし |
| baigie | 4 | 92.3% | ― | なし |
| linear | 2 | 82.7% | **「Sign up」** | なし |
| smarthr | 2 | 96.8% | **「お問い合わせ」** | なし |
| toraya | 2 | 88.9% | ― | なし |
| goodpatch | 0 | 100% | **「Contact」** | なし |
| anthropic | 0 | 100% | ― | なし |
| locomotive | 0 | 100% | ― | なし |
| nakagawa | 1 | 99% | ― | なし |
| **LEGACRAFT** | **2** | **83.7%** | **ロゴのみ（CTAなし）** | なし |
| **LEGACRAFT /aichi/** | 2 | 89.4% | **ロゴのみ（CTAなし）** | なし |

**この表が PHASE 1 の結論を1点修正する。**

- **本文CTAの空白帯 83.7% は、このカテゴリではむしろ標準。**
  goodpatch 100% / anthropic 100% / smarthr 96.8% / baigie 92.3%。
  「6,300px 空白だから異常」という PHASE 1 の書き方は**比較の物差しが無い状態での判断だった**。
- **本当の差は固定ヘッダーにある。**
  成約を取りにいく参照先（freee / linear / smarthr / goodpatch）は
  **モバイルの追従ヘッダーにCTAを常時見せている**。
  LEGACRAFT のモバイル追従ヘッダーは **ロゴとハンバーガーだけ**で、
  「相談する」はドロワーの中に隠れている。
  → デスクトップには常時CTAがあり、**モバイルにだけ常設の受け皿が無い。**
- **12サイト中、下部固定CTAバーを使っているサイトは 0。**
  下部固定要素として検出されたものは全て Cookie バナーかメニュートグルだった。

### 4-5. Proof（証拠）の量

| サイト（Mobile） | 200px超の画像 | 本文文字数 | ロゴウォール | FAQ | 事例 |
|---|---|---|---|---|---|
| smarthr | 46 | 3,488 | 7 | ✓ | ✓ |
| goodpatch | 43 | 3,468 | 0 | ― | ✓ |
| nakagawa | 34 | 3,482 | 1 | ✓ | ― |
| stripe | 27 | 10,550 | 0 | ― | ✓ |
| baigie | 24 | 3,317 | **11** | ✓ | ✓ |
| basic | 18 | 429 | 5 | ― | ― |
| freee | 9 | 935 | 3 | ― | ✓ |
| **LEGACRAFT** | **6** | **1,569** | 0 | **✗** | ✓ |
| **LEGACRAFT /aichi/** | **0** | 2,424 | 0 | ✓ | ✓ |

**/aichi/ は「制作物は、中身をすべて公開しています」と見出しで宣言しながら、
200px を超える画像が1枚も無い。** 参照群の下限（freee 9枚）にも届いていない。

### 4-6. Hero のファーストビュー情報量

| サイト | FV内テキスト | FV内CTA |
|---|---|---|
| anthropic / linear | 260字（上限） | linear✓ / anthropic✗ |
| stripe | 87字 | ✓ |
| baigie | 148字 | ✓ |
| goodpatch | 140字 | ✓ |
| **LEGACRAFT** | **114字** | ✓ |
| **LEGACRAFT /aichi/** | 200字 | ✓ |
| toraya / lig | 0字 | ― |

TOP の 114字 は極端に少なくはないが、**そのうち大半をブランドコピーが占め、
「何を・いくらで・誰が」に使われている文字数が少ない**。
`/aichi/` の 200字 の方が正しい形をしている。

### 4-7. モーション

`prefers-reduced-motion` に対応した CSS ルールを持つサイト:
baigie ✓ / lig ✓ / goodpatch ✓ / locomotive ✓ / anthropic ✓ / linear ✓ / **LEGACRAFT ✓**
非対応: basic / stripe / nakagawa / toraya / smarthr / freee

→ LEGACRAFT は上位半分。**Ambient Hero の reduced-motion 対応 + watchdog は
参照群の中でも上等な実装。維持する。**

---

## PHASE 5 RESULT — EXTRACTED_PATTERNS

個別サイト一覧では終わらせず、共通構造として抽象化する。

### P-1. Conversion Surface は「2つの戦略」しか無い

実測すると、参照群は例外なくどちらかに分類できた。

- **戦略α: 常設クローム型** — 追従ヘッダーにCTAを常時1つ置き、本文はCTAを置かない。
  （goodpatch, anthropic, linear, smarthr）本文CTA 0〜2、空白帯 82〜100%。
  デザイン主導のサイトが選ぶ。**ページの美しさを壊さずに受け皿を確保する方法。**
- **戦略β: 本文反復型** — セクションの切れ目ごとにCTAブロックを差し込む。
  （stripe 5, freee 6）空白帯 35〜56%。コンバージョン主導のサイトが選ぶ。

**両方やらない、が最悪。** LEGACRAFT のモバイルは現在ここにいる
（ヘッダーCTA無し・本文CTA 2・空白帯 83.7%）。

### P-2. 下部固定CTAバーは、品質の高い参照群では使われていない

12サイト中 0。これは「日本のLP文法」であって、
デザイン品質で選ばれるサイトの文法ではない。
**P1仮説を「下部にstickyバーを足す」と実装すると、LEGACRAFT の価格帯上げ狙いと逆行する。**

### P-3. 信用は「実物の面積」で作られている

証拠として機能しているのは、
① 実際の制作物の大きな画像（goodpatch 43 / smarthr 46 / baigie 24）
② クライアントのロゴウォール（baigie 11）
③ 顔の見える写真（baigie はチーム写真をHeroに使っている）
のいずれか。**文章で「品質が高い」と書いているサイトは無い。**

LEGACRAFT は ①が6枚（/aichi/ は0枚）、②③は無い。
※②③は実在しない以上、捏造してはならない（本ディレクティブ §6）。
→ **LEGACRAFT が正当に増やせるのは①だけ。だから①を最大化する。**

### P-4. H1 は「大きさ」ではなく「情報」で殴っている

H1が大きい参照先（anthropic 61 / linear 64 / locomotive 70）は、
その大きな文字で**製品が何であるかを言い切っている**。
「AI research and products that put safety at the frontier」
「The product development system for teams and agents」

一方 baigie 25px / goodpatch 16px は、H1を小さくして
**Heroの主役を写真と本文に譲っている**。

**86px を使ってブランド標語だけを出す使い方は、どちらの型にも属していない。**

### P-5. 日本語本文は 16px / 行長35〜45字 が実測標準

例外は freee(13px) だけで、freee は画像主体でテキストを読ませない設計。
**読ませて信用を作るタイプのサイトは全て 16px。**

### P-6. 明るい地が「証拠を見せる」ための既定値

Premium JP（nakagawa, toraya）も、Agency（baigie, goodpatch, basic）も、
AI/Tech（anthropic, stripe）も明るい地。暗い地は linear のみ。
**暗い地は「製品UIを光らせる」ためには機能するが、「制作物の実画面を並べる」用途では
作品側が暗く沈む。**

### P-7. 性能は差別化要因ではなく「デザイン品質の前提」ではない

参照群の実測は 0.6MB〜81.2MB、LCP 328ms〜24.4秒と大きくばらつく。
**性能はデザイン品質と相関していない。**
だからこそ、LEGACRAFT が既に持つ CLS 0 / 1.4MB は
「守るべき制約」であって「Art Direction を諦める理由」ではない。

### P-8. 全画面WebGLは「受け皿ゼロ」と同義

igloo.inc / bruno-simon.com は DOM テキスト 0〜5文字、スクロール無し、
CTA 0、igloo は 15.7MB。**体験として一級だが、事業サイトの型ではない。**
LEGACRAFT が Cinematic 表現を強める方向に振る場合、この崖が実在する。

---

## LEGACRAFT に必要 / 不要 / 現行資産を活かせるもの

### 必要なもの（実測で欠けが確認できたもの）
- モバイルの**常設CTA（追従ヘッダー内）** ← P-1, 現状ロゴのみ
- **制作物の大きな画像の量** ← P-3, /aichi/ 0枚
- **本文 14px → 16px** ← P-5（行長は訂正済みで問題なし）
- **TOPの料金とFAQ** ← /aichi/ にはあり、TOPに無い
- **H1に情報を載せる** ← P-4, 現状86pxで6文字

### 不要なもの（参照群にあるが LEGACRAFT が真似すべきでないもの）
- 下部固定CTAバー（P-2、参照群 0件）
- ロゴウォール・チーム写真・導入企業ロゴ（実在しない。捏造禁止）
- 全画面WebGL（P-8）
- 大量の記事コンテンツ（baigie/stripe の物量は1人体制では維持不能）
- 81MB級のリッチ表現（P-7、性能資産を捨てる価値がない）

### 現行資産で活かせるもの
- **CLS 0 / 1.4MB / reduced-motion対応**（参照群上位と同等）
- **Ambient Hero v1**（watchdog付き。参照群でもここまで丁寧な実装は少ない）
- **Deep Green + Gold + 明朝**（このカテゴリで唯一の差別化。linear型の成功例がある）
- **GA4 計測基盤**（改善の効果測定ができる。参照はできないが自社の武器）
- **/aichi/ の情報設計**（Problem→Approach→Works→Price→Area→Flow→FAQ→CTA）
- **price-estimator ツール**（「3分で概算費用」= 低摩擦の入口。参照群でいう資料DLの位置）
