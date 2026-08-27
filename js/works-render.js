(function () {
  "use strict";

  var STATUS_LABEL = {
    pending: "準備中",
    "in-progress": "制作中",
    published: "公開中",
    demo: "制作事例（DEMO）",
  };

  function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function thumbImg(work, eager) {
    if (!work.thumbnail) return "";
    var alt = escapeAttr(work.title + "（" + work.siteType + "）のスクリーンショット");
    return (
      '<img src="' + work.thumbnail + '" alt="' + alt + '" width="800" height="500"' +
      (eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') +
      ' decoding="async">'
    );
  }

  // The card used to be one <a> wrapping everything, which left the live demo
  // two clicks away: nobody browsing WORKS could see the actual site without
  // first opening a case study. A second <a> could not simply be added — an
  // anchor inside an anchor is invalid and browsers split the DOM — so the
  // card is a <div> now, with the case-study link wrapping thumb + body (the
  // whole-card click is unchanged) and the demo link as its sibling.
  // Cards without a url render no demo row, same condition renderCaseStudy()
  // uses to decide between the live link and the DEMO note.
  function workCardHTML(work, index) {
    return (
      '<div class="work-card reveal">' +
      '<a class="work-card-main" href="case-study.html?work=' + work.slug + '">' +
      '<div class="work-thumb">' +
      thumbImg(work, index === 0) +
      '<span class="work-status">' + STATUS_LABEL[work.status] + '</span>' +
      '<span class="work-number">WORK ' + work.number + '</span>' +
      '</div>' +
      '<div class="work-body">' +
      '<div class="work-industry">' + work.industry + '</div>' +
      '<h3>' + work.title + '</h3>' +
      '<p>' + work.summary + '</p>' +
      '</div>' +
      '</a>' +
      (work.url
        ? '<div class="work-card-actions">' +
          '<a href="' + work.url + '" target="_blank" rel="noopener">' +
          'デモを見る <span class="btn-arrow">→</span>' +
          '</a></div>'
        : "") +
      '</div>'
    );
  }

  /* --- TOP のギャラリー表示 --------------------------------------------
     works.html が使う renderWorksGrid() は変更しない。TOP だけがこちらを
     呼ぶ。カードの箱をやめ、作品画像そのものを並べるための別レンダラ。

     6点を同じ大きさで並べると一覧表になってしまうので、1番目と4番目を
     大きく取り、残りを2列に置いて視覚的な序列を作る。            */
  var GALLERY_SIZE = ["lg", "md", "md", "lg", "md", "md"];

  function galleryYear(work) {
    var m = String(work.period || "").match(/\d{4}/);
    return m ? m[0] : "";
  }

  function galleryCategory(work) {
    /* industry は「建築設計（架空・注文住宅設計事務所）」のように括弧で
       但し書きが付く。ギャラリーでは頭の業種だけを出す。 */
    var industry = String(work.industry || "").split("（")[0].trim();
    var parts = [industry, galleryYear(work)];
    var label = STATUS_LABEL[work.status];
    if (label) parts.push(label);
    return parts.filter(Boolean).join(" ／ ");
  }

  function galleryItemHTML(work, index) {
    var size = GALLERY_SIZE[index] || "md";
    var isLarge = size === "lg";
    var img = "";

    if (work.thumbnail) {
      var alt = escapeAttr(work.title + "（" + work.siteType + "）のスクリーンショット");
      img =
        '<img src="' + work.thumbnail + '" alt="' + alt + '" width="1440" height="900"' +
        (index === 0 ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') +
        ' decoding="async">';
    }

    /* 見出し行。番号のあとに罫線を引くのは情報を整理するためで、
       作品を枠で囲うためではない。大きい2点だけラベルを添える。 */
    var label =
      '<p class="wgal__label">' +
      '<span class="wgal__num">' + work.number + '</span>' +
      (isLarge ? '<span class="wgal__labeltext">SELECTED WORK</span>' : "") +
      '<span class="wgal__rule" aria-hidden="true"></span>' +
      '</p>';

    return (
      '<article class="wgal__item wgal__item--' + size + ' reveal">' +
      '<a class="wgal__link" href="case-study.html?work=' + work.slug + '">' +
      label +
      '<div class="wgal__frame">' + img + '</div>' +
      '<div class="wgal__meta">' +
      '<h3 class="wgal__title">' + work.title + '</h3>' +
      '<p class="wgal__cat">' + galleryCategory(work) + '</p>' +
      '<p class="wgal__desc">' + work.summary + '</p>' +
      '<span class="wgal__more">VIEW CASE <span class="wgal__arrow">&rarr;</span></span>' +
      '</div>' +
      '</a>' +
      (work.url
        ? '<a class="wgal__demo" href="' + work.url + '" target="_blank" rel="noopener">' +
          'デモを見る <span class="btn-arrow">&rarr;</span></a>'
        : "") +
      '</article>'
    );
  }

  function renderWorksGallery(selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = WORKS_DATA.map(galleryItemHTML).join("");
    el.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.remove();
      });
    });
    if (window.__initReveal) window.__initReveal();
  }

  function renderWorksGrid(selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = WORKS_DATA.map(workCardHTML).join("");
    el.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.remove();
      });
    });
    if (window.__initReveal) window.__initReveal();
  }

  function renderCaseStudy() {
    var root = document.querySelector("[data-case-study-root]");
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("work") || WORKS_DATA[0].slug;
    var index = WORKS_DATA.findIndex(function (w) {
      return w.slug === slug;
    });

    if (index === -1) index = 0;
    var work = WORKS_DATA[index];
    var prev = WORKS_DATA[(index - 1 + WORKS_DATA.length) % WORKS_DATA.length];
    var next = WORKS_DATA[(index + 1) % WORKS_DATA.length];

    document.title = "WORK " + work.number + "｜" + work.title + " | CASE STUDY";

    // Every ?work= slug used to report the same canonical, so all six case
    // studies collapsed into one indexable page. Point canonical and og:url
    // at the work actually being shown.
    var csUrl = "https://legacraft.jp/case-study.html?work=" + work.slug;
    var canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute("href", csUrl);
    var ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.setAttribute("content", csUrl);

    root.innerHTML =
      '<div class="container cs-hero">' +
      '<div class="eyebrow reveal">WORK ' + work.number + '</div>' +
      '<h1 class="reveal">' + work.title + '</h1>' +
      '<div class="cs-meta reveal">' +
      '<span>' + work.industry + '</span>' +
      '<span>' + work.siteType + '</span>' +
      '<span>制作期間：' + work.period + '</span>' +
      '<span>掲載区分：' + STATUS_LABEL[work.status] + '</span>' +
      "</div>" +
      (work.url
        ? '<div class="reveal" style="margin-bottom:1rem;"><a class="btn btn-primary" href="' + work.url + '" target="_blank" rel="noopener">サイトを見る（実際の公開ページ） →</a></div>'
        : '<div class="reveal" style="margin-bottom:1rem;color:var(--color-ink-soft);font-size:0.85rem;">現在ローカル環境のみで確認可能な制作事例です（DEMO）。</div>') +
      '<div class="cs-visual reveal">' +
      (work.thumbnail
        ? '<img src="' + work.thumbnail + '" alt="' + escapeAttr(work.title + "のトップページスクリーンショット") + '" width="1600" height="900" loading="eager" fetchpriority="high" decoding="async">'
        : "Screenshot準備中（PC / Mobile）") +
      "</div>" +
      "</div>" +
      '<div class="container">' +
      csStep("課題", work.challenge) +
      csStep("設計", work.informationArchitecture + "　" + work.purpose) +
      csStep("デザイン", work.designConcept + "　" + work.designDecisions) +
      csStep("実装", work.wordpressImplementation + "　" + work.technologies) +
      csStep("品質確認", work.qa) +
      csStep("完成", work.mobileSupport) +
      // Someone who has read a case study to the end is as close to enquiring
      // as this site ever gets, and until now their only exits were the demo
      // site and the previous/next work. One CTA, on every case study, using
      // the same wording and classes as the rest of the site.
      '<div class="reveal" style="text-align:center;margin:2.5rem 0 1rem;">' +
      '<a class="btn btn-primary" href="contact.html">CONTACTへ <span class="btn-arrow">→</span></a>' +
      "</div>" +
      '<div class="cs-nav reveal">' +
      '<a class="btn btn-ghost" href="case-study.html?work=' + prev.slug + '">← WORK ' + prev.number + "</a>" +
      '<a class="btn btn-ghost" href="case-study.html?work=' + next.slug + '">WORK ' + next.number + " →</a>" +
      "</div>" +
      "</div>";

    if (window.__initReveal) window.__initReveal();
  }

  function csStep(label, body) {
    return (
      '<div class="cs-step reveal">' +
      "<h2>" + label + "</h2>" +
      "<p>" + body + "</p>" +
      "</div>"
    );
  }

  window.renderWorksGrid = renderWorksGrid;
  window.renderWorksGallery = renderWorksGallery;
  window.renderCaseStudy = renderCaseStudy;
})();
