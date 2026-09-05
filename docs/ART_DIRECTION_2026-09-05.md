# PHASE 6-7: ART DIRECTION A/B/C / COMPARISON / SELECTION

策定日: 2026-09-05
根拠: `docs/AUDIT_2026-09-05.md`（自社実測）+ `docs/BENCHMARK_2026-09-05.md`（参照15サイト実測）
状態: **PHASE 7 まで。実装は未着手。本番未変更。**

3案はいずれも参照サイトの模倣ではなく、
Reference → Pattern（P-1〜P-8）→ Principle → LEGACRAFT Original の変換を経ている。

---

## 共通前提（3案すべてが従う制約）

| 制約 | 理由 |
|---|---|
| CLS 0 / 転送量 2MB 以内を維持 | 実測で参照群上位。手放す価値がない（P-7） |
| `prefers-reduced-motion` 対応を維持 | 参照群の上位半分。既に実装済み |
| 人物写真・導入企業ロゴ・第三者の声を作らない | 実在しない。ディレクティブ §6 |
| 下部固定CTAバーを使わない | 参照群12件中0件（P-2） |
| GA4 計測イベントを壊さない | 効果測定の唯一の手段 |
| `c0d3980`（contrast fix）を含めて統合判定 | 単独 push しない |

---

# DIRECTION A ─ 「工房」/ THE WORKSHOP

> **成果物そのものを主役にする。文字で品質を語るのをやめ、実物の面積で語る。**

| 項目 | 内容 |
|---|---|
| **Concept** | LEGACRAFT の商品は「作ったサイト」である。ならばサイトの実画面が最大の面積を取るべき。ブランドコピーは作品の隣に添える |
| **Target Audience** | 「頼む前に、この人の作るものを見たい」個人事業主・中小企業 |
| **Emotional Goal** | 安心（この品質で、この値段なら分かる） |
| **Visual Language** | 作品の実画面をフルブリードで見せる。枠・影・カードをやめ、画像を面として置く（現行 works-gallery の思想を全面化） |
| **Typography** | 見出し=明朝（Noto Serif JP）／本文=ゴシック16px・行長40字・行間1.75。H1 86px → **40〜48px** |
| **Color Logic** | Deep Green + Gold を維持。ただし**作品セクションだけ Ivory 地に反転**し、作品が沈まないようにする（P-6） |
| **Image Direction** | 既存6作品を PC+SP 両方、複数カット。加えて「設計→デザイン→実装→QA」の中間生成物。人物は使わない |
| **Hero Direction** | 作品画像を背景に、H1 は事実文（例:「WordPressサイトを、30,000円から。構成からQAまで1人で。」）+ CTA |
| **現行 Cinematic / Ambient Hero** | **縮小**。背景アンビエントは残すが主役を降りる。Hero の主役は作品画像に移す |
| **Motion Direction** | reveal のみ。LCP 経路に演出を載せない |
| **Content Rhythm** | 作品 → 料金 → 進め方 → FAQ → CTA。セクション余白 288px → 200px |
| **CTA Strategy** | 戦略α（P-1）: 追従ヘッダーに「無料相談」を**モバイルでも常時表示**。本文CTAは料金直後とFAQ直後の2箇所 |
| **Proof Strategy** | ①作品画像の量（現状6→24枚以上）②各作品の意図・工程・QA結果 ③自主制作である旨の開示は維持 |
| **Pricing Strategy** | TOP に料金表を出す。3プランの金額と「対応しないこと」を並記 |
| **Mobile Strategy** | 追従ヘッダーCTA。作品は縦1列でフル幅。本文16px |
| **Conversion Fit** | ◎ 実測欠損（証拠・料金・モバイルCTA）を全て埋める |
| **Brand Fit** | ○ 配色と明朝は維持。ただし「余白の格」はやや後退 |
| **Originality** | ○ 参照群に同型はあるが、Deep Green + 明朝 + 作品全面は他に無い |
| **Implementation Cost** | **中**（新規撮影不要。既存作品の追加キャプチャと画像最適化が主） |
| **Performance Risk** | 中（画像が増える。WebP + srcset が前提条件） |
| **Reuse of Current Assets** | works-gallery.css / ambient-hero.css / design-system / GA4 / price-estimator |
| **Expected Business Impact** | 高。「作品を見て頼む」層に最短で届く |

