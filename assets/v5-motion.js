/* LEGACRAFT V5 MOTION — 演出用スクリプト（v5-motion.css と対で使う）
   index.html の既存スクリプト（.rv に .in を付ける IntersectionObserver）はそのまま使う。 */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var COLORS = ["#FFD23F", "#FF4D4D", "#2D7DFF", "#22C55E"];

  /* 1. スクロール進捗バーとヘッダーの影（動きを減らす設定でも出す） */
  var bar = document.createElement("div");
  bar.className = "scroll-bar";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var hd = document.querySelector(".hd");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.scale = p + " 1";
      if (hd) hd.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (reduce) return;

  /* 2. カード群を1枚ずつ出す：子要素に順番（--i）を振る */
  var groups = [".woes", ".points", ".merits", ".rank", ".reasons", ".works", ".chips", ".steps", ".specs", ".timeline", ".faq"];
  groups.forEach(function (sel) {
    var g = document.querySelector(sel + ".rv");
    if (!g) return;
    g.classList.add("stg");
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--i", i); });
  });

  /* 3. 背景に浮かぶおもちゃブロック */
  function sprinkle(host, spots) {
    if (!host) return;
    spots.forEach(function (s, i) {
      var b = document.createElement("span");
      b.className = "deco-b";
      b.setAttribute("aria-hidden", "true");
      b.style.left = s[0] + "%";
      b.style.top = s[1] + "%";
      b.style.setProperty("--s", Math.round(s[2] * 1.35) + "px");
      b.style.setProperty("--c", COLORS[i % COLORS.length]);
      b.style.setProperty("--r0", (i % 2 ? 1 : -1) * (8 + (i * 7) % 18) + "deg");
      b.style.setProperty("--t", (5 + (i % 4)) + "s");
      b.style.setProperty("--dl", (-i * 0.9) + "s");
      b.style.setProperty("--d", 10 + (i % 3) * 10);
      host.insertBefore(b, host.firstChild);
    });
  }
  sprinkle(document.querySelector(".hero"), [
    [2, 6, 34], [44, 3, 26], [93, 8, 40], [96, 72, 30], [3, 88, 30], [50, 94, 24], [72, 2, 22], [60, 70, 20]
  ]);
  sprinkle(document.querySelector(".final"), [
    [4, 10, 40], [90, 12, 34], [8, 78, 28], [93, 70, 42], [22, 40, 20], [78, 44, 22]
  ]);

  /* 4. ファーストビューの奥行き：マウスに合わせて少し動く（マウス操作の端末だけ） */
  var hero = document.querySelector(".hero");
  if (hero && finePointer) {
    var raf = 0;
    hero.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--px", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        hero.style.setProperty("--py", ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
        raf = 0;
      });
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--px", 0);
      hero.style.setProperty("--py", 0);
    });
  }

  /* 5. 数字のカウントアップ（2,980 など） */
  function firstNumberNode(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && /\d/.test(n.nodeValue)) return n;
    }
    return null;
  }
  var counters = [];
  [".hero-h .num", ".hero-price .v.blue", ".plan-price .v.blue", ".fact .fv.g"].forEach(function (sel) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      var node = firstNumberNode(el);
      if (!node) return;
      var m = node.nodeValue.match(/^(\s*)([\d,]+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[2].replace(/,/g, ""), 10);
      if (!(target > 9)) return;
      counters.push({ el: el, node: node, pre: m[1], post: m[3], target: target, comma: m[2].indexOf(",") >= 0 });
    });
  });
  function run(c) {
    var start = null, dur = 1300;
    function fmt(v) { return c.comma ? v.toLocaleString("ja-JP") : String(v); }
    function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      c.node.nodeValue = c.pre + fmt(Math.round(c.target * e)) + c.post;
      if (k < 1) requestAnimationFrame(step);
    }
    c.node.nodeValue = c.pre + fmt(0) + c.post;
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        counters.forEach(function (c) { if (c.el === e.target && !c.done) { c.done = true; setTimeout(function () { run(c); }, 350); } });
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io.observe(c.el); });
  }

  /* 6. LINEボタンを押すと、ブロックがはじける */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".btn.line");
    if (!a) return;
    for (var i = 0; i < 12; i++) {
      var p = document.createElement("span");
      p.className = "burst";
      p.style.background = COLORS[i % COLORS.length];
      p.style.left = e.clientX - 6 + "px";
      p.style.top = e.clientY - 6 + "px";
      document.body.appendChild(p);
      var ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      var dist = 50 + Math.random() * 50;
      var anim = p.animate([
        { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
        { transform: "translate(" + Math.cos(ang) * dist + "px," + (Math.sin(ang) * dist + 30) + "px) rotate(" + (180 + Math.random() * 180) + "deg) scale(.6)", opacity: 0 }
      ], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  });
})();

