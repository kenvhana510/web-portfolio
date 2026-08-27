/* ==========================================================================
   LEGACRAFT — CINEMATIC HERO v1.1
   スクロール量を GSAP のタイムラインへマッピングする（自動再生はしない）。

   モードは3つ:
     html.chero-live  通常演出（6 Scene / v1 のまま。変更しない）
     html.chero-calm  低モーション版（prefers-reduced-motion: reduce）
                      opacity のクロスフェードのみ。translate/scale/rotation は使わない
     クラス無し        静的Hero（JS無効・GSAP読込失敗・CSS未適用）

   このスクリプトが動かない場合は head 側の watchdog が両クラスを外し、
   静的Heroへ確実に戻る。
   ========================================================================== */

(function () {
  "use strict";

  var html = document.documentElement;
  var root = document.querySelector(".chero");

  /* head 側の watchdog を止める。以降の復旧はこのスクリプトの責任になる。 */
  function settleWatchdog() {
    window.__cheroReady = true;
    if (window.__cheroWatchdog) {
      clearTimeout(window.__cheroWatchdog);
      window.__cheroWatchdog = null;
    }
  }

  function fallbackToStatic() {
    html.classList.remove("chero-live");
    html.classList.remove("chero-calm");
    document.body && document.body.classList.remove("chero-immersive");
    settleWatchdog();
  }

  if (!root) { settleWatchdog(); return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!window.gsap || !window.ScrollTrigger) {
    fallbackToStatic();
    return;
  }

  var stageEl = root.querySelector(".chero__stage");

  /* CSS が届いていない場合は演出モードに入らない（暗闇Heroを作らない）。
     html に演出クラスが付いていれば stage は sticky になっているはず。 */
  html.classList.add(reduced ? "chero-calm" : "chero-live");

  if (!stageEl || getComputedStyle(stageEl).position !== "sticky") {
    fallbackToStatic();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var $ = function (sel) { return root.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

  var seed = $(".chero__seed");
  var glow = $(".chero__glow");
  var grid = $(".chero__grid");
  var network = $(".chero__network");
  var netLines = $$(".chero__net-line");
  var netNodes = $$(".chero__node");
  var labels = $$(".chero__label");
  var hint = $(".chero__hint");
  var message = $(".chero__message");
  var fade = $(".chero__fade");
  var particleWrap = $(".chero__particles");

  var rays = $$(".chero__rays span");
  var rayH = rays[0];
  var rayV = rays[1];
  var rayDiagonals = rays.slice(2);

  /* --- 粒子を生成（PCのみ。CSSで mobile は display:none） --------------- */
  var particles = [];

  if (particleWrap) {
    for (var i = 0; i < 18; i++) {
      var dot = document.createElement("span");
      var angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.4;
      var radius = 16 + ((i * 37) % 30);
      dot.style.left = (50 + Math.cos(angle) * radius).toFixed(2) + "%";
      dot.style.top = (50 + Math.sin(angle) * radius * 0.78).toFixed(2) + "%";
      particleWrap.appendChild(dot);
      particles.push(dot);
    }
  }

  /* --- 接続線を「未接続」状態にする ------------------------------------- */
  netLines.forEach(function (line) {
    var len = 0;
    try { len = line.getTotalLength(); } catch (e) { len = 1200; }
    if (!len) len = 1200;
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.__chLen = len;
  });

  /* --- 初期状態（transform は GSAP が全面的に管理する） ----------------- */
  function setInitialState() {
    /* CSS 側の translate(-50%,-50%) を px として二重に拾わないよう x/y を明示クリアする */
    gsap.set([seed, glow], { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    gsap.set(seed, { opacity: 0.3, scale: 0.5 });
    gsap.set(glow, { opacity: 0, scale: 0.18 });
    gsap.set(hint, { x: 0, xPercent: -50, opacity: 1 });

    gsap.set(grid, {
      opacity: 0,
      transformPerspective: 620,
      transformOrigin: "50% 100%",
      rotateX: 74,
      yPercent: 14
    });

    gsap.set(rayH, { x: 0, y: 0, xPercent: -50, yPercent: -50, scaleX: 0 });
    gsap.set(rayV, { x: 0, y: 0, xPercent: -50, yPercent: -50, scaleY: 0 });
    rayDiagonals.forEach(function (ray, idx) {
      gsap.set(ray, {
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
        rotation: idx === 0 ? 24 : -24,
        scaleX: 0,
        opacity: 0.5
      });
    });

    gsap.set(network, { opacity: 0, transformOrigin: "50% 50%", scale: 1 });
    gsap.set(netNodes, { opacity: 0, scale: 0.4 });
    gsap.set(labels, { x: 0, xPercent: -50, yPercent: -50, opacity: 0, y: 10 });
    gsap.set(particles, { opacity: 0, scale: 0.6 });
    gsap.set(message, { opacity: 0, visibility: "visible", y: 26 });
    gsap.set(fade, { opacity: 0 });

    netLines.forEach(function (line) {
      gsap.set(line, { strokeDashoffset: line.__chLen });
    });
  }

  /* --- 低モーション版タイムライン（opacity のみ） ------------------------
     VOID → IGNITION → MESSAGE → 通常サイト。
     位置・大きさ・角度は一切動かさない。中心合わせの translate は
     アニメーションではなく固定値としてだけ使う。
     ---------------------------------------------------------------------- */
  function buildCalmTimeline() {
    gsap.set([seed, glow], { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 1 });
    gsap.set(seed, { opacity: 0.25 });
    gsap.set(glow, { opacity: 0 });
    gsap.set(message, { opacity: 0, visibility: "visible", y: 0 });
    gsap.set(fade, { opacity: 0 });

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        invalidateOnRefresh: true
      }
    });

    tl.to(seed, { opacity: 1, duration: 30 }, 0)          /* VOID     */
      .to(glow, { opacity: 0.9, duration: 32 }, 26)       /* IGNITION */
      .to(seed, { opacity: 0, duration: 24 }, 50)         /* cross-fade */
      .to(message, { opacity: 1, duration: 28 }, 58)      /* MESSAGE  */
      .to(glow, { opacity: 0.4, duration: 22 }, 68)
      .to(fade, { opacity: 1, duration: 16 }, 82)         /* TRANSITION */
      .set({}, {}, 100);

    return function cleanup() {
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* --- スクロール連動タイムライン --------------------------------------- */
  var mm = gsap.matchMedia();

  if (reduced) {
    mm.add("(prefers-reduced-motion: reduce)", buildCalmTimeline);
  } else {
    mm.add("(min-width: 768px)", function () { return buildTimeline(true); });
    mm.add("(max-width: 767px)", function () { return buildTimeline(false); });
  }

  settleWatchdog();

  function buildTimeline(isDesktop) {
    setInitialState();

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          document.body.classList.toggle(
            "chero-immersive",
            self.progress > 0.002 && self.progress < 0.9
          );
        },
        onLeave: function () { document.body.classList.remove("chero-immersive"); },
        onLeaveBack: function () { document.body.classList.remove("chero-immersive"); }
      }
    });

    /* SCENE 01 — VOID（0 → 18） */
    tl.to(seed, { opacity: 1, scale: 1, duration: 14 }, 0)
      .to(hint, { opacity: 0, duration: 7 }, 12);

    /* SCENE 02 — IGNITION（18 → 40） */
    tl.to(glow, { opacity: 1, scale: 1, duration: 22 }, 18)
      .to(seed, { scale: 1.18, duration: 22 }, 18)
      .to(rayH, { scaleX: 1, duration: 17 }, 19)
      .to(rayV, { scaleY: 1, duration: 17 }, 21);

    if (isDesktop) {
      tl.to(rayDiagonals, { scaleX: 1, duration: 16, stagger: 3 }, 23)
        .to(grid, { opacity: 0.55, yPercent: 0, duration: 21 }, 20)
        .to(particles, {
          opacity: 0.85,
          scale: 1,
          duration: 14,
          stagger: { each: 0.35, from: "random" }
        }, 22);
    }

    /* SCENE 03 — CONNECTION（40 → 62） */
    tl.to(network, { opacity: 1, duration: 5 }, 40)
      .to(netLines, {
        strokeDashoffset: 0,
        duration: 15,
        stagger: 0.8
      }, 40)
      .to(netNodes, { opacity: 1, scale: 1, duration: 6, stagger: 0.7 }, 46)
      .to(labels, { opacity: 1, y: 0, duration: 8, stagger: 1.1 }, 46);

    /* SCENE 04 — FORMATION（62 → 78） */
    tl.to(network, { scale: isDesktop ? 0.4 : 0.5, opacity: 0.3, duration: 16 }, 62)
      .to(glow, { scale: 1.5, duration: 16 }, 62)
      .to(seed, { scale: 2.8, opacity: 0, duration: 14 }, 63);

    if (isDesktop) {
      tl.to(grid, { opacity: 0.16, duration: 16 }, 62)
        .to(particles, { opacity: 0, duration: 12 }, 62);
    }

    tl.to([rayH, rayV], { opacity: 0.25, duration: 14 }, 64);

    if (isDesktop) {
      tl.to(rayDiagonals, { opacity: 0, duration: 12 }, 64);
    }

    /* SCENE 05 — MESSAGE（78 → 93） */
    tl.to(message, { opacity: 1, y: 0, duration: 13 }, 78)
      .to(network, { opacity: 0, duration: 10 }, 78)
      .to(glow, { scale: 1.08, opacity: 0.5, duration: 15 }, 78);

    /* SCENE 06 — TRANSITION（86 → 96、残りは保持したまま通常サイトへ抜ける） */
    tl.to(fade, { opacity: 1, duration: 10 }, 86);

    /* タイムライン長を 100 に固定する。
       これがないと総尺が最後のtweenの終了時刻になり、スクロール量との対応がずれる。 */
    tl.set({}, {}, 100);

    return function cleanup() {
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* --- フォント確定後にトリガー位置を取り直す --------------------------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
