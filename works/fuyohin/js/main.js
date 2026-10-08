(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  // ハンバーガーメニュー
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      toggle.querySelector('.menu-toggle-label').textContent = open ? '閉じる' : 'メニュー';
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) setOpen(false);
    });
  }

  // ヘッダー：スクロール時に影
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // フォーム：デモのため送信しない
  var form = document.getElementById('contact-form');
  var submit = document.getElementById('form-submit');
  var result = document.getElementById('form-result');
  if (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }
  if (submit && result) {
    submit.addEventListener('click', function () {
      result.hidden = false;
    });
  }

  if (!('IntersectionObserver' in window)) return;

  // SP固定CTA：お問い合わせセクション表示中は隠す（フォームを覆わない）
  var spCta = document.getElementById('sp-cta');
  var contact = document.getElementById('contact');
  if (spCta && contact) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        spCta.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { rootMargin: '-40% 0px -30% 0px', threshold: 0 }).observe(contact);
  }

  // スクロール表示
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var targets = document.querySelectorAll(
    '.section-title, .section-lead, .worry-item, .plan, .items-head-text, .items-photo, .item-grid li, .items-ng, .reason-item, .flow-step, .cta-steps li, .cta-actions, .case-card, .voice-card, .faq-list, .contact-form, .contact-tel'
  );
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // 表示完了後は reveal を外し、ホバー等の通常トランジションに戻す
        setTimeout(function () {
          el.classList.remove('reveal', 'is-visible');
          el.classList.add('is-shown');
          el.style.transitionDelay = '';
        }, 1300);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach(function (el) {
    el.classList.add('reveal');
    var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(idx, 5) * 70 + 'ms';
    io.observe(el);
  });
})();
