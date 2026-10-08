(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) { closeMenu(); return; }
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
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  /* ---- header shadow ---- */
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
      result.textContent = 'デモサイトのため送信されません。実際のサイトでは、この内容が担当者に届きます。';
    });
  }

  var hasIO = 'IntersectionObserver' in window;

  /* ---- sticky CTA: hide while hero CTA or contact section is on screen ---- */
  var sticky = document.getElementById('sticky-cta');
  var heroCta = document.querySelector('.hero-cta');
  var contact = document.getElementById('contact');
  if (sticky && hasIO) {
    var seen = { hero: false, contact: false };
    var update = function () {
      sticky.classList.toggle('is-hidden', seen.hero || seen.contact);
    };
    var stickyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target === heroCta) seen.hero = entry.isIntersecting;
        if (entry.target === contact) seen.contact = entry.isIntersecting;
      });
      update();
    }, { threshold: 0.15 });
    if (heroCta) stickyIO.observe(heroCta);
    if (contact) stickyIO.observe(contact);
  }

  /* ---- active section in header nav ---- */
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  if (navLinks.length && hasIO) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var current = null;
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) current = entry.target.id;
      });
      navLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + current;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---- reveal on scroll (staggered within a group) ---- */
  var groups = [
    '.sec-head', '.trouble-card', '.service-block', '.price-base', '.price-table', '.receipt',
    '.reason-list li', '.flow-step', '.voice-card', '.faq-item', '.company-layout > *',
    '.contact-layout > *', '.trust-strip li', '.cta-band-inner > *'
  ];
  if (!reduce && hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    groups.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      Array.prototype.forEach.call(els, function (el, i) {
        el.classList.add('reveal');
        el.style.setProperty('--d', (Math.min(i, 5) * 0.08) + 's');
        io.observe(el);
      });
    });
  }
})();
