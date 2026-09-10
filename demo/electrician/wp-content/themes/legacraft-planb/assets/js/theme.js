/**
 * テーマJS。
 * JS OFF でも主要コンテンツが読めることを前提にしているので、
 * ここでやるのはモバイルメニューの開閉だけ。
 * FAQ は <details> で JS 不要、フォームは通常の POST。
 */
(function () {
  'use strict';
  var burger = document.querySelector('.lc-burger');
  var nav = document.getElementById('lc-nav');
  if (!burger || !nav) return;

  function close() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'メニューを開く');
  }

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
