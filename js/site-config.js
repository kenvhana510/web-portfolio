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
  // 価格の正本（source of truth）はここ。金額を変えるときはこの min/max だけを
  // 触る。service.html の表示も price-estimator の概算も、ここから導出される。
  //
  // `price`（表示文字列）は下で min/max から自動生成する。手で書かないのは、
  // 表示と計算が別々に書かれていると必ず片方だけ更新されるため——実際に
  // price-estimator が legacraft/site/06-price.md の旧「仮」価格を参照し続け、
  // 公開価格の最大4倍を提示していた（2026-08-24 に発見）。
  pricing: {
    lp: { label: "LP制作", min: 30000, max: 60000 },
    small: { label: "小規模Webサイト制作", min: 80000, max: 120000 },
    wordpress: { label: "WordPressサイト制作", min: 150000, max: 250000 },
  },

  // 旧価格（参考・履歴。現在の営業価格としては使用しない）：
  // lp 80,000円〜 / corporate 150,000円〜 / highend 300,000円〜
  // legacraft/site/06-price.md の 8〜18万 / 25〜50万 / 50〜100万 も「仮」価格で、
  // 営業価格ではない。参照しないこと。

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
// 表示文字列を min/max から導出する。Intl に依存しないのは、桁区切りの結果を
// 環境やロケール設定に左右させないため（"30,000円〜60,000円" は既存表示と
// バイト単位で一致する）。
(function (config) {
  function comma(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  Object.keys(config.pricing).forEach(function (key) {
    var p = config.pricing[key];
    p.price = comma(p.min) + "円〜" + comma(p.max) + "円";
  });
})(SITE_CONFIG);

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

   ── 送信が消えていた問題（2026-08-28 実測）────────────────────────────
   gtag.js はイベントを即座には送らず、約5秒のバッチにまとめて送信する。
   内部リンクをクリックすると、その5秒を待たずにページが破棄されるため、
   cta_click は GA4 へ届かずに消えていた（本番でcontextレベル監視により確認。
   外部 target="_blank" のときだけページが残るので届いていた）。

   これを「同一オリジンへ遷移するクリックは、いま送らずに sessionStorage へ
   預け、遷移先ページの読み込み直後に送る」方式で解決する。

   この方式を選んだ理由:
   - 遷移を1msも遅らせない（event_callback で待つ方式は体感が悪化する）
   - Measurement Protocol を自前実装しない（cid/sid の再現は壊れやすい）
   - 二重送信が構造的に起きない。「いま送る」か「預けて次で送る」かは
     クリック時点で排他的に決まり、両方を実行する経路が存在しない。

   預けたイベントは遷移先の page_view と同じセッション・同じバッチで届く。
   page_location は遷移先になるため、どこで押されたかは page_location では
   なく source_page / cta_position パラメータで判断する。
   ========================================================================== */
(function (window, document) {
  "use strict";

  // 二重bind防止。同一ページで site-config.js が2回読まれても1本に保つ。
  if (window.__ctaClickBound) return;
  window.__ctaClickBound = true;

  var PENDING_KEY = "legacraft_pending_events";
  // 預けたイベントの有効期限。タブを閉じずに何時間も後で復帰した場合まで
  // 送ると、実際の行動とかけ離れた時刻のイベントになる。
  var PENDING_TTL_MS = 120000;

  function session() {
    try {
      var s = window.sessionStorage;
      s.getItem(PENDING_KEY); // private mode 等でここが投げる
      return s;
    } catch (e) {
      return null;
    }
  }

  function sendNow(name, params) {
    if (typeof window.gtag !== "function") return false;
    try {
      window.gtag("event", name, params || {});
      return true;
    } catch (e) {
      return false;
    }
  }

  /* 遷移をまたいで送るイベントを預ける。送れなければ静かに諦める
     （計測のためにリンク遷移を止めることはしない）。 */
  function defer(name, params) {
    var s = session();
    if (!s) return sendNow(name, params); // 預けられない環境では従来どおり即送信
    try {
      var queue = JSON.parse(s.getItem(PENDING_KEY) || "[]");
      if (!Array.isArray(queue)) queue = [];
      queue.push({ n: name, p: params || {}, t: Date.now() });
      // 異常時に無限に溜まらないよう上限を持たせる
      if (queue.length > 5) queue = queue.slice(-5);
      s.setItem(PENDING_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* 預かっていたイベントを送る。読み出しより先に消すのは、送信に失敗しても
     同じイベントが次のページで再送され続けないようにするため。 */
  function flushPending() {
    var s = session();
    if (!s) return;
    var raw;
    try {
      raw = s.getItem(PENDING_KEY);
      if (!raw) return;
      s.removeItem(PENDING_KEY);
    } catch (e) {
      return;
    }
    var queue;
    try {
      queue = JSON.parse(raw);
    } catch (e) {
      return;
    }
    if (!Array.isArray(queue)) return;
    var now = Date.now();
    for (var i = 0; i < queue.length; i++) {
      var item = queue[i];
      if (!item || !item.n) continue;
      if (typeof item.t === "number" && now - item.t > PENDING_TTL_MS) continue;
      sendNow(item.n, item.p);
    }
  }

  // 他のスクリプト（price-estimator の logic.js など）からも同じ仕組みを
  // 使えるようにしておく。遷移で消えるイベントはここを通す。
  window.LEGACRAFT_TRACK = {
    send: sendNow,
    defer: defer,
  };

  // gtag('config') は同ファイルの上のブロックで既に実行済み。ここで流すと
  // 遷移先の page_view と同じバッチに乗る。
  flushPending();

  // ------------------------------------------------------------------
  // CTA の意味づけ
  // ------------------------------------------------------------------

  /* セクション id をそのまま使うと final_cta_contact のように冗長になる。
     計測名は短く読める形に寄せる（見た目・DOM は変えない）。 */
  var POSITION_ALIAS = { "final-cta": "final" };

  function attr(a, name) {
    var v = a.getAttribute(name);
    return v ? v.trim() : "";
  }

  // href から CTA の種別を決める。クラス名ではなく href で判定するのは、
  // 遷移先こそがユーザーの意図であり、デザイン変更で壊れないため。
  // data-cta-type があればそちらを優先する（WORKS の case_study など）。
  function resolveCtaType(a, href, rawHref) {
    var explicit = attr(a, "data-cta-type");
    if (explicit) return explicit;
    if (/^mailto:/i.test(rawHref)) return "email";
    if (/^tel:/i.test(rawHref)) return "tel";
    if (/lancers\.jp/i.test(href)) return "lancers";
    if (/coconala\.com/i.test(href)) return "coconala";
    if (/tools\/price-estimator/i.test(href)) return "estimator";
    if (/tools\/lp-checklist/i.test(href)) return "checklist";
    if (/contact\.html/i.test(href)) return "contact";
    if (/service\.html/i.test(href)) return "service";
    if (/works\.html|case-study\.html/i.test(href)) return "works";
    return "other";
  }

  // 同じ「CONTACT」でも、ヘッダー常設・ページ内・フッターでは意味が違う。
  // PC ナビとモバイルナビは別要素なので分けて記録する（従来はどちらも
  // body に落ちていて区別できなかった）。
  function resolveCtaPosition(a) {
    var explicit = attr(a, "data-cta-position");
    if (explicit) return explicit;
    if (a.classList && a.classList.contains("nav-cta")) return "header";
    if (a.closest("#mobile-nav")) return "mobile_nav";
    if (a.closest(".site-header")) return "header_nav";
    if (a.closest(".tool-nav")) return "tool_nav";
    if (a.closest("footer")) return "footer";
    var section = a.closest("section");
    if (section && section.id) return POSITION_ALIAS[section.id] || section.id.replace(/-/g, "_");
    return "body";
  }

  // cta_id は「どのCTAか」の安定した識別子。巨大な textContent に依存せず、
  // 明示指定があればそれを、無ければ 位置_種別 から機械的に決める。
  function resolveCtaId(a, type, position) {
    var explicit = attr(a, "data-cta-id");
    if (explicit) return explicit;
    var id = position + "_" + type;
    return id.replace(/[^A-Za-z0-9_]/g, "_").toLowerCase();
  }

  // 遷移先。同一オリジンならサイト内の相対パス、外部ならホスト名だけを送る。
  // クエリ文字列は送らない（個人情報が載る余地を作らないため）。
  function resolveDestination(a, rawHref) {
    if (/^mailto:/i.test(rawHref)) return "mailto";
    if (/^tel:/i.test(rawHref)) return "tel";
    try {
      if (a.origin === window.location.origin) {
        return a.pathname.replace(/^\//, "") || "/";
      }
      return a.hostname;
    } catch (e) {
      return "";
    }
  }

  function currentPage() {
    return (
      (document.body && document.body.getAttribute("data-page")) ||
      window.location.pathname
    );
  }

  function buildParams(a, rawHref) {
    var type = resolveCtaType(a, a.href, rawHref);
    var position = resolveCtaPosition(a);

    var params = {
      cta_id: resolveCtaId(a, type, position),
      cta_type: type,
      cta_position: position,
      destination: resolveDestination(a, rawHref),
      source_page: currentPage(),
    };

    // 短いラベルだけ残す。WORKS カードのように中身が全部入ってしまう要素は
    // data-cta-label 側で明示する（textContent には依存しない）。
    var label = attr(a, "data-cta-label");
    if (!label) {
      var text = (a.textContent || "").replace(/[→›»]/g, "");
      text = text.replace(/\s+/g, " ").trim();
      if (text.length <= 40) label = text;
    }
    if (label) params.cta_text = label.slice(0, 40);

    // WORKS の作品識別。works-render.js が data 属性で渡す。
    var workId = attr(a, "data-work-id");
    if (workId) {
      params.work_id = workId;
      params.work_name = attr(a, "data-work-name");
      var pos = parseInt(attr(a, "data-work-position"), 10);
      if (!isNaN(pos)) params.work_position = pos;
      var action = attr(a, "data-cta-action");
      if (action) params.cta_action = action;
    }

    return params;
  }

  /* このクリックが「このタブで同一オリジンへ遷移する」ものかを判定する。
     true なら送信を遷移先へ預ける。false なら今このページで送れる。
     どちらか一方しか実行しないので二重送信は起きない。 */
  function willNavigateSameOrigin(a, event) {
    if (event.defaultPrevented) return false;
    if (event.button !== 0) return false; // 中クリック等は別タブ＝このページは残る
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    var target = a.getAttribute("target");
    if (target && target !== "_self") return false;
    if (a.hasAttribute("download")) return false;
    try {
      if (a.protocol !== "http:" && a.protocol !== "https:") return false;
      if (a.origin !== window.location.origin) return false;
    } catch (e) {
      return false;
    }
    return true;
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

        var params = buildParams(a, rawHref);

        if (willNavigateSameOrigin(a, event)) {
          defer("cta_click", params);
        } else {
          sendNow("cta_click", params);
        }
      } catch (e) {
        // 計測の失敗は握りつぶす。ここで throw するとリンク遷移まで
        // 巻き込む可能性があるため、意図的に何もしない。
      }
    },
    false
  );
})(window, document);
