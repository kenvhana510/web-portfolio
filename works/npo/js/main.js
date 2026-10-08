(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');

  /* ヘッダーの影 */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ハンバーガーメニュー */
  function setMenu(open) {
    if (open) {
      nav.style.setProperty('--nav-top', Math.round(header.getBoundingClientRect().bottom) + 'px');
    }
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.menu-label').textContent = open ? 'とじる' : 'メニュー';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () {
    setMenu(!header.classList.contains('menu-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1100 && header.classList.contains('menu-open')) setMenu(false);
  });

  /* HERO の入場 */
  var heroImg = document.querySelector('.hero-photo img');
  var heroCard = document.querySelector('.hero-card');
  function heroIn() { heroImg.classList.add('is-loaded'); heroCard.classList.add('is-in'); }
  if (heroImg.complete) { heroIn(); } else {
    heroImg.addEventListener('load', heroIn);
    heroImg.addEventListener('error', heroIn);
    setTimeout(heroIn, 1800);
  }

  /* スクロール表示 */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* 数字のカウントアップ（reduced-motion では静止） */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), start = null, dur = 1400;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased).toLocaleString('ja-JP');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ナビの現在地 */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
  var targets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (targets.length && 'IntersectionObserver' in window) {
    var current = null;
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) current = en.target.id;
        else if (current === en.target.id) current = null;
      });
      navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + current); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    targets.forEach(function (t) { nio.observe(t); });
  }

  /* 寄付・報告書のダミーボタン */
  var dummyMsg = document.getElementById('dummy-msg');
  var dummyTimer;
  document.querySelectorAll('.js-dummy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      dummyMsg.textContent = 'デモサイトのため、寄付の受付・決済や資料の公開は行っていません。';
      clearTimeout(dummyTimer);
      dummyTimer = setTimeout(function () { dummyMsg.textContent = ''; }, 4000);
    });
  });

  /* お問い合わせフォーム（送信しない） */
  var form = document.getElementById('contact-form');
  var submit = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  submit.addEventListener('click', function () {
    result.textContent = 'デモサイトのため送信されません。';
  });
})();
