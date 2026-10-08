(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');

  // header shadow
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  var setMenu = function (open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-label').textContent = open ? 'CLOSE' : 'MENU';
    if (open) {
      nav.style.setProperty('--nav-top', Math.max(0, header.getBoundingClientRect().bottom) + 'px');
    }
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // current section -> nav underline (desktop)
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('ul a[href^="#"]'));
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var current = null;
    var setCurrent = function (id) {
      if (id === current) return;
      current = id;
      navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + id); });
    };
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setCurrent(entry.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { so.observe(s); });
  }

  // SP fixed CTA: step aside while the form itself is on screen
  var spCta = document.querySelector('.sp-cta');
  var formBox = document.querySelector('.form-box');
  if (spCta && formBox && 'IntersectionObserver' in window) {
    var fo = new IntersectionObserver(function (entries) {
      spCta.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0.05 });
    fo.observe(formBox);
  }

  // demo form: never submits
  var form = document.getElementById('trial-form');
  var btn = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form && btn && result) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。実際のサイトでは、ここで送信完了のご案内を表示します。';
      result.classList.add('is-shown');
    });
  }
})();
