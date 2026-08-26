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
  window.renderCaseStudy = renderCaseStudy;
})();
