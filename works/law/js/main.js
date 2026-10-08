(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');
  var header = document.querySelector('.site-header');

  function setNavTop() {
    if (!header) return;
    root.style.setProperty('--nav-top', Math.round(header.getBoundingClientRect().bottom) + 'px');
  }
  function closeMenu() {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    nav.classList.remove('is-open');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); return; }
      setNavTop();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'メニューを閉じる');
      nav.classList.add('is-open');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('scroll', function () {
      if (nav.classList.contains('is-open')) setNavTop();
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1080) closeMenu();
    });
  }

  /* ---- demo form (never submits) ---- */
  var form = document.getElementById('contact-form');
  var submit = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (submit && result) {
    submit.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。実際のサイトでは、この内容が事務所に届き、担当者から折り返しご連絡します。';
    });
  }

  /* ---- header shadow after scroll ---- */
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- reveal on scroll ---- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.sec-head, .worry-list, .worry-answer, .practice-card, .approach-list li, .fee-base, .fee-table-wrap, .cta-band-inner, .lawyer-head, .lawyer-message, .lawyer-meta, .flow-step, .faq-list, .contact-form, .office-table, .map-card');
  var imgTargets = document.querySelectorAll('.practice-img, .approach-media, .lawyer-photo');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
    imgTargets.forEach(function (el) { el.classList.add('reveal-img'); io.observe(el); });
  }
})();
