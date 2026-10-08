(function () {
  'use strict';
  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');
  var fixedCta = document.querySelector('.fixed-cta');
  var contact = document.getElementById('contact');

  // mobile menu
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.sr-only').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  // header border + fixed CTA visibility
  var contactInView = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (fixedCta) fixedCta.classList.toggle('is-visible', y > 600 && !contactInView);
  }
  if ('IntersectionObserver' in window && contact) {
    new IntersectionObserver(function (entries) {
      contactInView = entries[0].isIntersecting; onScroll();
    }, { threshold: 0.05 }).observe(contact);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // hero entrance: wait for fonts (max 600ms), then release
  var ready = false;
  function setReady() { if (!ready) { ready = true; root.classList.add('is-ready'); } }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { requestAnimationFrame(setReady); }); }
  setTimeout(setReady, 600);

  // lightbox for works (progressive: links open the image file without JS)
  var box = document.getElementById('lightbox');
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox]'));
  if (box && links.length && typeof box.showModal === 'function') {
    var boxImg = box.querySelector('.lightbox-img');
    var boxTitle = box.querySelector('.lightbox-title');
    var boxMeta = box.querySelector('.lightbox-meta');
    var current = 0, lastFocus = null;
    function show(i) {
      current = (i + links.length) % links.length;
      var a = links[current];
      var src = a.getAttribute('href');
      boxImg.classList.add('is-switching');
      var next = new Image();
      next.onload = next.onerror = function () {
        boxImg.src = src;
        boxImg.alt = a.querySelector('img').alt;
        boxTitle.textContent = a.getAttribute('data-title') || '';
        boxMeta.textContent = a.getAttribute('data-meta') || '';
        requestAnimationFrame(function () { boxImg.classList.remove('is-switching'); });
      };
      next.src = src;
    }
    function open(i, trigger) {
      lastFocus = trigger || document.activeElement;
      show(i);
      box.showModal();
      document.body.classList.add('lightbox-open');
      box.querySelector('.lightbox-close').focus();
    }
    function close() { if (box.open) box.close(); }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(i, a); });
    });
    box.addEventListener('close', function () {
      document.body.classList.remove('lightbox-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.lightbox-btn');
      if (b && b.hasAttribute('data-dir')) { show(current + Number(b.getAttribute('data-dir'))); return; }
      if (b && b.classList.contains('lightbox-close')) { close(); return; }
      if (!e.target.closest('.lightbox-img, .lightbox-caption')) close();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    });
  }

  // reveal
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // demo form: never submits
  var form = document.getElementById('contact-form');
  var btn = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });
  if (btn && result) {
    btn.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。実際のお問い合わせは受け付けていません。';
    });
  }
})();