/* ══ 第2弾：ワクワク演出 ══ */
(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var COLORS = ["#FFD23F", "#FF4D4D", "#2D7DFF", "#22C55E"];

  /* 1. 「制作費0円」を1文字ずつに分ける（読み上げ用に元の文を残す） */
  var big = document.querySelector(".hero-h .big");
  if (big && !big.querySelector(".ch")) {
    var text = big.textContent;
    big.setAttribute("aria-label", text);
    big.textContent = "";
    Array.prototype.forEach.call(text, function (c, i) {
      var s = document.createElement("span");
      s.className = "ch";
      s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--ci", i);
      s.textContent = c;
      big.appendChild(s);
    });
  }

  /* 2. お悩みの「?」が順番に首をかしげるよう、ずらし用の番号を振る */
  Array.prototype.forEach.call(document.querySelectorAll(".woe"), function (w, i) { w.style.setProperty("--i", i); });

  /* 3. カードの立体傾き（マウス操作の端末だけ） */
  if (finePointer) {
    Array.prototype.forEach.call(document.querySelectorAll(".work, .pt"), function (card) {
      card.classList.add("tilt");
      var base = card.classList.contains("work") ? " translate(-3px,-3px)" : "";
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(800px) rotateX(" + (-y * 9).toFixed(2) + "deg) rotateY(" + (x * 11).toFixed(2) + "deg)" + base;
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* 4. ファーストビューでマウスを動かすと、カラフルな星がこぼれる */
  var hero = document.querySelector(".hero");
  if (hero && finePointer) {
    var last = 0, n = 0;
    hero.addEventListener("pointermove", function (e) {
      var now = performance.now();
      if (now - last < 45) return;
      last = now;
      var s = document.createElement("span");
      s.className = "spark";
      s.style.background = COLORS[n++ % COLORS.length];
      s.style.left = e.clientX - 8 + "px";
      s.style.top = e.clientY - 8 + "px";
      document.body.appendChild(s);
      var a = s.animate([
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (Math.random() * 30 - 15) + "px," + (24 + Math.random() * 24) + "px) scale(.2) rotate(140deg)", opacity: 0 }
      ], { duration: 750, easing: "ease-out" });
      a.onfinish = function () { s.remove(); };
    });
  }

  /* 5. 最後の「友だち追加」セクションに来たら、1回だけ紙吹雪 */
  var fin = document.querySelector("#final");
  if (fin && "IntersectionObserver" in window) {
    var fired = false;
    var io = new IntersectionObserver(function (es) {
      if (fired || !es[0].isIntersecting) return;
      fired = true;
      io.disconnect();
      var W = window.innerWidth, H = window.innerHeight, count = W < 600 ? 45 : 90;
      for (var i = 0; i < count; i++) {
        (function (i) {
          var c = document.createElement("span");
          c.className = "confetti";
          c.style.background = COLORS[i % COLORS.length];
          c.style.left = Math.random() * W + "px";
          document.body.appendChild(c);
          var drift = Math.random() * 160 - 80, spin = 360 + Math.random() * 720;
          var a = c.animate([
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            { transform: "translate(" + drift + "px," + (H * 0.6) + "px) rotate(" + spin / 2 + "deg)", opacity: 1, offset: 0.7 },
            { transform: "translate(" + drift * 1.3 + "px," + (H + 40) + "px) rotate(" + spin + "deg)", opacity: 0 }
          ], { duration: 2200 + Math.random() * 1600, delay: Math.random() * 500, easing: "cubic-bezier(.25,.6,.4,1)" });
          a.onfinish = function () { c.remove(); };
        })(i);
      }
    }, { threshold: 0.45 });
    io.observe(fin);
  }
})();

/* ── v6 partial: #works phone carousel progress (works with reduced motion too) ──
   .works-prog gets .is-live only here, so the bar never shows without JS. */
(function () {
  "use strict";
  var works = document.querySelector("#works .works");
  var prog = document.querySelector("#works .works-prog");
  var wbar = prog && prog.querySelector("i");
  if (!works) return;
  if (wbar) {
    var queued = false;
    var update = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var p = Math.min(1, (works.scrollLeft + works.clientWidth) / Math.max(1, works.scrollWidth));
        wbar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      });
    };
    prog.classList.add("is-live");
    works.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }
  /* keyboard focus inside the carousel: bring a partly visible card fully into view (snap positions unchanged).
     Keyboard only (:focus-visible): scrolling on a mouse/touch press would move the card away before mouseup. */
  works.addEventListener("focusin", function (e) {
    var t = e.target, c = t && t.closest ? t.closest(".work") : null, kb = false;
    try { kb = !!(c && t.matches(":focus-visible")); } catch (x) { kb = false; }
    if (kb && c.scrollIntoView) c.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
})();

/* ── #problem .solve-ill: play the "rain clears" video once each time it scrolls into view.
   Reduced motion: never plays (poster = the final high-five illustration). ── */
(function () {
  "use strict";
  var v = document.querySelector("#problem .solve-vid");
  if (!v) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var play = function () { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
  if (!("IntersectionObserver" in window)) { play(); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) play();
      else if (!e.isIntersecting) v.pause();
    });
  }, { threshold: [0, 0.5] });
  io.observe(v);
})();
