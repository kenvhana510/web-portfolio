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

    /* 静的Heroでは演出用の層は一切いらない。
       css/cinematic-hero.css が届いていない場合、これらは寸法の指定を失って
       画面を押し広げてしまうので、CSS に頼らず直接畳む。 */
    if (root) {
      var junk = root.querySelectorAll(".chero__layer, .chero__seed, .chero__streak, .chero__hint");
      for (var i = 0; i < junk.length; i++) junk[i].style.display = "none";
    }

    settleWatchdog();
  }

  if (!root) { settleWatchdog(); return; }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!window.gsap || !window.ScrollTrigger) {
    fallbackToStatic();
    return;
  }

  var stageEl = root.querySelector(".chero__stage");

  html.classList.add(reduced ? "chero-calm" : "chero-live");

  if (!stageEl) {
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
  var msgBrand = $(".chero__brand");
  var msgHead = $(".chero__headline");
  var msgSub = $(".chero__sub");
  var msgActions = $(".chero__actions");
  var messageParts = [msgBrand, msgHead, msgSub, msgActions].filter(Boolean);
  var fade = $(".chero__fade");
  var particleWrap = $(".chero__particles");

  var spaceCanvas = $(".chero__space");
  var depth = $(".chero__depth");
  var streak = $(".chero__streak");
  var flash = $(".chero__flash");
  var coreHalo = $(".chero__core-halo");
  var pulses = $$(".chero__pulse");
  var flowLines = $$(".chero__net-flow");

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

  /* --- ノードの定位置（SVG と同じ座標系）と、CORE を回る軌道の計算 -------
     ノードは「奥から現れ → CORE の周りを旋回 → 定位置に着く」。
     x/y は定位置からのオフセットとして渡すため、都度ここで差分を出す。
     ビューポートが変わると値も変わるので関数として GSAP に渡す。       */
  var NODE_KEYS = ["web", "design", "growth", "ai", "automation"];
  var NODE_POS = {
    web: [18.5, 30], design: [83, 26.5], growth: [86.5, 70],
    ai: [50, 81], automation: [14, 69]
  };

  function arc(key, radiusRatio, angleDeg) {
    var r = stageEl.getBoundingClientRect();
    var pos = NODE_POS[key];
    var dx = (pos[0] / 100 - 0.5) * r.width;
    var dy = (pos[1] / 100 - 0.5) * r.height;
    var radius = Math.sqrt(dx * dx + dy * dy);
    var theta = Math.atan2(dy, dx) + angleDeg * Math.PI / 180;
    return {
      x: radius * radiusRatio * Math.cos(theta) - dx,
      y: radius * radiusRatio * Math.sin(theta) - dy
    };
  }

  function nodeOf(key) { return root.querySelector('.chero__node[data-node="' + key + '"]'); }
  function labelOf(key) { return root.querySelector('.chero__label[data-node="' + key + '"]'); }

  /* --- ネットワークの実寸レイアウト --------------------------------------
     SVG を stage と同じピクセル座標系にし、線の端点をノードの位置から引く。
     こうすると線が歪まず、破線の長さも画面上の見た目と一致する。       */
  var netSvg = $(".chero__net");
  var CENTER = [50, 50];
  var SPOKES = NODE_KEYS.map(function (k) { return [CENTER, NODE_POS[k]]; });
  var RIMS = [
    [NODE_POS.web, NODE_POS.design],
    [NODE_POS.design, NODE_POS.growth],
    [NODE_POS.growth, NODE_POS.ai],
    [NODE_POS.ai, NODE_POS.automation],
    [NODE_POS.automation, NODE_POS.web]
  ];

  function layoutNet() {
    if (!netSvg) return;
    var r = stageEl.getBoundingClientRect();
    var w = Math.round(r.width);
    var h = Math.round(r.height);
    if (!w || !h) return;

    netSvg.setAttribute("viewBox", "0 0 " + w + " " + h);

    SPOKES.concat(RIMS).forEach(function (pair, i) {
      var px = function (pos) { return [pos[0] / 100 * w, pos[1] / 100 * h]; };
      var a = px(pair[0]);
      var b = px(pair[1]);
      [netLines[i], flowLines[i]].forEach(function (line) {
        if (!line) return;
        line.setAttribute("x1", a[0].toFixed(1));
        line.setAttribute("y1", a[1].toFixed(1));
        line.setAttribute("x2", b[0].toFixed(1));
        line.setAttribute("y2", b[1].toFixed(1));
      });
      var len = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
      if (netLines[i]) {
        netLines[i].__chLen = len;
        netLines[i].style.strokeDasharray = len;
      }
    });
  }

  /* --- 接続線を「未接続」状態にする ------------------------------------- */
  layoutNet();
  netLines.forEach(function (line) {
    line.style.strokeDashoffset = line.__chLen || 0;
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
    gsap.set(netNodes, { opacity: 0, scale: 0.12, x: 0, y: 0 });
    gsap.set(coreHalo, { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set(pulses, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.12 });
    gsap.set(flowLines, { opacity: 0, strokeDashoffset: 0 });
    gsap.set(flash, { opacity: 0 });
    gsap.set(depth, { opacity: 0.42, scale: 1, x: 0, y: 0 });
    gsap.set(spaceCanvas, { opacity: space ? 0.55 : 0 });
    gsap.set(streak, { x: 0, y: 0, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.04 });
    gsap.set(labels, { x: 0, xPercent: -50, yPercent: -50, opacity: 0, y: 10 });
    gsap.set(particles, { opacity: 0, scale: 0.6 });
    gsap.set(message, { opacity: 0, visibility: "visible", y: 0 });
    gsap.set(messageParts, { opacity: 0, y: 10 });
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
    gsap.set(messageParts, { opacity: 1, y: 0, filter: "none" });
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
      setFlow(false);
      setAmbient(false);
      if (space) space.stop();
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* --- 接続後、線の上を光が流れ続けるループ ------------------------------
     スクロールに従属させず常時流す。見えていない区間では止める。      */
  var flowTween = flowLines.length ? gsap.to(flowLines, {
    strokeDashoffset: -222,
    duration: 2.6,
    ease: "none",
    repeat: -1,
    stagger: { each: 0.18, from: "random" },
    paused: true
  }) : null;

  var flowPlaying = false;

  /* --- 粒子空間（WebGL） --------------------------------------------------
     VOID / IGNITION の「空間」だけを WebGL に任せる。
     生成できない・途中でコンテキストを失った場合は CSS 版（chero__depth）へ
     そのまま戻す。WebGL が動かなくても Hero は壊れない。            */
  var space = null;

  /* 粒子空間はデスクトップ級の環境だけで使う。
     UA は見ない。既存の演出分岐と同じ幅の条件に、粗いポインタ（＝タッチ主体の
     端末）の除外を足しただけにしてある。モバイルではこの下の create() を
     呼ばないので、WebGL コンテキストもシェーダーも描画ループも作られない。 */
  var spaceAllowed = window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(pointer: coarse)").matches;

  function dropSpace() {
    space = null;
    if (spaceCanvas) spaceCanvas.style.display = "none";
    if (depth) depth.style.display = "";
  }

  if (!reduced && spaceAllowed && spaceCanvas && window.LegacraftHeroSpace) {
    space = window.LegacraftHeroSpace.create(spaceCanvas, { onLost: dropSpace });
  }

  if (space) {
    /* WebGL が受け持つので、CSS 版の光点は二重に出さない */
    if (depth) depth.style.display = "none";
    /* ScrollTrigger の onUpdate は progress 0 では発火しない。
       最初の一画面から空間が生きているよう、ここで描き始める。 */
    space.setProgress(0);
  } else if (spaceCanvas) {
    spaceCanvas.style.display = "none";
  }

  /* --- 前半の常時微動 ------------------------------------------------------
     VOID が止め絵に見えないよう、最奥の層をごくゆっくり漂わせる。
     スクロールとは独立させ、見えている区間だけ動かす。            */
  var ambient = null;

  if (depth && !space) {
    /* 数px の漂流だけ。モバイルでは 6 点の光がわずかに揺れる。
       WebGL 版はシェーダー側で漂うので、こちらは動かさない。 */
    ambient = gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { ease: "sine.inOut" } })
      .to(depth, { x: 5, y: -3.5, duration: 11 }, 0);
  }

  var ambientPlaying = false;

  function setAmbient(on) {
    if (!ambient || on === ambientPlaying) return;
    ambientPlaying = on;
    if (on) { ambient.play(); } else { ambient.pause(); }
  }

  function setFlow(on) {
    if (!flowTween || on === flowPlaying) return;
    flowPlaying = on;
    if (on) { flowTween.play(); } else { flowTween.pause(); }
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
        onRefreshInit: layoutNet,
        onUpdate: function (self) {
          document.body.classList.toggle(
            "chero-immersive",
            self.progress > 0.002 && self.progress < 0.9
          );
          setFlow(self.progress > 0.54 && self.progress < 0.8);
          setAmbient(self.progress < 0.46);
          if (space) space.setProgress(self.progress);
        },
        onLeave: function () { document.body.classList.remove("chero-immersive"); setFlow(false); setAmbient(false); if (space) space.stop(); },
        onLeaveBack: function () { document.body.classList.remove("chero-immersive"); setFlow(false); setAmbient(false); if (space) space.stop(); }
      }
    });

    /* SCENE 01 — VOID（0 → 18）
       暗闇に浮かぶのは遠くの光点とブランドマークだけ。
       最奥の層をゆっくり拡大することで、静止画ではなく
       「巨大な空間へ入っていく」前進として見せる。         */
    /* 最奥の層は背景グラデーションを持つ。これを拡大し続けると WebKit が
       毎フレーム描き直すため、寄りはデスクトップだけで使う。
       モバイルの前進感はシードと中心光の拡大が担う。            */
    var PUSH = 1.16;
    /* WebGL が動いているときは前進もシェーダー側が持つ。
       CSS の拡大は使わず、canvas の明るさだけを動かす。 */
    var farField = space ? spaceCanvas : depth;

    tl.to(farField, { opacity: space ? 0.9 : 0.62, duration: 9, ease: "power1.out" }, 0);
    if (isDesktop && !space) tl.to(depth, { scale: PUSH, duration: 18, ease: "power1.in" }, 0);

    tl.to(seed, { opacity: 1, scale: 1, duration: 14 }, 0)
      .to(glow, { opacity: 0.07, duration: 12 }, 3)
      .to(hint, { opacity: 0, duration: 7 }, 12);

    /* SCENE 02 — IGNITION（18 → 40）
       まず一筋の光が奥から手前へ抜ける。それを合図に
       床 → 光条 → 粒子 の順で空間が起動していく。         */
    tl.fromTo(streak,
      { opacity: 0, scale: 0.04 },
      { opacity: 1, scale: 1.1, duration: 1.3, ease: "power2.in", immediateRender: false }, 18)
      .to(streak, { opacity: 0, scale: 3.6, duration: 2.2, ease: "power2.out" }, 19.3);

    /* 光が抜けた瞬間から中心が灯り、奥行きがさらに寄る */
    tl.to(glow, { opacity: 1, scale: 1, duration: 21 }, 19)
      .to(seed, { scale: 1.18, duration: 21 }, 19)
      .to(farField, { opacity: space ? 1 : 0.85, duration: 21 }, 19);

    if (isDesktop && !space) {
      tl.to(depth, { scale: PUSH * 1.14, duration: 21, ease: "power1.in" }, 19);
    }

    if (isDesktop) {
      /* 1. 床が点灯する */
      tl.to(grid, { opacity: 0.55, yPercent: 0, duration: 13, ease: "power2.out" }, 19.6);
    }

    /* 2. 光条が展開する */
    tl.to(rayH, { scaleX: 1, duration: 13, ease: "power2.out" }, 21.5)
      .to(rayV, { scaleY: 1, duration: 13, ease: "power2.out" }, 22.5);

    if (isDesktop) {
      tl.to(rayDiagonals, { scaleX: 1, duration: 12, stagger: 2.2, ease: "power2.out" }, 24.5)
        /* 3. 粒子が放たれる */
        .to(particles, {
          opacity: 0.85,
          scale: 1,
          duration: 12,
          stagger: { each: 0.3, from: "random" }
        }, 26);
    }

    /* CONNECTION 直前でひと押し。速度が乗ったまま接続へ渡す */
    if (isDesktop && !space) {
      tl.to(depth, { scale: PUSH * 1.26, duration: 5, ease: "power2.in" }, 35);
    } else if (!isDesktop) {
      tl.to(glow, { scale: 1.12, duration: 5, ease: "power2.in" }, 35);
    }

    /* SCENE 03 — CONNECTION（40 → 62）
       5つの領域が奥から現れ、CORE を回り込んでから定位置に着く。
       着いた瞬間に線が伸び、CORE から六角形の波紋が広がる。
       最後の AUTOMATION だけ波紋を大きく取り、ここを接続の頂点にする。 */
    var ARC = isDesktop ? 64 : 38;   /* 旋回角。モバイルは回り込みを浅くする */

    tl.to(network, { opacity: 1, duration: 4 }, 40)
      .to(coreHalo, { opacity: 0.5, duration: 16 }, 40);

    if (space) {
      /* ここから先の主役は CORE と network。空間は背景へ引く。 */
      tl.to(spaceCanvas, { opacity: 0.34, duration: 10, ease: "power1.out" }, 40);
    }

    NODE_KEYS.forEach(function (key, i) {
      var node = nodeOf(key);
      var label = labelOf(key);
      var spoke = netLines[i];
      var ring = pulses[i];
      var last = i === NODE_KEYS.length - 1;
      var t = 40 + i * 2.2;

      /* 奥から現れて旋回に入る */
      tl.fromTo(node, {
        opacity: 0,
        scale: 0.12,
        x: function () { return arc(key, 0.08, -ARC).x; },
        y: function () { return arc(key, 0.08, -ARC).y; }
      }, {
        opacity: 1,
        scale: 0.72,
        duration: 5,
        ease: "power1.out",
        x: function () { return arc(key, 0.66, -ARC * 0.45).x; },
        y: function () { return arc(key, 0.66, -ARC * 0.45).y; }
      }, t)
        /* 旋回を終えて定位置へ */
        .to(node, { x: 0, y: 0, scale: 1, duration: 4, ease: "power2.inOut" }, t + 5)
        /* 接続 */
        .fromTo(spoke,
          { strokeDashoffset: function () { return spoke.__chLen; } },
          { strokeDashoffset: 0, duration: 3.5, ease: "power2.out", immediateRender: false },
          t + 9)
        .to(label, { opacity: 1, y: 0, duration: 3.5 }, t + 9.5)
        /* CORE からの波紋 */
        /* immediateRender:false がないと、再生位置が来る前から
           from 値（光ったリング）が中央に描かれ続けてしまう */
        .fromTo(ring,
          { opacity: last ? 1 : 0.8, scale: 0.12 },
          { opacity: 0, scale: last ? 4.6 : 2.8, duration: last ? 9 : 6, ease: "power2.out", immediateRender: false },
          t + 9);

      if (last) {
        tl.to(coreHalo, { opacity: 0.95, duration: 3, ease: "power2.out" }, t + 9)
          .to(coreHalo, { opacity: 0.45, duration: 6 }, t + 12);
      }
    });

    /* 隣り合うノードが揃った時点で外周を閉じていく */
    [1, 2, 3, 4, 4].forEach(function (readyIndex, r) {
      var rim = netLines[5 + r];
      tl.fromTo(rim,
        { strokeDashoffset: function () { return rim.__chLen; } },
        { strokeDashoffset: 0, duration: 4, ease: "power1.out", immediateRender: false },
        40 + readyIndex * 2.2 + 9);
    });

    /* 接続が済んだ線の上を情報が流れ始める */
    tl.to(flowLines, { opacity: 0.85, duration: 3, stagger: 0.25 }, 58);

    /* SCENE 04 — FORMATION（62 → 78）Hero のクライマックス
       接続し終えた網が回り始め、カメラが引きながら光を強め、
       全部が中央へ吸い込まれる。一度だけ強く閃光を出し、
       そのあと短い静寂を置いてから MESSAGE へ渡す。            */
    /* 回転・縮小は SVG の再ラスタライズを伴い、WebKit で顕著に重い。
       デスクトップだけで使い、モバイルは光でクライマックスを作る。 */
    var SPIN = 54;      /* 収束するまでに回る角度 */
    var SHRINK = 0.05;  /* 吸い込まれ切ったときの大きさ */
    var flowSpeed = { v: 1 };

    /* 光は両モード共通で強めていく */
    tl.to(coreHalo, { opacity: 0.78, duration: 3 }, 62)
      /* 流れる光が加速する */
      .to(flowSpeed, {
        v: 3.6,
        duration: 11,
        ease: "power2.in",
        onUpdate: function () { if (flowTween) flowTween.timeScale(flowSpeed.v); }
      }, 62)
      .to(coreHalo, { opacity: 1, duration: 6 }, 65)
      .to(glow, { scale: 1.7, duration: 6 }, 65)
      .to(coreHalo, { opacity: 0, duration: 4.6, ease: "power3.in" }, 71)
      .to(seed, { scale: 3.4, opacity: 0, duration: 4, ease: "power2.in" }, 71.5);

    if (isDesktop) {
      /* 回転しながらカメラが引き、中央へ一気に収束する */
      tl.to(network, { rotation: SPIN * 0.12, scale: 1.05, duration: 3, ease: "power1.in" }, 62)
        .to(network, { rotation: SPIN * 0.42, scale: 0.55, opacity: 0.82, duration: 6, ease: "power1.in" }, 65)
        .to(network, { rotation: SPIN, scale: SHRINK, autoAlpha: 0, duration: 4.6, ease: "power3.in" }, 71)
        .to(flowLines, { autoAlpha: 0, duration: 3, ease: "power2.in" }, 72);
    } else {
      /* モバイル: 回転はしない（SVG の再ラスタライズが WebKit で重い）。
         収束距離も浅くして、クライマックスは CORE の光と閃光で作る。 */
      tl.to(network, { scale: 0.94, duration: 3, ease: "power1.in" }, 62)
        .to(network, { scale: 0.62, opacity: 0.8, duration: 6, ease: "power1.in" }, 65)
        .to(network, { scale: 0.3, autoAlpha: 0, duration: 4.6, ease: "power3.in" }, 71)
        .to(flowLines, { autoAlpha: 0, duration: 3, ease: "power2.in" }, 72);
    }

    if (isDesktop) {
      /* 床が遠ざかることで引きの奥行きを出す */
      tl.to(grid, { opacity: 0.06, scale: 0.82, yPercent: 8, duration: 12, ease: "power1.in" }, 64)
        .to(particles, { opacity: 0, duration: 9 }, 65);
    } else {
      /* モバイル: 収束に入る前に波紋を描画対象から外す。
         set はスクロールを戻せば元に戻るので、CONNECTION へ巻き戻しても復帰する。 */
      tl.set(pulses, { display: "none" }, 68);
    }

    tl.to(farField, { opacity: 0, duration: 10 }, 64);

    tl.to([rayH, rayV], { opacity: 0, duration: 9 }, 66);

    if (isDesktop) {
      tl.to(rayDiagonals, { opacity: 0, duration: 8 }, 66);
    }

    /* 一度だけ強く光る */
    tl.fromTo(flash,
      { opacity: 0 },
      { opacity: isDesktop ? 1 : 0.86, duration: 1.4, ease: "power2.in", immediateRender: false },
      74.6)
      .to(glow, { scale: 2.2, opacity: 1, duration: 1.4, ease: "power2.in" }, 74.6)
      /* 光が引くと同時に、残っていた明かりも落とす */
      .to(flash, { opacity: 0, duration: 1.6, ease: "power2.out" }, 76)
      .to(glow, { scale: 1.1, opacity: 0.1, duration: 1.6, ease: "power2.out" }, 76);

    /* 77.6 → 78 は意図的に何も動かさない。閃光のあとの静寂がここに入る。 */

    /* SCENE 05 — MESSAGE（78 → 93）
       最大運動 → 閃光 → 静寂 と来たあとなので、ここでは動かさない。
       中心の光が引いていくのに合わせて、文字が順に立ち上がるだけにする。 */
    tl.set(message, { opacity: 1, visibility: "visible" }, 78)
      .to(network, { opacity: 0, duration: 10 }, 78)
      /* 光が収束して文字になる。scale は広げず、絞る向きに動かす */
      .to(glow, { scale: 0.86, opacity: 0.34, duration: 15, ease: "power1.out" }, 78)
      .to(msgBrand, { opacity: 1, y: 0, duration: 5, ease: "power2.out" }, 78)
      .to(msgHead, { opacity: 1, y: 0, duration: 9, ease: "power2.out" }, 79.5)
      .to(msgSub, { opacity: 1, y: 0, duration: 7, ease: "power2.out" }, 84.5)
      .to(msgActions, { opacity: 1, y: 0, duration: 6, ease: "power2.out" }, 86.5);

    if (isDesktop) {
      /* 光の中から輪郭が解像していく。文字は動かさず、ぼけが取れるだけ。
         モバイルでは blur を使わない（テキストの再ラスタライズが重い）。 */
      tl.fromTo(msgHead,
        { filter: "blur(12px)" },
        { filter: "blur(0px)", duration: 9, ease: "power2.out", immediateRender: false }, 79.5);
    }

    /* SCENE 06 — TRANSITION（86 → 100）
       映画が終わって別物になるのではなく、映画の中がそのまま
       LEGACRAFT のサイトだった、という着地にする。
       背景は WORKS と同じ Deep Green へ寄り、残光だけが静かに消える。 */
    tl.to(fade, { opacity: 1, duration: 10 }, 86)
      .to(glow, { opacity: 0.09, scale: 0.66, duration: 11, ease: "power1.in" }, 88)
      /* コピーはごくわずかに奥へ引く。移動量は約1.5%に留める */
      .to(message, { scale: 0.985, duration: 8, ease: "power1.in" }, 92);

    /* タイムライン長を 100 に固定する。
       これがないと総尺が最後のtweenの終了時刻になり、スクロール量との対応がずれる。 */
    tl.set({}, {}, 100);

    return function cleanup() {
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* --- スタイルシートが本当に届いているかを確かめる ----------------------
     届いていなければ stage は sticky にならない。その状態で演出モードを
     続けると、コピーの出ない暗い領域だけが残る。
     ただしこのスクリプトは stylesheet の適用より先に走ることがあるため、
     即断せず数フレーム待ってから判定する。                            */
  (function verifyStylesheet(tries) {
    if (getComputedStyle(stageEl).position === "sticky") return;
    if (tries <= 0) {
      mm.revert();
      fallbackToStatic();
      return;
    }
    requestAnimationFrame(function () { verifyStylesheet(tries - 1); });
  })(30);

  /* --- フォント確定後にトリガー位置を取り直す --------------------------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
