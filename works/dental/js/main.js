(function () {
  'use strict';
  // loaded in <head> so the .js class exists before first paint (no reveal flash)
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.getElementById('global-nav');

    // header shadow on scroll
    function onScroll() {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // hamburger
    function setNav(open) {
      if (!toggle || !nav) return;
      if (open && header) {
        nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
      }
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    }
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        setNav(toggle.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setNav(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setNav(false);
          toggle.focus();
        }
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 1080) setNav(false);
      });
    }

    // hours: highlight today + one-line summary
    var day = new Date().getDay();
    document.querySelectorAll('.hours-table [data-day="' + day + '"]').forEach(function (el) {
      el.classList.add('is-today');
    });
    var today = document.getElementById('hours-today');
    if (today) {
      var names = ['日', '月', '火', '水', '木', '金', '土'];
      var text;
      if (day === 6) text = '9:00〜13:00／14:00〜17:00 診療';
      else if (day === 0 || day === 4) text = '休診日です';
      else text = '9:00〜13:00／14:30〜19:00 診療';
      today.innerHTML = '<span class="hours-today-day">本日（' + names[day] + '）</span>' + text;
      today.classList.add('is-shown');
    }

    // current section in desktop nav
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.global-nav a[href^="#"]'));
    var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      var current = null;
      var navIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) current = entry.target.id;
        });
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', current !== null && a.getAttribute('href') === '#' + current);
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sections.forEach(function (s) { navIo.observe(s); });
    }

    // reveal on scroll
    var reveals = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduce) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }

    // hide the mobile sticky bar while the reservation section is on screen
    var reserve = document.getElementById('reserve');
    if (reserve && 'IntersectionObserver' in window) {
      var ctaIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          document.body.classList.toggle('cta-hidden', entry.isIntersecting);
        });
      }, { threshold: 0.15 });
      ctaIo.observe(reserve);
    }

    // demo form: never submits
    var form = document.getElementById('reserve-form');
    var btn = document.getElementById('form-submit');
    var result = document.getElementById('form-result');
    if (form) {
      form.addEventListener('submit', function (e) { e.preventDefault(); });
    }
    if (btn && result) {
      btn.addEventListener('click', function () {
        result.innerHTML = '<span class="form-result-main">デモサイトのため送信されません。</span><span class="form-result-sub">実際のサイトでは、ここで予約内容の確認画面に進みます。</span>';
        result.classList.add('is-shown');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
