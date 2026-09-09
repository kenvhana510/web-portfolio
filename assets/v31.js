/* LEGACRAFT V3.1 — 動きだけを担当する。内容の可視性は JS に依存させない。
   ・reduced-motion なら .js を付けない = 初期状態で全部表示済み
   ・IntersectionObserver が無ければ即座に全部表示
   ・視差は translate3d 1 プロパティのみ。rAF で 1 フレーム 1 回に束ねる */
(function () {
  'use strict';
  var root = document.documentElement;

  /* 固定 CTA の出し入れ。動きの設定に関係なく必要なので、
     reduced-motion の早期 return より前に置く。 */
  (function () {
    var bar = document.querySelector('.sticky');
    var heroCta = document.querySelector('.hero .btn--primary');
    if (!bar || !heroCta || !('IntersectionObserver' in window)) return;
    root.classList.add('js-sticky');
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { bar.classList.toggle('is-on', !e.isIntersecting); });
    }, { threshold: 0 }).observe(heroCta);
  })();

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  root.classList.add('js');

  var items = document.querySelectorAll('.human, .flow, .brand-band');
  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach(function (el) { io.observe(el); });

  /* 視差。画面内にある図版だけ動かす。動かす量は最大 ±14px に抑える
     （大きく動かすと読んでいる最中に画が逃げて、かえって読みにくい） */
  var pars = [].slice.call(document.querySelectorAll('.par'));
  if (!pars.length) return;
  var live = [];
  var pio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var i = live.indexOf(e.target);
      if (e.isIntersecting && i < 0) live.push(e.target);
      else if (!e.isIntersecting && i >= 0) live.splice(i, 1);
    });
    if (live.length) tick();
  }, { rootMargin: '10% 0px' });
  pars.forEach(function (el) { pio.observe(el); });

  var queued = false;
  function tick() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var vh = window.innerHeight;
      for (var i = 0; i < live.length; i++) {
        var el = live[i];
        var r = el.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;   // -1 .. 1 くらい
        if (p > 1) p = 1; else if (p < -1) p = -1;
        el.style.transform = 'translate3d(0,' + (p * -14).toFixed(2) + 'px,0)';
      }
    });
  }
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick, { passive: true });
})();
