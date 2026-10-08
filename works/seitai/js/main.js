(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hero intro: add is-ready on the next frames (CSS falls back to visible without JS) */
  if (window.requestAnimationFrame) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('is-ready'); }); });
  } else {
    doc.classList.add('is-ready');
  }

  /* header shadow + mobile sticky CTA */
  var header = document.querySelector('.site-header');
  var heroCta = document.getElementById('hero-cta');
  var sticky = document.getElementById('sticky-cta');
  var reserve = document.getElementById('reserve');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (sticky) {
      var vh = window.innerHeight;
      var ctaInView = false;
      if (heroCta) {
        var c = heroCta.getBoundingClientRect();
        ctaInView = c.top < vh && c.bottom > 0;
      }
      var inReserve = false;
      if (reserve) {
        var r = reserve.getBoundingClientRect();
        inReserve = r.top < vh * 0.6 && r.bottom > 0;
      }
      sticky.classList.toggle('is-visible', y > 40 && !ctaInView && !inReserve);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');
  function closeMenu() {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1180) closeMenu();
    });
  }

  /* scroll spy: highlight the nav item of the section in view */
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('ul a[href^="#"]')) : [];
  var spyTargets = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  if (navLinks.length && 'IntersectionObserver' in window) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var current = null;
      spyTargets.forEach(function (el) { if (visible[el.id] && current === null) current = el.id; });
      navLinks.forEach(function (a) {
        var active = a.getAttribute('href') === '#' + current;
        a.classList.toggle('is-active', active);
        if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    spyTargets.forEach(function (el) { spy.observe(el); });
  }

  /* reveal */
  var items = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* demo form: never submits */
  var form = document.getElementById('reserve-form');
  var submit = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (submit && result) {
    submit.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。実際のサイトでは、ここからご予約を受け付けます。';
      result.classList.add('is-shown');
    });
  }

  /* year */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
