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
    lancers: "https://www.lancers.jp/menu/detail/1337339",
    coconala: "https://coconala.com/services/4361612",
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

// 上の `const` は「スクリプトスコープ」に束縛されるだけで、window のプロパティには
// ならない（`var` と異なる点）。他ページのインラインscriptは同じスコープを共有する
// ため裸の SITE_CONFIG で参照できるが、window 経由で読む下の読み込み処理からは
// undefined に見えてしまい、Measurement IDを設定しても gtag.js が永久に読まれない。
// window へ明示的に載せて、両方の参照方法で同じ値が見えるようにする。
window.SITE_CONFIG = SITE_CONFIG;

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

/* ==========================================================================
   サイト全体の CTA クリック計測（cta_click）
   ==========================================================================
   全10ページがこのファイルを読み込むため、ここに1本置くだけで本体ページも
   tools配下も同時にカバーできる（js/main.js は tools配下が読まないので不可）。

   委譲（delegation）にしている理由は2つ。
   1. contact.html の問い合わせカードは JS で後から生成されるため、
      個別バインドでは取りこぼす。
   2. リスナーが1本なら二重発火の検証が「1本かどうか」だけで済む。

   既存の price-estimator 側 cta_click との重複はゼロ。理由は構造的で、
   偶然そうなっているのではない：
     - #cta-contact / #cta-email は <button> なので a[href] に一致しない
     - #cta-line は href="#" なので、ページ内アンカーとして除外される
   下の id 除外は、この構造が将来変わっても壊れないための保険。

   除外に「#result の中は全部」という条件は使わない。tools/lp-checklist にも
   同名の #result があり、そこにこのツールの主要CTA 2本（相談・見積り）が
   入っているため、汎用的に切ると計測したい導線ごと落ちる。除外は estimator
   固有のもの（#lead-form-panel と 3つの id）だけに絞る。

   fail-safe: gtag が無い／GA4 未設定でも、ここで例外を出してリンク遷移を
   妨げてはならない。preventDefault は一切呼ばず、送信の完了も待たない
   （gtag は dataLayer への push で即座に返る）。全体を try/catch で包み、
   計測の失敗がナビゲーションに波及しないようにしている。
   ========================================================================== */
(function (window, document) {
  "use strict";

  // 二重bind防止。同一ページで site-config.js が2回読まれても1本に保つ。
  if (window.__ctaClickBound) return;
  window.__ctaClickBound = true;

  // href から CTA の種別を決める。クラス名ではなく href で判定するのは、
  // 遷移先こそがユーザーの意図であり、デザイン変更で壊れないため。
  function resolveCtaType(href, rawHref) {
    if (/^mailto:/i.test(rawHref)) return "email";
    if (/lancers\.jp/i.test(href)) return "lancers";
    if (/coconala\.com/i.test(href)) return "coconala";
    if (/tools\/price-estimator/i.test(href)) return "estimator";
    if (/tools\/lp-checklist/i.test(href)) return "checklist";
    if (/contact\.html/i.test(href)) return "contact";
    if (/service\.html/i.test(href)) return "service";
    if (/works\.html|case-study\.html/i.test(href)) return "works";
    return "other";
  }

  // ヘッダー常設CTAとページ内CTAは意味が違うので分けて記録する。
  function resolveCtaPosition(a) {
    if (a.classList && a.classList.contains("nav-cta")) return "header";
    if (a.closest("footer")) return "footer";
    var section = a.closest("section");
    if (section && section.id) return section.id;
    return "body";
  }

  document.addEventListener(
    "click",
    function (event) {
      try {
        var target = event.target;
        if (!target || typeof target.closest !== "function") return;

        var a = target.closest("a[href]");
        if (!a) return;

        var rawHref = a.getAttribute("href") || "";

        // ページ内アンカーと javascript: は「CTA」ではないので除外。
        // #cta-line（href="#"）がここで落ちる。
        if (!rawHref || rawHref.charAt(0) === "#") return;
        if (/^javascript:/i.test(rawHref)) return;

        // estimator が自前で cta_click を送る要素・領域だけを除外する。
        // #lead-form-panel は estimator にしか存在しない。
        if (a.id === "cta-line" || a.id === "cta-contact" || a.id === "cta-email") return;
        if (a.closest("#lead-form-panel")) return;

        // GA4 未設定・gtag 未ロード時は何もしない（console にも出さない）。
        if (typeof window.gtag !== "function") return;

        var text = (a.textContent || "").replace(/[→›»]/g, "");
        text = text.replace(/\s+/g, " ").trim().slice(0, 100);

        window.gtag("event", "cta_click", {
          page:
            (document.body && document.body.getAttribute("data-page")) ||
            window.location.pathname,
          href: a.href,
          cta_type: resolveCtaType(a.href, rawHref),
          cta_text: text,
          cta_position: resolveCtaPosition(a),
        });
      } catch (e) {
        // 計測の失敗は握りつぶす。ここで throw するとリンク遷移まで
        // 巻き込む可能性があるため、意図的に何もしない。
      }
    },
    false
  );
})(window, document);
