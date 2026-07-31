(function () {
  "use strict";

  var STATUS_LABEL = {
    pending: "準備中",
    "in-progress": "制作中",
    published: "公開中",
    demo: "制作事例（DEMO）",
  };

  function thumbStyle(work) {
    return work.thumbnail
      ? ' style="background-image:url(\'' + work.thumbnail + '\');background-size:cover;background-position:top center;"'
      : "";
  }

  function workCardHTML(work) {
    return (
      '<a class="work-card reveal" href="case-study.html?work=' + work.slug + '">' +
      '<div class="work-thumb"' + thumbStyle(work) + '>' +
      '<span class="work-status">' + STATUS_LABEL[work.status] + '</span>' +
      '<span class="work-number">WORK ' + work.number + '</span>' +
      '</div>' +
      '<div class="work-body">' +
      '<div class="work-industry">' + work.industry + '</div>' +
      '<h3>' + work.title + '</h3>' +
      '<p>' + work.summary + '</p>' +
      '</div>' +
      '</a>'
    );
  }

  function renderWorksGrid(selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = WORKS_DATA.map(workCardHTML).join("");
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
      '<div class="cs-visual reveal"' + thumbStyle(work) + '>' +
      (work.thumbnail ? "" : "Screenshot準備中（PC / Mobile）") +
      "</div>" +
      "</div>" +
      '<div class="container">' +
      csStep("課題", work.challenge) +
      csStep("設計", work.informationArchitecture + "　" + work.purpose) +
      csStep("デザイン", work.designConcept + "　" + work.designDecisions) +
      csStep("実装", work.wordpressImplementation + "　" + work.technologies) +
      csStep("品質確認", work.qa) +
      csStep("完成", work.mobileSupport) +
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
      "<h3>" + label + "</h3>" +
      "<p>" + body + "</p>" +
      "</div>"
    );
  }

  window.renderWorksGrid = renderWorksGrid;
  window.renderCaseStudy = renderCaseStudy;
})();
