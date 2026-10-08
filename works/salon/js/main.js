(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var nav = document.getElementById('gnav');
  var toggle = document.querySelector('.menu-toggle');
  var mobileCta = document.getElementById('mobile-cta');
  var hero = document.querySelector('.hero');
  var reserve = document.getElementById('reserve');
  var reserveInView = false;

  /* header state + mobile CTA visibility */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (mobileCta && hero) {
      mobileCta.classList.toggle('is-visible', y > hero.offsetHeight * 0.6 && !reserveInView);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* hamburger */
  function setNav(open) {
    if (!nav || !toggle) return;
    if (open && header) {
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.visually-hidden').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1080) setNav(false);
  });

  var hasIO = 'IntersectionObserver' in window;

  /* reveal */
  var items = document.querySelectorAll('.reveal');
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* active section in global nav */
  var navLinks = nav ? nav.querySelectorAll('li a[href^="#"]') : [];
  if (hasIO && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* hide mobile CTA while the reservation form is on screen (its own button is there) */
  if (hasIO && reserve && mobileCta) {
    new IntersectionObserver(function (entries) {
      reserveInView = entries[0].isIntersecting;
      onScroll();
    }, { rootMargin: '0px 0px -30% 0px', threshold: 0.05 }).observe(reserve);
  }

  /* style gallery: dots for the horizontal scroller on phones */
  var grid = document.getElementById('style-grid');
  var styleNav = document.getElementById('style-nav');
  if (grid && styleNav) {
    var dotsWrap = styleNav.querySelector('.style-dots');
    var slides = grid.children;
    var dots = [];
    for (var i = 0; i < slides.length; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'style-dot' + (idx === 0 ? ' is-active' : '');
        b.setAttribute('tabindex', '-1');
        b.addEventListener('click', function () {
          slides[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        });
        dotsWrap.appendChild(b);
        dots.push(b);
      })(i);
    }
    var ticking = false;
    function updateDots() {
      ticking = false;
      var gridRect = grid.getBoundingClientRect();
      var best = 0, bestDist = Infinity;
      for (var j = 0; j < slides.length; j++) {
        var d = Math.abs(slides[j].getBoundingClientRect().left - gridRect.left - parseFloat(getComputedStyle(grid).paddingLeft));
        if (d < bestDist) { bestDist = d; best = j; }
      }
      dots.forEach(function (dot, k) { dot.classList.toggle('is-active', k === best); });
    }
    grid.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateDots); }
    }, { passive: true });
  }

  /* demo form: never submits */
  var form = document.getElementById('reserve-form');
  var submit = document.getElementById('reserve-submit');
  var message = document.getElementById('form-message');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (submit && message) {
    submit.addEventListener('click', function () {
      message.textContent = 'デモサイトのため送信されません。実際のサイトでは、ここでご予約内容の確認画面に進みます。';
      message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
})();
