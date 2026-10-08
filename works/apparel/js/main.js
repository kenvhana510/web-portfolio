(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  // header border on scroll + floating CTA visibility
  var header = document.getElementById('siteHeader');
  var floatCta = document.getElementById('floatCta');
  var contact = document.getElementById('contact');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (floatCta && contact) {
      var r = contact.getBoundingClientRect();
      var nearContact = r.top < window.innerHeight && r.bottom > 0;
      floatCta.classList.toggle('is-hidden', y < 400 || nearContact);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('globalNav');
  function setMenu(open) {
    if (!toggle || !nav) return;
    if (open && header) {
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) setMenu(false);
    });
  }

  // reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // demo form: never submits
  var form = document.getElementById('contactForm');
  var btn = document.getElementById('submitBtn');
  var result = document.getElementById('formResult');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (btn && result) {
    btn.addEventListener('click', function () {
      result.textContent = 'デモサイトのため送信されません。';
    });
  }
})();