---

# DIRECTION B ─ 「継承」/ THE HEIRLOOM

> **「未来へ、遺す。」を本気で貫く。制作会社ではなく、工芸として売る。**

| 項目 | 内容 |
|---|---|
| **Concept** | 虎屋・中川政七商店の系譜。余白・明朝・素材感で「格」を作り、価格競争から降りる |
| **Target Audience** | 価格ではなく作り手で選ぶ層。士業・クリニック・老舗・ブランド事業者 |
| **Emotional Goal** | 敬意（安いから頼むのではない） |
| **Visual Language** | 余白が主役。1画面1メッセージ。罫線と余白だけで階層を作る |
| **Typography** | 全面明朝。本文16px・行長38字・行間1.9。H1 86px → **64px**（縮小はするが大きさは残す） |
| **Color Logic** | **主戦場を明転**。Ivory #EDE4CE 地 + Deep Green 文字。ダークは Hero と Final CTA のみ（P-6 に従う） |
| **Image Direction** | 作品は少数精鋭。1作品を大きく、間を空けて。素材・質感の寄り |
| **Hero Direction** | 現行 Ambient Hero を継承。コピーは「未来へ、遺す。」+ オファー1文を追加 |
| **現行 Cinematic / Ambient Hero** | **発展**。この案の中核資産。ただし H1 を 64px に落とし、下にオファー文を必ず置く |
| **Motion Direction** | 極小。フェードのみ。動きで語らない |
| **Content Rhythm** | 思想 → 作り方 → 作品 → 料金の考え方 → 相談。セクション余白は現行 288px を維持 |
| **CTA Strategy** | 戦略α。追従ヘッダーに細い「相談する」。本文CTAは最後の1箇所のみ |
| **Proof Strategy** | 「工程を全部見せる」こと自体を証拠にする。作品数より1件の深さ |
| **Pricing Strategy** | 表を出さない。「料金と対応しないことを先に出す」を**文章の思想として**前面に |
| **Mobile Strategy** | 1画面1メッセージ。スクロールは長くなることを許容 |
| **Conversion Fit** | **△** Premium JP 参照群は本文CTA 0〜1・空白帯 88〜100%。**現在の弱点をむしろ強化してしまう** |
| **Brand Fit** | ◎ 現行ブランドの最も純粋な発展形 |
| **Originality** | ◎ このカテゴリで唯一無二になれる |
| **Implementation Cost** | 中（配色の明転は design-system の token 差し替えで届く範囲） |
| **Performance Risk** | 低 |
| **Reuse of Current Assets** | ambient-hero.css（中核）/ 配色 / 明朝 / design-system |
| **Expected Business Impact** | 中。単価は上がるが件数が出ない。**実績0件・問い合わせ0件の現段階では検証に時間がかかりすぎる** |

---

# DIRECTION C ─ 「設計図」/ THE BLUEPRINT

> **売り物は「作られたサイト」ではなく「作れる能力」。工程と構造を見せる。**

