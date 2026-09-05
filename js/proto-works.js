/**
 * PROTOTYPE — TOP の WORKS ギャラリー描画（PHASE 8）
 *
 * 既存の js/works-render.js には手を触れない（works.html が使っているため）。
 * こちらは TOP プロトタイプ専用の別実装。
 *
 * 変更点:
 *  - PC 1枚 -> PC + SP の2枚組。「崩れないスマホ表示」を文字でなく実物で示す
 *  - <picture> + srcset で WebP を配信。元は 1440x900 を 340px 枠へ送っていた
 *  - 1枚目だけ eager + fetchpriority=high、以降は lazy
 *
 * WORKS_DATA（js/works-data.js）の値は変更していない。
 * 画像パスは slug から導出する（work-03 -> images/works/work-03-pc-720.webp 等）。
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /**
   * PC ショット。表示枠は最大 720px 程度なので 720 / 1440 の2本を出す。
   * JPEG を fallback に残すので、WebP 非対応でも必ず何か出る。
   */
  function pcPicture(slug, title, eager) {
    var loading = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    return (
      '<picture>' +
        '<source type="image/webp" ' +
          'srcset="images/works/' + slug + '-pc-720.webp 720w, images/works/' + slug + '-pc-1440.webp 1440w" ' +
          'sizes="(min-width: 860px) 46vw, 62vw">' +
        '<img class="pwg__shot pwg__shot--pc" src="images/works/' + slug + '-pc.jpg" ' +
          'width="1440" height="900" ' + loading + ' decoding="async" ' +
          'alt="' + esc(title) + ' のPC表示">' +
      '</picture>'
    );
  }

  /**
   * SP ショット。実機幅 390px を deviceScaleFactor 2 で撮ったもの。
   * 表示枠は 88〜118px なので 390 / 780 の2本で足りる。
   */
  function spPicture(slug, title, eager) {
    var loading = eager ? 'loading="eager"' : 'loading="lazy"';
    return (
      '<picture>' +
        '<source type="image/webp" ' +
          'srcset="images/works/' + slug + '-sp-390.webp 390w, images/works/' + slug + '-sp-780.webp 780w" ' +
          'sizes="118px">' +
        '<img class="pwg__shot pwg__shot--sp" src="images/works/' + slug + '-sp-390.webp" ' +
          'width="390" height="844" ' + loading + ' decoding="async" ' +
          'alt="' + esc(title) + ' のスマートフォン表示">' +
      '</picture>'
    );
  }

  // MEASUREMENT_SPEC.md 2.3 が要求する data-* を必ず付ける。
  // 初版はこれを落としており、TOP ギャラリーの work_id / work_name /
  // work_position / cta_action が GA4 に届かなくなっていた（計測の後退）。
  // 属性の作り方は既存 works-render.js の workAttrs() に合わせている。
  function workName(w) {
    return String(w.title || "").split("（")[0].trim().slice(0, 40);
  }

  function workAttrs(w, index, action) {
    return (
      ' data-work-id="' + esc(w.slug) + '"' +
      ' data-work-name="' + esc(workName(w)) + '"' +
      ' data-work-position="' + (index + 1) + '"' +
      ' data-cta-action="' + action + '"' +
      ' data-cta-id="' + esc(w.slug).replace(/-/g, "_") + "_" + action + '"' +
      ' data-cta-label="' + esc(workName(w)) + '"' +
      ' data-cta-position="works"'
    );
  }

  function item(w, index) {
    var eager = index === 0;
    var caseHref = "case-study.html?work=" + encodeURIComponent(w.slug);

    // 稼働しているデモを開けることが、この事業で唯一その場に出せる証拠。
    // テキストリンクではなくボタンにして第一リンクに昇格させる。
    var demo = w.url
      ? '<a class="btn btn-ghost pwg__demo" href="' + esc(w.url) + '" target="_blank" rel="noopener"' +
        ' data-cta-type="demo"' + workAttrs(w, index, "demo") + '>実物を開く（別タブ） <span class="btn-arrow">&rarr;</span></a>'
      : "";

    return (
      '<article class="pwg__item reveal">' +
        '<div class="pwg__shots">' +
          pcPicture(w.slug, w.title, eager) +
          spPicture(w.slug, w.title, eager) +
          '<p class="pwg__shotcap">PC / スマートフォン 両方の実表示</p>' +
        '</div>' +
        '<div class="pwg__body">' +
          '<span class="pwg__num">' + esc(w.number) + " / SELECTED WORK" + '</span>' +
          '<h3 class="pwg__name">' + esc(w.title) + '</h3>' +
          '<p class="pwg__meta">' + esc(w.industry) + '</p>' +
          '<p class="pwg__scale">規模：' + esc(w.siteType) + '</p>' +
          '<p class="pwg__sum">' + esc(w.summary) + '</p>' +
          '<p class="pwg__links">' +
            demo +
            '<a class="pwg__link" href="' + caseHref + '"' +
              ' data-cta-type="case_study"' + workAttrs(w, index, "case_study") + '>制作プロセスを見る &rarr;</a>' +
          '</p>' +
        '</div>' +
      '</article>'
    );
  }

  window.renderProtoWorks = function (selector) {
    var root = document.querySelector(selector);
    if (!root || typeof WORKS_DATA === "undefined") return;
    root.innerHTML = WORKS_DATA.map(item).join("");

    // main.js の IntersectionObserver は初回に存在した .reveal しか監視していない。
    // 後から差し込んだ要素は誰にも観測されず、is-visible が付かないまま
    // 透明で置き去りになる（実画面で作品が全部消えていた）。
    // 既存の works-render.js も同じ理由でここを呼んでいる。
    if (window.__initReveal) window.__initReveal();
  };
})();

/**
 * PROTOTYPE — FAQ アコーディオン（PHASE 8）
 * JSが落ちても中身が読めるよう、初期状態は「開いている」HTMLを配り、
 * JSが動いたときだけ閉じる。JS無効環境で答えが消えないようにするため。
 */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var items = document.querySelectorAll("[data-page='top'] .pfaq__item");
    Array.prototype.forEach.call(items, function (item, i) {
      var q = item.querySelector(".pfaq__q");
      var a = item.querySelector(".pfaq__a");
      if (!q || !a) return;
      var open = i === 0;            // 1問目だけ開いた状態で始める
      a.hidden = !open;
      q.setAttribute("aria-expanded", String(open));
      q.addEventListener("click", function () {
        var next = q.getAttribute("aria-expanded") !== "true";
        q.setAttribute("aria-expanded", String(next));
        a.hidden = !next;
      });
    });
  });
})();
