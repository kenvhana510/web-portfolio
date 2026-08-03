/**
 * 4作品分のデータ。works-template.md のフォーマットに対応。
 * 実データ入力済み（2026-07-31）。この配列の値を差し替えれば
 * TOP / WORKS / CASE STUDY すべてに反映される（コード修正不要）。
 *
 * status: "published"（公開URLあり）| "demo"（制作完了・ローカル環境のみ、公開URLなし）
 * すべて架空企業を想定した制作サンプル。実在企業・実在の医療機関等とは一切関係ない。
 */
const WORKS_DATA = [
  {
    slug: "work-01",
    number: "01",
    status: "published",
    title: "株式会社ミライテック 採用LP",
    industry: "製造業（架空・自動車部品メーカー）",
    siteType: "採用LP（1ページ）",
    summary: "未経験求職者の不安に寄り添う構成の採用LP。全17セクション。",
    url: "https://kenvhana510.github.io/portfolio-mirai-tech-lp/",
    thumbnail: "images/works/work-01-pc.jpg",
    period: "2026年7月",
    disclosure: "掲載可（架空企業を想定した制作サンプル）",
    purpose:
      "製造業クライアントの採用LPを想定し、未経験求職者の不安に寄り添う構成・コピー・UXを設計。企画からレスポンシブ実装・実写真の選定・最適化まで一貫して制作。",
    target: "未経験からの製造業就職を検討している求職者（20〜30代中心）。",
    challenge:
      "「未経験で挑戦していいのか」「体力的に続けられるか」といった求職者の不安に、情報を並べるだけでなく構成段階から向き合う必要があった。",
    designConcept:
      "ネイビー×ブルーを軸にした製造業らしい信頼感と、実写真・柔らかいコピーで若手求職者が応募しやすい親しみやすさを両立。",
    informationArchitecture:
      "FV→働きやすさ（数値カウントアップ）→求職者の不安Q&A→未経験でも始められる3つの理由→仕事内容→成長STEP→職場環境→社員インタビュー→1日の流れ→待遇・福利厚生→募集要項→FAQ→応募フォームの17セクション構成。",
    designDecisions:
      "職場環境セクションはネイビー背景で差別化。写真ごとの彩度差はCSSフィルター（saturate/brightness調整）で統一し、画像の再生成を避けた。モバイルはヒーロー画像に強めの上下グラデーション、PCは左右分割グラデーションと使い分け。",
    wordpressImplementation:
      "WordPressは不使用。HTML/CSS/JSのみ（ビルドツール不要、外部依存はGoogle Fontsのみ）。",
    mobileSupport:
      "375px起点のモバイルファースト設計。375〜1440pxの主要ブレークポイントで検証し、横スクロールなし・タップ領域44px以上を確認。",
    qa: "HTML/CSSの構文チェック、Chromiumでの主要ブレークポイント目視確認（320〜1440px）、JobPosting構造化データ・OGP・アクセシビリティ（skip link・aria属性・focus-visible）対応。画像は24MB→720KBまで最適化（WebP＋JPEGフォールバック）。実機（実機Safari等）での確認は未実施。",
    technologies: "HTML5 / CSS3 / Vanilla JavaScript（ビルドツール不使用）",
  },
  {
    slug: "work-02",
    number: "02",
    status: "published",
    title: "AICHI CLEAN（ハウスクリーニング集客LP）",
    industry: "ハウスクリーニング（架空・愛知県内サービス）",
    siteType: "集客LP（1ページ＋フォーム）",
    summary: "料金の不透明さで踏み出せない層に向けた、早期価格提示型の集客LP。",
    url: "https://kenvhana510.github.io/aichi-clean-lp/",
    thumbnail: "images/works/work-02-pc.jpg",
    period: "2026年7月",
    disclosure: "掲載可（架空企業を想定した制作サンプル）",
    purpose:
      "「頼みたい気持ちはあるが、料金が不透明で踏み出せない」というインサイトに対し、料金を早期提示し、追加費用が発生する理由まで説明することで問い合わせのハードルを下げる集客LP。",
    target: "共働き・子育て世帯（掃除の時間が取れない層）、高齢者世帯、水回り・エアコンのプロクリーニングを求める層。",
    challenge:
      "第1作（採用LP）とは業種・目的の異なる2作目として、コンバージョン導線設計の再現性を証明する必要があった。",
    designConcept:
      "白基調＋ネイビーアクセントで清潔感・余白を重視。第1作の濃紺×実写真フルブリードとは意図的に差別化し、CTA色も暖色系の深いオレンジ（#c2410c）を採用して視覚的な書き分けを行った。",
    informationArchitecture:
      "HERO→PROBLEM→SOLUTION→WHY CHOOSE US→SERVICE（6カード）→PRICE→Before/After→FLOW（5ステップ）→VOICE→対応エリア→FAQ→最終CTA＋問い合わせフォームの12セクション構成。",
    designDecisions:
      "配色はWCAG AA基準でコントラスト比を実測（CTAオレンジ×白文字 5.18:1、ネイビー×白 12.60:1等）。フォントはZen Kaku Gothic Newを採用し第1作のNoto Sans JPと差別化。角丸をやや大きめ（8/16/24px）にして柔らかい印象に調整。",
    wordpressImplementation:
      "WordPressは不使用。HTML/CSS/JSのみ（ビルドツール不要、外部依存はGoogle Fontsのみ）。",
    mobileSupport:
      "375px起点のモバイルファースト設計。375〜1440pxで検証し、タップ領域44px未満の箇所（7件）を含め発見した課題をすべて修正済み。",
    qa: "複数フェーズでのレスポンシブ確認・第三者視点での再監査を実施。画像11枚すべてWebP＋JPEGフォールバックで配信、破損リンク0件、コンソールエラー0件、フォームバリデーション・ハンバーガーメニュー・FAQ開閉の動作確認済み。GitHub Pages公開後に本番URLでの実配信確認も実施済み。",
    technologies: "HTML5 / CSS3 / Vanilla JavaScript（ビルドツール不使用）／GitHub Pagesで公開",
  },
  {
    slug: "work-03",
    number: "03",
    status: "published",
    title: "NESTA ARCHITECTS（ネスタ建築設計）",
    industry: "建築設計（架空・注文住宅設計事務所）",
    siteType: "企業サイト（全7ページ、WordPress + SWELL）",
    summary: "「Quiet Luxury」を軸にしたWordPress＋SWELLの高デザイン企業サイト。",
    url: "https://nesta.legacraft.com/",
    thumbnail: "images/works/work-03-pc.jpg",
    period: "2026年7月",
    disclosure: "掲載可（架空企業を想定した制作サンプル・エックスサーバーで本番公開済み）",
    purpose:
      "WordPress／SWELLを使用した高デザイン企業サイトの制作実績を示すことを目的とした一作品。写真・余白・タイポグラフィで品質を伝える設計力の証明。",
    target:
      "（本作品では架空企業の顧客ターゲット層の詳細設定は行っていません。高品質なWordPress/SWELL企業サイトの実装力を提示することを目的としています）",
    challenge:
      "派手な装飾に頼らず、写真・余白・タイポグラフィ・レイアウトだけで「品質」を感じさせるデザインが求められた。",
    designConcept:
      "「Quiet Luxury × Japanese Architecture」。ブランドメッセージは「暮らしから、家を設計する。」。カード型グリッドを避け、大きな写真と細い罫線による余白重視のレイアウトを採用。角丸は0（直線的なデザイン）。",
    informationArchitecture:
      "TOP／私たちについて／家づくり／施工事例一覧／施工事例詳細／よくある質問／お問い合わせの7ページ構成。TOPはHERO・OUR PHILOSOPHY・WORKS・DESIGN・ABOUT・FLOW・FAQ・CTAの8セクション。施工事例はカスタム投稿タイプで3件（house-01〜03）実装し、追加運用しやすい設計。",
    designDecisions:
      "見出しは游明朝（Webフォント追加なし、表示速度優先）、本文はシステムフォント。カラーはWCAG AA基準で実測・補正（ブランド指定色#927A60は4.06:1でAA未達のため#877055（4.69:1）に補正する等）。モーションはfade/slide/image-revealのみに抑制。",
    wordpressImplementation:
      "WordPress 7.0.2 + SWELL 2.17.1（親テーマ）+ 子テーマ。Contact Form 7（送信は架空サイトのため停止）。カスタム投稿タイプ「works」を子テーマで独自実装（プラグイン追加なし）。",
    mobileSupport:
      "固定px幅を使わないCSS設計（max-width/%/em）で実装。ブラウザ拡張機能の制約により、実ピクセル単位でのスクリーンショット目視確認は本セッションで実施（375/768/1440px、真のモバイルビューポート）。",
    qa: "全7ページ＋施工事例3件のPHPエラー0件・HTTPステータス200・画像altテキスト設定・内部リンク破損0件を確認。h1重複バグ（SWELL標準ロゴとHEROのh1が重複）を発見し修正、著者ボックス由来の404も発見・修正済み。",
    technologies: "WordPress 7.0.2 / SWELL 2.17.1 / 子テーマ独自実装 / Contact Form 7",
  },
  {
    slug: "work-04",
    number: "04",
    status: "published",
    title: "LUMÉA SKIN CLINIC（ルメア スキンクリニック）",
    industry: "美容医療（架空・美容皮膚科クリニック）",
    siteType: "コーポレート＋集客サイト（全11ページ、WordPress + SWELL）",
    summary: "「Soft Luxury」を軸にした、20〜40代女性向け美容クリニックサイト。",
    url: "https://lumea.legacraft.com/",
    thumbnail: "images/works/work-04-pc.jpg",
    period: "2026年7月",
    disclosure: "掲載可（架空企業を想定した制作サンプル・エックスサーバーで本番公開済み）",
    purpose:
      "美容医療・医療広告特有のルール（誇大表現の禁止、症例が架空である旨の明示等）を踏まえたうえで、WordPress＋SWELLによるカスタム投稿タイプ活用・予約導線設計の実装力を示す一作品。",
    target: "美容医療に関心はあるが、派手な変化より自然な変化を重視する20〜40代女性。初めての来院に不安を感じやすい層。",
    challenge:
      "第3作（NESTA ARCHITECTS）と同じWordPress＋SWELL構成でありながら、同じ表現の使い回しにならないよう差別化しつつ、医療広告として誤認されない表現に配慮する必要があった。",
    designConcept:
      "「Soft Luxury × Medical Trust × Beauty Editorial」。第3作の角丸0（直線的）に対し、本作は控えめな丸み（ボタン4px・画像6px）を意図的に採用し、柔らかな高級感を演出。配色はアイボリー×マスタードゴールドで統一し、WCAG AA基準でコントラストを実測・補正。",
    informationArchitecture:
      "TOP／当院について／施術一覧／施術詳細／お悩み別／症例紹介／医師紹介／料金／よくある質問／アクセス／WEB予約の11ページ構成。施術6件・症例3件をカスタム投稿タイプで管理し、TOP・一覧・詳細で同じアイキャッチ画像を共用する設計。",
    designDecisions:
      "見出しは游明朝、本文はシステムフォントで表示速度を優先。CTAボタンはマスタードゴールド系（#8C6F45、白文字で4.69:1のAA達成）。症例紹介ページは投稿者の入力に依存せず、テンプレート側で「架空の症例」注記を必ず出力する設計にし、医療広告としての誤認防止を実装レベルで担保。",
    wordpressImplementation:
      "WordPress 7.0.2 + SWELL 2.17.1（親テーマ）+ 子テーマ。Contact Form 7（送信は架空サイトのため停止）。カスタム投稿タイプ「treatment」「case」を子テーマで独自実装し、タクソノミー「treatment_category」で絞り込み表示に対応。",
    mobileSupport:
      "真のモバイルビューポート（Chrome DevTools Protocolの`Emulation.setDeviceMetricsOverride`）で375/768/1440pxを実測。過去に誤検知していた横スクロール崩れは測定手法の不備によるもので実在しないと訂正済み。",
    qa: "全19URL（固定ページ10＋施術6＋症例3）でHTTPステータス200・h1数1・ダミーテキスト0件を確認。ブラウザのJSコンソールエラーも実機相当の環境で0件を実測。公開直前にTOPページのボタン重なり不具合を発見し、原因特定のうえ最小限のCSS修正で解消。",
    technologies: "WordPress 7.0.2 / SWELL 2.17.1 / 子テーマ独自実装 / Contact Form 7",
  },
];
