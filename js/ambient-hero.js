/* ==========================================================================
   LEGACRAFT — AMBIENT HERO v1

   スクロールに一切ぶら下がらない Hero。ScrollTrigger は使わない。
   背景だけが時間で静かに動き、コピーと CTA は最初から固定で出ている。

   停止条件を必ず持つ:
   - Hero がビューポートから外れたら止める（IntersectionObserver）
   - タブが非表示になったら止める（visibilitychange）
   - prefers-reduced-motion では最初から動かさない

   このスクリプトが動かない場合は head 側の watchdog がクラスを外し、
   静止した Hero へ確実に戻る。
   ========================================================================== */

(function () {
  "use strict";

  var html = document.documentElement;
  var root = document.querySelector(".ahero");

  function settleWatchdog() {
    window.__aheroReady = true;
    if (window.__aheroWatchdog) {
      clearTimeout(window.__aheroWatchdog);
      window.__aheroWatchdog = null;
    }
  }

  function fallbackToStatic() {
    html.classList.remove("ahero-live");
    html.classList.remove("ahero-calm");

    /* 静止 Hero に演出用の層はいらない。
       css/ambient-hero.css が届いていない場合、これらは寸法の指定を失って
       画面を押し広げてしまうので、CSS に頼らず直接畳む。 */
    if (root) {
      var junk = root.querySelectorAll(".ahero__layer, .ahero__seed");
      for (var i = 0; i < junk.length; i++) junk[i].style.display = "none";
    }

    settleWatchdog();
  }

  if (!root) { settleWatchdog(); return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!window.gsap) {
    fallbackToStatic();
    return;
  }

  var stageEl = root.querySelector(".ahero__stage");
  if (!stageEl) { fallbackToStatic(); return; }

  html.classList.add(reduced ? "ahero-calm" : "ahero-live");

  var $ = function (sel) { return root.querySelector(sel); };

  var spaceCanvas = $(".ahero__space");
  var depth = $(".ahero__depth");
  var glow = $(".ahero__glow");
  var pass = $(".ahero__pass");
  var seed = $(".ahero__seed");
  var seedHex = $(".ahero__seed-hex");

  /* --- 粒子空間（WebGL） --------------------------------------------------
     デスクトップ級の環境だけ。UA は見ない。
     モバイルでは create() を呼ばないので、コンテキストもシェーダーも
     描画ループも作られない。                                          */
  var space = null;

  var spaceAllowed = !reduced &&
    window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(pointer: coarse)").matches;

  function dropSpace() {
    space = null;
    if (spaceCanvas) spaceCanvas.style.display = "none";
    if (depth) depth.style.display = "";
  }

  if (spaceAllowed && spaceCanvas && window.LegacraftHeroSpace) {
    space = window.LegacraftHeroSpace.create(spaceCanvas, {
      mode: "ambient",
      onLost: dropSpace
    });
  }

  if (space) {
    /* WebGL が受け持つので CSS 版の光点は二重に出さない */
    if (depth) depth.style.display = "none";
  } else if (spaceCanvas) {
    spaceCanvas.style.display = "none";
  }

  /* --- 静止時の見え方 -----------------------------------------------------
     動かないモード（reduced motion）でも、背景は「暗いだけ」にしない。 */
  gsap.set(glow, { xPercent: -50, yPercent: -50, x: 0, y: 0, opacity: 0.3, scale: 1 });
  gsap.set(seed, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.set(depth, { x: 0, y: 0, opacity: space ? 0 : 0.5 });
  gsap.set(spaceCanvas, { opacity: space ? 0.8 : 0 });
  gsap.set(pass, { opacity: 0, x: 0 });

  if (reduced) {
    settleWatchdog();
    verifyStylesheet(30);
    return;
  }

  /* --- 常時のアンビエント -------------------------------------------------
     どれも transform / opacity だけ。周期は互いにずらして、
     全体が同じ拍で動いているように見えないようにする。        */
  var ambient = gsap.timeline({ paused: true });

  /* 中央の光がゆっくり呼吸する */
  ambient.to(glow, {
    opacity: 0.44, scale: 1.03,
    duration: 3.4, ease: "sine.inOut",
    repeat: -1, yoyo: true
  }, 0);

  /* 六角形はごく弱く発光するだけ。回さない。
     狭い画面では文字と重なるので、明るさの上限を下げる。 */
  var hexPeak = window.matchMedia("(max-width: 767px)").matches ? 0.16 : 0.27;

  ambient.to(seedHex, {
    opacity: hexPeak,
    duration: 4.1, ease: "sine.inOut",
    repeat: -1, yoyo: true
  }, 0);

  /* CSS 版の光点は数px 漂う（WebGL 版はシェーダー側で漂う） */
  if (!space && depth) {
    ambient.to(depth, {
      x: 6, y: -4,
      duration: 9, ease: "sine.inOut",
      repeat: -1, yoyo: true
    }, 0);
  }

  /* 十数秒に一度、遠くを細い光が通る */
  ambient.fromTo(pass,
    { opacity: 0, x: "-10vw" },
    {
      opacity: 0.5, x: "78vw",
      duration: 5.5, ease: "none",
      repeat: -1, repeatDelay: 11,
      onRepeat: function () { gsap.set(pass, { opacity: 0 }); }
    }, 2);

  ambient.to(pass, {
    opacity: 0,
    duration: 2.2, ease: "power1.in",
    repeat: -1, repeatDelay: 14.3
  }, 5.3);

  /* --- マウス追従（デスクトップのみ、背景だけ） ---------------------------
     コピーと CTA は動かさない。マウスを触らなくても
     アンビエントは動き続ける。                                   */
  var parallaxOn = spaceAllowed;
  var mx = 0, my = 0;
  var px = 0, py = 0;
  var parallaxRaf = 0;

  function onPointer(e) {
    var r = root.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (mx < -1) mx = -1; else if (mx > 1) mx = 1;
    if (my < -1) my = -1; else if (my > 1) my = 1;
  }

  function parallaxFrame() {
    parallaxRaf = 0;
    if (!running) return;
    /* 目標へ寄せていくだけ。急に追従させない。 */
    px += (mx - px) * 0.045;
    py += (my - py) * 0.045;
    gsap.set(glow, { x: px * 12, y: py * 12 });
    gsap.set(seed, { x: px * 4, y: py * 4 });
    if (!space && depth) gsap.set(depth, { xPercent: px * 60, yPercent: py * 60 });
    if (space) space.setMouse(px, py);
    parallaxRaf = requestAnimationFrame(parallaxFrame);
  }

  /* --- 動かす / 止める ----------------------------------------------------
     Hero が見えていて、かつタブが表示されているときだけ動かす。   */
  var running = false;
  var inView = true;
  var visible = document.visibilityState !== "hidden";

  function sync() {
    var shouldRun = inView && visible;
    if (shouldRun === running) return;
    running = shouldRun;

    if (running) {
      ambient.play();
      if (space) space.setActive(true);
      if (parallaxOn && !parallaxRaf) parallaxRaf = requestAnimationFrame(parallaxFrame);
    } else {
      ambient.pause();
      if (space) space.setActive(false);
      if (parallaxRaf) { cancelAnimationFrame(parallaxRaf); parallaxRaf = 0; }
    }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.06 }).observe(root);
  }

  document.addEventListener("visibilitychange", function () {
    visible = document.visibilityState !== "hidden";
    sync();
  });

  if (parallaxOn) {
    root.addEventListener("pointermove", onPointer, { passive: true });
    root.addEventListener("pointerleave", function () { mx = 0; my = 0; }, { passive: true });
  }

  sync();
  settleWatchdog();

  /* --- スタイルシートが本当に届いているかを確かめる ------------------------
     届いていなければ stage のカスタムプロパティが読めない。その状態で
     演出モードを続けると、寸法を失った層だけが残る。
     このスクリプトは stylesheet の適用より先に走ることがあるため、
     即断せず数フレーム待ってから判定する。                          */
  function verifyStylesheet(tries) {
    if (getComputedStyle(stageEl).getPropertyValue("--ahero-css").trim() === "1") return;
    if (tries <= 0) {
      ambient.kill();
      if (space) space.destroy();
      if (parallaxRaf) { cancelAnimationFrame(parallaxRaf); parallaxRaf = 0; }
      fallbackToStatic();
      return;
    }
    requestAnimationFrame(function () { verifyStylesheet(tries - 1); });
  }

  verifyStylesheet(30);
})();