| 項目 | 内容 |
|---|---|
| **Concept** | LEGACRAFT の実体は AI/自動化を含む制作能力。anthropic / linear / stripe の情報設計に学び、能力を構造で提示する |
| **Target Audience** | 「誰が・どうやって作るか」で判断する層。BtoB、事業会社の担当者 |
| **Emotional Goal** | 信頼（工程が全部見えている） |
| **Visual Language** | 情報の構造そのものを意匠にする。表・工程図・数値・コード断片。装飾を足さない |
| **Typography** | 見出し=明朝／本文=ゴシック16px／数値・工程=モノスペース。H1 → **48px** で事実文 |
| **Color Logic** | 現行ダークを維持（linear が唯一の成功例）。面の階層を token で再設計し、作品画像だけ明るい面に置く |
| **Image Direction** | 実画面 + 工程の可視化（Lighthouse結果・QAチェックリスト・実装差分・設計図） |
| **Hero Direction** | 事実の見出し + 2段CTA（無料相談 / 3分で概算費用）+ 料金レンジ |
| **現行 Cinematic / Ambient Hero** | **別用途へ**。TOP からは外し、CASE STUDY と WORKS 詳細の導入演出に転用（削除はしない） |
| **Motion Direction** | 機能的な動きのみ。状態変化を伝えるためだけに使う |
| **Content Rhythm** | Problem → Capability → Process → Proof → Price → FAQ → CTA（**/aichi/ の構造を TOP に昇格**） |
| **CTA Strategy** | 戦略α + β の中間。追従ヘッダーCTA + セクション末に2〜3箇所 |
| **Proof Strategy** | 工程・品質の計測結果を証拠にする。人物写真を使わずに信用を作れる唯一の型 |
| **Pricing Strategy** | 料金表 + 「対応しないこと」を TOP に明記 |
| **Mobile Strategy** | 追従ヘッダーCTA。表は横スクロールコンテナ |
| **Conversion Fit** | ◎ |
| **Brand Fit** | ○ ダークは維持されるが「未来へ、遺す。」の情緒は後退 |
| **Originality** | ◎ 1人制作 × 工程可視化は日本の小規模制作で希少 |
| **Implementation Cost** | **大**（新規コンテンツの執筆量が最も多い。工程可視化の素材を作る必要がある） |
| **Performance Risk** | 低 |
| **Reuse of Current Assets** | /aichi/ の情報設計 / design-system / GA4 / price-estimator / 配色 |
| **Expected Business Impact** | 高。ただし**立ち上がりが遅い**（コンテンツ制作が律速） |

---

# PHASE 7 RESULT — COMPARISON

| 評価軸 | A 工房 | B 継承 | C 設計図 |
|---|---|---|---|
| 実測で見つかった欠損を埋めるか | **5/5** | 2/5 | **5/5** |
| Conversion Fit | ◎ | △ | ◎ |
| Brand Fit（現行資産の尊重） | ○ | ◎ | ○ |
| Originality | ○ | ◎ | ◎ |
| 実装コスト | 中 | 中 | **大** |
| 新規コンテンツ執筆量 | 小 | 中 | **大** |
| 性能リスク | 中 | 低 | 低 |
| 効果が出るまでの時間 | **短** | 長 | 中 |
| 1人体制での維持可能性 | ○ | ◎ | △ |
| Ambient Hero の扱い | 縮小 | 発展 | 別用途 |

**埋めるべき5つの欠損**（PHASE 1 + PHASE 4 実測）:
①モバイル常設CTA ②作品画像の量 ③本文16px/行長 ④TOPの料金 ⑤TOPのFAQ

**B が落ちる理由（好みではなく実測）**
Premium JP 参照群（nakagawa / toraya）は本文CTA 0〜1、空白帯 88〜100%。
B はこの型に寄せる案なので、**LEGACRAFT の最大の弱点である
「モバイルに受け皿が無い」をむしろ正当化してしまう**。
問い合わせ0件・実績0件の現段階で、検証に最も時間がかかる案でもある。

**C が第一候補にならない理由**
方向性は正しく、Expected Impact も高い。しかし**律速が実装ではなく執筆**にある。
工程可視化の素材（Lighthouse結果・QAチェックリスト・設計図）は
現時点で公開可能な形で存在せず、作るところから始まる。
`Done is better than perfect` の観点で、最初の一手には重すぎる。

---

# RECOMMENDED_DIRECTION

## **DIRECTION A「工房」を基幹とし、情報構造は C の骨格を採用する**

正式名: **A/C ハイブリッド ─ 「工房（設計図の骨格つき）」**

- **見せ方（Art Direction）= A**: 作品の実画面が最大面積を取る
- **並べ方（Information Architecture）= C**: Problem → Capability → Proof → Price → FAQ → CTA
- **ブランド（配色・明朝・Ambient Hero）= 現行維持**（B の資産をここで守る）

## REASON

1. **実測で見つかった5つの欠損を、新規素材をほぼ作らずに全部埋められる唯一の案。**
   作品画像は既存6サイトから追加キャプチャするだけで増やせる（撮影不要・捏造なし）。
2. **/aichi/ が既に C の骨格を持っており、TOP に移植するだけで済む。**
   ゼロから設計しない。既に社内にある正解を横展開する。
3. **最大の測定済み欠損は「証拠の面積」**（/aichi/ は 200px超の画像が0枚、
   参照群の下限 freee ですら9枚）。これは A が最も直接的に解く。
