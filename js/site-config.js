/**
 * サイト全体の設定値。価格・連絡先など、後から変更される可能性が高い値をここに集約する。
 * ここを書き換えるだけでサイト全体に反映される。
 */
const SITE_CONFIG = {
  // 屋号：LEGACRAFT（legacraft/brand/brand-guidelines.md Version 1.0で確定）。
  siteName: "LEGACRAFT",
  tagline: "WordPress（SWELL）・LP制作専門のWeb制作",

  // 2026-07-31確定：実績構築期（初回受注獲得優先）の正式価格。
  // 事業が軌道に乗った後の本来価格帯は sales/application-ready-kit.md 4章・
  // strategy/service-design.md を参照（本サイトには現時点では掲載しない）。
  pricing: {
    lp: { label: "LP制作", price: "30,000円〜60,000円" },
    small: { label: "小規模Webサイト制作", price: "80,000円〜120,000円" },
    wordpress: { label: "WordPressサイト制作", price: "150,000円〜250,000円" },
  },

  // 旧価格（参考・履歴。現在の営業価格としては使用しない）：
  // lp 80,000円〜 / corporate 150,000円〜 / highend 300,000円〜

  // 各プラットフォームのアカウント登録・URL確定後にここへ入力する。
  // 未確定の間は null のままにし、フロント側では「準備中」表示にする。
  contact: {
    crowdworks: null,
    lancers: null,
    coconala: null,
    email: "info@legacraft.jp",
  },

  // アクセス解析。実Measurement ID（G-xxxxxxxxxx）を取得したら、
  // **このファイルのこの1行だけ**を書き換える。他のページを触る必要はない。
  //
  // 空文字のうちは計測を一切行わない（gtag.jsも読み込まない）。
  // プレースホルダー（G-XXXXXXXXXX 等）を入れてはいけない——実IDのつもりで
  // 誤って公開すると「計測している」と誤認したまま何も測れない状態になる。
  analytics: {
    measurementId: "G-ZFSK3YRNJL",
  },
};

/* ==========================================================================
   アクセス解析の読み込み
   ==========================================================================
   全ページがこのファイルを読み込んでいるため、ここに置くだけで対象ページ
   すべてに適用される（tools配下の2ページも同様に読み込む）。

   fail-safe: measurementId が空なら gtag.js を要求すらしない。未設定の状態で
   ネットワークリクエストが飛ぶことも、window.gtag が半端に定義されることも
   ない。tools/price-estimator/analytics.js は window.gtag の有無を見て
   console.debug へフォールバックするので、未設定でも例外は起きない。
   ========================================================================== */
(function (window, document) {
  "use strict";

  var id =
    (window.SITE_CONFIG &&
      window.SITE_CONFIG.analytics &&
      window.SITE_CONFIG.analytics.measurementId) ||
    "";

  // 既存の注入経路（ページ側で window.GA4_MEASUREMENT_ID を直接設定する形）
  // との互換。どちらか一方が設定されていればよい。
  if (!id && typeof window.GA4_MEASUREMENT_ID === "string") {
    id = window.GA4_MEASUREMENT_ID;
  }

  // プレースホルダーは未設定として扱う。実IDと取り違えたまま公開されるのが
  // 最悪の結果（計測できていないのに、できているつもりになる）。
  if (!id || /^G-X+$/i.test(id) || id === "G-XXXXXXXXXX") {
    window.GA4_MEASUREMENT_ID = "";
    return;
  }

  window.GA4_MEASUREMENT_ID = id;
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id);

  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(tag);
})(window, document);
