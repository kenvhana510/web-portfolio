(function () {
  'use strict';
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal on scroll (content stays visible without JS / reduced motion) */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    doc.classList.add('js');
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

  /* Header shadow + SP CTA visibility + scroll hint */
  var header = document.querySelector('.site-header');
  var spCta = document.querySelector('.sp-cta');
  var contact = document.getElementById('contact');
  var hero = document.querySelector('.hero');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (hero) hero.classList.toggle('is-scrolled', y > 80);
    if (spCta && contact) {
      var r = contact.getBoundingClientRect();
      spCta.classList.toggle('is-hidden', r.top < window.innerHeight * 0.6 && r.bottom > 0);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Current section highlight in global nav */
  var navLinks = document.querySelectorAll('.global-nav ul a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var secObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
        var a = byId[entry.target.id];
        if (a) { a.classList.add('is-current'); a.setAttribute('aria-current', 'location'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) secObserver.observe(sec);
    });
  }

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) setMenu(false);
    });
  }

  /* Works filter */
  var grid = document.getElementById('works-grid');
  var filterBtns = document.querySelectorAll('.works-filter button');
  var cards = document.querySelectorAll('.work-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (grid) grid.classList.toggle('is-filtered', f !== 'all');
      cards.forEach(function (card) {
        var cat = card.getAttribute('data-cat');
        var show = f === 'all' || cat === f || cat === 'all';
        card.classList.toggle('is-hidden', !show);
        if (show) {
          card.classList.add('is-visible');
          if (!reduceMotion) {
            card.classList.remove('is-entering');
            void card.offsetWidth; /* restart the enter animation */
            card.classList.add('is-entering');
          }
        }
      });
    });
  });

  /* Works lightbox (dialog) */
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCat = document.getElementById('lb-cat');
  var lbTitle = document.getElementById('lb-title');
  var lbMeta = document.getElementById('lb-meta');
  var lbData = document.getElementById('lb-data');
  var lbCounter = document.getElementById('lb-counter');
  var openers = Array.prototype.slice.call(document.querySelectorAll('.work-img[data-lightbox]'));
  var lbIndex = 0;
  var lbReturn = null;

  function visibleOpeners() {
    return openers.filter(function (b) { return !b.closest('.work-card').classList.contains('is-hidden'); });
  }
  function fillLightbox(btn) {
    var card = btn.closest('.work-card');
    var img = btn.querySelector('img');
    var cat = card.querySelector('.work-cat');
    var h3 = card.querySelector('h3');
    var meta = card.querySelector('figcaption > p');
    var data = card.querySelector('.work-data');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCat.textContent = cat ? cat.textContent : '';
    lbTitle.textContent = h3 ? h3.textContent : '';
    lbMeta.textContent = meta ? meta.textContent : '';
    lbData.innerHTML = data ? data.innerHTML : '';
    var list = visibleOpeners();
    lbCounter.textContent = (list.indexOf(btn) + 1) + ' / ' + list.length;
  }
  function showLightbox(i) {
    var list = visibleOpeners();
    if (!list.length) return;
    lbIndex = (i + list.length) % list.length;
    if (!reduceMotion) {
      lightbox.classList.remove('is-swapping');
      void lightbox.offsetWidth;
      lightbox.classList.add('is-swapping');
    }
    fillLightbox(list[lbIndex]);
  }
  if (lightbox && typeof lightbox.showModal === 'function' && lbImg) {
    openers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        lbReturn = btn;
        var list = visibleOpeners();
        lbIndex = Math.max(0, list.indexOf(btn));
        fillLightbox(btn);
        lightbox.showModal();
        document.body.classList.add('lb-open');
        var closeBtn = document.getElementById('lb-close');
        if (closeBtn) closeBtn.focus();
      });
    });
    document.getElementById('lb-prev').addEventListener('click', function () { showLightbox(lbIndex - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { showLightbox(lbIndex + 1); });
    document.getElementById('lb-close').addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) {
      /* click on the backdrop (outside the inner box) closes */
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); showLightbox(lbIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showLightbox(lbIndex + 1); }
    });
    lightbox.addEventListener('close', function () {
      document.body.classList.remove('lb-open');
      if (lbReturn) lbReturn.focus();
    });
  }

  /* FAQ: close others gently (one open at a time keeps the list scannable) */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      faqItems.forEach(function (o) { if (o !== d && o.open) o.open = false; });
    });
  });

  /* Demo form: never submits */
  var form = document.getElementById('contact-form');
  var submit = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (submit && result) {
    submit.addEventListener('click', function () {
      var name = document.getElementById('f-name');
      var tel = document.getElementById('f-tel');
      var missing = [];
      if (name && !name.value.trim()) missing.push('お名前');
      if (tel && !tel.value.trim()) missing.push('電話番号');
      if (missing.length) {
        result.textContent = missing.join('・') + 'をご入力ください。（デモサイトのため、実際には送信されません）';
        result.classList.add('is-shown', 'is-error');
        (missing[0] === 'お名前' ? name : tel).focus();
        return;
      }
      result.classList.remove('is-error');
      result.textContent = 'デモサイトのため送信されません。実際のサイトでは、ここで送信完了のご案内を表示します。';
      result.classList.add('is-shown');
    });
  }
})();