4. **ブランド資産を捨てない。** Deep Green + Gold + 明朝 + Ambient Hero は
   参照群で唯一の差別化であり、A は配色を維持したまま
   「作品セクションだけ明転」で P-6 の問題を回避できる。
5. **1人体制で維持できる。** C は執筆量、B は世界観の一貫性維持がそれぞれ重い。

## CURRENT_PRIMARY_CTA（再評価の結果）

参照群は例外なく**2段構え**だった（baigie: 資料DL / お問い合わせ、
freee: 無料ではじめる / 相談、smarthr: 資料請求 / お問い合わせ）。

LEGACRAFT は既に両方の部品を持っている。定義を確定する。

| 段 | CTA | 位置 | 摩擦 |
|---|---|---|---|
| **Primary** | **無料相談（問い合わせ）** | 追従ヘッダー（PC/SP常時）+ 本文2箇所 | 高 |
| **Secondary** | **3分で概算費用をチェック（無料）** | Hero + 料金セクション直後 | **低** |

Secondary は既存の `tools/price-estimator` で実装済み。
**流入経路別の着地**:
- Google Ads / SEO（費用系KW）→ **Secondary を先に見せる**（意図が「いくら？」だから）
- SEO（地域KW）→ /aichi/（現行のまま）
- SNS / Direct / Referral → TOP、Primary 優先

## CURRENT_CONVERSION_STRUCTURE（確定形）

```
追従ヘッダー［LEGACRAFT ─ ナビ ─ 「無料相談」］ ← PC/SPとも常時表示（新規）
 ↓
Hero        作品画像 + 事実のH1 + Primary/Secondary の2CTA + 料金レンジ
 ↓
Problem     こんなところで止まっていませんか（/aichi/ から移植）
 ↓
Capability  選ばれる理由（現行 VALUE を維持）
 ↓
Proof ★     SELECTED WORKS ─ 作品を大きく、数を増やす。自主制作の開示は維持
 ↓
Price ★     3プランの金額 +「対応しないこと」+ Secondary CTA
 ↓
Flow        ご依頼の流れ（現行を維持）
 ↓
FAQ ★       よくあるご質問（/aichi/ から移植）
 ↓
Final CTA   Primary CTA
```
★ = TOP に現在存在しないセクション

---

# 保持仮説の変換結果（P1 / P2 / P3）

3つの仮説は削除も忘却もしていない。Benchmark を通して**実装形が変わった**。

## P1_STICKY_CTA_PLAN

- **変更前の仮説**: モバイル下部に sticky CTA バーを追加する
- **実測**: 参照群12サイト中、下部固定CTAバーの採用は **0件**。
  一方 freee / linear / smarthr / goodpatch は**追従ヘッダー内にCTAを常時表示**。
  LEGACRAFT のモバイル追従ヘッダーは現在**ロゴとハンバーガーのみ**。
- **変換後の実装形**:
  **モバイルの追従ヘッダーに「無料相談」を常時表示する**（下部バーは作らない）。
  ハンバーガーの左にコンパクトなゴールドのボタンを置く。ヘッダー高 77px は維持。
- **理由**: 下部バーは日本のLP文法であり、LEGACRAFT が狙う価格帯・
  デザイン品質の参照群には存在しない。ブランドを毀損せずに受け皿だけを作る。
- **検証方法**: GA4 `cta_click` の `cta_position=header` をモバイルで新規計測

## P2_VISUAL_PROOF_PLAN

- **仮説は完全に維持**。実測でむしろ深刻さが増した
  （/aichi/ は 200px超の画像 **0枚**。参照群の下限 freee でも9枚）
- **変換後の実装形**:
  1. /aichi/ の WORKS セクションに**実際の作品画像を最低6枚**入れる
     （見出しが「中身をすべて公開しています」なので、主張と実物を一致させる）
  2. TOP の作品を PC + SP の2カット化（現状 PC のみ6枚 → 12枚以上）
  3. **作品セクションだけ Ivory 地に反転**し、暗い地で作品が沈むのを防ぐ（P-6）
  4. 前提条件として **WebP + srcset**（現状 1440×900 を 340px 枠に配信）
- **禁止事項の再確認**: 人物・オフィス・第三者の声は作らない。
  増やせるのは自分が作った実物の画像だけ

## P3_PRICE_FAQ_PLAN

