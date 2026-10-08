(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- mobile menu ----
  var header = document.getElementById('site-header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');

  function setMenu(open) {
    if (!toggle || !nav) return;
    if (open) {
      var bottom = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
      nav.style.setProperty('--nav-top', bottom + 'px');
    }
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) setMenu(false);
    });
  }

  // ---- reveal on scroll ----
  var items = document.querySelectorAll('.reveal');
  function show(el) {
    el.classList.add('is-visible');
    // after the entrance finishes, hand transitions back to the hover styles
    window.setTimeout(function () { el.classList.add('is-done'); }, reduce ? 0 : 1300);
  }
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // ---- property tabs (filter) ----
  var tabs = document.querySelectorAll('.property-tab');
  var cards = document.querySelectorAll('#property-grid .property-card');
  var more = document.querySelector('#property-grid .property-more');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var f = tab.getAttribute('data-filter');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      cards.forEach(function (c) {
        var hide = f !== 'all' && c.getAttribute('data-type') !== f;
        c.classList.toggle('is-hidden', hide);
        if (!hide && !c.classList.contains('is-visible')) show(c);
      });
      if (more) more.classList.toggle('is-shown', f !== 'all');
    });
  });

  // ---- dummy search panel (never searches) ----
  var searchBtn = document.getElementById('search-btn');
  var searchResult = document.getElementById('search-result');
  if (searchBtn && searchResult) {
    searchBtn.addEventListener('click', function () {
      var type = document.getElementById('s-type');
      var label = type ? type.options[type.selectedIndex].text : '';
      searchResult.textContent = 'デモサイトのため検索結果は表示されません。「' + label + '」のご希望は、下のピックアップ物件とお問い合わせフォームからご相談ください。';
      searchResult.classList.add('is-shown');
    });
  }

  // ---- demo form (never submits) ----
  var form = document.getElementById('contact-form');
  var btn = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (btn && result) {
    btn.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。実際のサイトでは、ここで送信完了のご案内を表示します。';
      result.classList.add('is-shown');
    });
  }

  // ---- year ----
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
