(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('globalNav');
  var toggle = document.getElementById('menuToggle');

  /* header shadow */
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* hamburger */
  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      if (open) {
        nav.style.setProperty('--nav-top', Math.max(0, header.getBoundingClientRect().bottom) + 'px');
      }
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1023) closeNav();
    });
  }

  /* reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  /* opening status (local clock; fictional hours: Mon/Tue/Thu/Fri 7-18, Sat/Sun 7-17, Wed closed) */
  function openingStatus() {
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var closeAt = (day === 0 || day === 6) ? 17 * 60 : 18 * 60;
    var openAt = 7 * 60;
    if (day === 3) return { open: false, label: '本日は定休日', detail: '定休日', closeLabel: '' };
    if (mins < openAt) return { open: false, label: '準備中 ・ 7:00 開店', detail: '準備中', closeLabel: '7:00 開店' };
    if (mins >= closeAt) return { open: false, label: '本日の営業は終了しました', detail: '本日は閉店', closeLabel: '' };
    var closeStr = (closeAt / 60) + ':00';
    if (mins < 11 * 60) return { open: true, label: '営業中 ・ モーニング 11:00まで', detail: '営業中', closeLabel: closeStr + ' 閉店' };
    return { open: true, label: '営業中 ・ ' + closeStr + ' 閉店', detail: '営業中', closeLabel: closeStr + ' 閉店' };
  }
  function renderStatus() {
    var st = openingStatus();
    var chip = document.getElementById('statusChip');
    var text = document.getElementById('statusText');
    if (chip && text) {
      chip.classList.toggle('is-open', st.open);
      chip.classList.toggle('is-closed', !st.open);
      chip.querySelector('.chip-label').textContent = st.open ? '営業中' : '本日';
      text.textContent = st.open ? st.closeLabel : (st.label.replace('本日は', '').replace('本日の', ''));
    }
    var hs = document.getElementById('hoursStatus');
    if (hs) {
      hs.hidden = false;
      hs.textContent = st.open ? st.detail + ' ・ ' + st.closeLabel : st.label;
      hs.classList.toggle('is-closed', !st.open);
    }
    var day = new Date().getDay();
    document.querySelectorAll('.hours tr[data-days]').forEach(function (tr) {
      var days = tr.getAttribute('data-days').split(',');
      tr.classList.toggle('is-today', days.indexOf(String(day)) !== -1);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* mobile CTA: appear after the hero, hide while the footer is in view */
  var cta = document.getElementById('mobileCta');
  var hero = document.getElementById('top');
  var footer = document.querySelector('.site-footer');
  if (cta && hero && 'IntersectionObserver' in window) {
    var heroSeen = false, footerSeen = false;
    function updateCta() { cta.classList.toggle('is-shown', !heroSeen && !footerSeen); }
    new IntersectionObserver(function (entries) {
      heroSeen = entries[0].isIntersecting; updateCta();
    }, { threshold: 0, rootMargin: '-120px 0px 0px 0px' }).observe(hero);
    if (footer) {
      new IntersectionObserver(function (entries) {
        footerSeen = entries[0].isIntersecting; updateCta();
      }, { threshold: 0.15 }).observe(footer);
    }
  } else if (cta) {
    cta.classList.add('is-shown');
  }

  /* demo form: never submits */
  var form = document.getElementById('contactForm');
  var btn = document.getElementById('submitBtn');
  var result = document.getElementById('formResult');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (btn && result) {
    btn.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。お問い合わせありがとうございました。';
    });
  }
})();