- **仮説は維持。ただし「追加」ではなく「/aichi/ からの移植」に変換**
- **変換後の実装形**:
  - Price: `/service.html` と `/aichi/` に既にある3プラン
    （LP 30,000円〜 / 小規模サイト 80,000円〜 / WordPress 150,000円〜）を
    TOP に出す。「対応しないこと」を併記するのが LEGACRAFT の差別化の核なので必ず一緒に出す
  - FAQ: `/aichi/` の FAQ を TOP 用に一般化して移植
  - Hero の料金レンジ表記（現在 13.6px で最も小さく組まれている）を
    **本文サイズまで上げる**。最大の差別化点が最小の文字で置かれている状態を解消
- **根拠**: TOP は `hasPriceNumber = false`。
  `/aichi/` は `true`。同じ会社の同じ商品で、TOP にだけ金額が無い

---

# REUSED_ASSETS / NEW_ASSETS_REQUIRED / RISK

## REUSED_ASSETS（新規作成しないもの）
- `css/ambient-hero.css` + `js/ambient-hero.js`（watchdog / reduced-motion 込み）
- `css/works-gallery.css`（作品を面で見せる思想はそのまま全面化できる）
- `~/design-system` + build-time CSS inline パイプライン
- GA4 `G-ZFSK3YRNJL` + `docs/MEASUREMENT_SPEC.md` v1.1
- `tools/price-estimator`（Secondary CTA の実体）
- `/aichi/` の情報設計（Problem / Price / Area / Flow / FAQ の文言）
- 配色トークン一式・明朝スタック
- `c0d3980` の contrast 修正

## NEW_ASSETS_REQUIRED（作る必要があるもの）
| 資産 | 内容 | 捏造リスク |
|---|---|---|
| 作品スクリーンショット | 既存6作品の SP 表示 + 詳細カット（12〜24枚） | 無し（自分の制作物） |
| WebP / srcset 変換 | 既存 JPEG から生成 | 無し |
| TOP 用 FAQ 文言 | /aichi/ から一般化 | 無し |
| TOP 用 料金セクション | 既存3プランの再掲 | 無し |
| モバイルヘッダーCTA | 新規コンポーネント | 無し |
| 作品セクションの明転スタイル | design-system token 追加 | 無し |

**新規に撮影・生成が必要な人物/施設/顧客の素材はゼロ。**
この案を選んだ理由の一つがこれ。

## PERFORMANCE_RISK
- 画像枚数が 8 → 24枚以上に増える。**WebP + srcset + lazy が必須の前提条件**
- 現状 1440×900 を 340px 枠に配信しているため、
  最適化すれば**枚数を3倍にしても現状より軽くできる**見込み
- 受け入れ基準: 転送量 2.0MB 以内 / CLS 0 維持 / モバイル LCP 1.5秒以内
- TOP Desktop LCP 2,248ms（LCP要素 = `SPAN.brand-word`）は
  Hero の主役が作品画像に移ることで要素自体が変わる。再計測が必要

## MOBILE_RISK
- 追従ヘッダーに CTA を足すとヘッダー内の水平方向が窮屈になる（390px幅）
  → ロゴを短縮せず、CTA を短い文言（「相談」ではなく「無料相談」を維持できるか要検証）
- 作品画像を縦1列フル幅にするとページ全高が伸びる
  → 追従ヘッダーCTAがあるので空白帯の問題は発生しない
- 明転セクションと暗転セクションの往復が多いと、
  モバイルのスクロール中にフラッシュとして知覚される恐れ → 境界の設計が必要
- 既知の未修正: タップ標的（フッター TOP 27×44、インラインリンク高15〜16px）

---

# LOCK / SSOT / 次工程

- **LOCK_STATUS**: `web-portfolio` = 本セッションが WRITE 保有。
  `LEGACRAFT-AI-OS` / `command-center` = 別セッション(9859f5b6)保有、READ ONLY で遵守
- **SSOT_STATUS**: Continuous Commitment「LEGACRAFT公式サイト改装」は `queued.jsonl` に実在。
  重複作成せず。command-center が WRITE ロック中のため**進捗の書き戻しは未実施**
- **本番**: 未 push。`c0d3980` + 本 PHASE の文書はローカル保持
- **次**: PHASE 8 プロトタイプ（Production code とは分離した scratch 実装）
