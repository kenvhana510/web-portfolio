/* ==========================================================================
   LEGACRAFT — HERO SPATIAL FIELD (v2.1 SPIKE)

   Hero の VOID / IGNITION で、奥行きを持った粒子空間を1枚の canvas に描く。
   担当するのは背景の空間だけ。六角形・ノード・CONNECTION・CORE・FORMATION・
   MESSAGE・CTA は従来どおり DOM/SVG + GSAP のまま。

   Three.js は使っていない。ここで必要なのは gl.POINTS による点群描画だけで、
   ライブラリを足すと iOS の負荷と初期ロードにそのまま乗るため。

   生成に失敗した場合・WebGL が無い場合・コンテキストを失った場合は
   create() が null を返す / onLost が呼ばれるので、呼び出し側は
   v2.0-D の CSS 実装へそのまま戻せる。
   ========================================================================== */

(function (global) {
  "use strict";

  var VERT = [
    "attribute vec3 aPos;",
    "attribute float aSeed;",
    "attribute vec2 aLayer;",   /* x: 粒の大きさ倍率, y: 前進の速さ */
    "uniform float uTime;",
    "uniform float uPush;",
    "uniform float uAspect;",
    "uniform float uSize;",
    "uniform float uSizeMax;",
    "uniform float uSpread;",
    "varying float vAlpha;",
    "varying float vTint;",
    "void main() {",
    /* 層ごとに前進速度が違う。これが視差になり、奥行きが「見える」 */
    "  float z = fract(aPos.z + uPush * aLayer.y);",
    "  float depth = mix(0.06, 1.0, z);",
    "  vec2 drift = vec2(sin(uTime * 0.06 + aSeed * 31.4), cos(uTime * 0.045 + aSeed * 21.7)) * 0.02;",
    "  vec2 p = (aPos.xy * uSpread + drift) / depth;",
    "  p.x /= uAspect;",
    "  gl_Position = vec4(p, 0.0, 1.0);",
    "  gl_PointSize = min(uSize * aLayer.x / depth, uSizeMax);",
    /* 奥で現れ、手前を抜けるところで消える */
    "  vAlpha = smoothstep(0.0, 0.16, z) * (1.0 - smoothstep(0.82, 1.0, z))",
    "         * mix(0.62, 1.0, clamp((aLayer.x - 0.62) / 1.3, 0.0, 1.0));",
    "  vTint = aSeed;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "varying float vAlpha;",
    "varying float vTint;",
    "uniform vec3 uGold;",
    "uniform vec3 uIvory;",
    "void main() {",
    "  vec2 c = gl_PointCoord - 0.5;",
    "  float d = dot(c, c);",
    "  if (d > 0.25) discard;",
    "  float a = 1.0 - d * 4.0;",
    "  vec3 col = mix(uGold, uIvory, step(0.55, vTint));",
    "  gl_FragColor = vec4(col, a * a * vAlpha);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  /* 決定的な擬似乱数。読み込みごとに星の位置が変わらないようにする。 */
  function rand(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function create(canvas, opts) {
    if (!canvas || !global.WebGLRenderingContext) return null;

    opts = opts || {};
    /* デスクトップ専用。モバイルでは呼び出し側が create() 自体を呼ばない */
    var count = opts.particles || 700;
    var dprCap = opts.dprCap || 1.5;

    var gl = null;
    try {
      var attrs = {
        alpha: true,
        antialias: false,      /* 点群だけなので MSAA は不要。モバイルでは特に高い */
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false
      };
      gl = canvas.getContext("webgl", attrs) || canvas.getContext("experimental-webgl", attrs);
    } catch (e) {
      gl = null;
    }
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    /* --- 粒子を3層に分ける ------------------------------------------------
       遠景は小さく暗くゆっくり、前景は大きく明るく速い。
       同じ前進量でも層ごとに動く距離が違うので、カメラが進むと
       視差が出て「星空」ではなく「奥行きのある空間」に見える。      */
    var pos = new Float32Array(count * 3);
    var seeds = new Float32Array(count);
    var layers = new Float32Array(count * 2);

    for (var i = 0; i < count; i++) {
      var bucket = i % 10;
      var sizeScale, speed;
      if (bucket < 6) {         /* 遠景 60% */
        sizeScale = 0.62; speed = 0.42;
      } else if (bucket < 9) {  /* 中景 30% */
        sizeScale = 1.0;  speed = 1.0;
      } else {                  /* 前景 10% */
        sizeScale = 1.92; speed = 2.15;
      }

      var a = rand(i + 1) * Math.PI * 2;
      /* 中心付近に寄りすぎないよう、半径は sqrt 分布にする */
      var r = Math.sqrt(rand(i + 97)) * 1.15 + 0.06;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.78;
      pos[i * 3 + 2] = rand(i + 613);
      seeds[i] = rand(i + 1201);
      layers[i * 2] = sizeScale;
      layers[i * 2 + 1] = speed;
    }

    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    var seedBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    var aSeed = gl.getAttribLocation(prog, "aSeed");
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 0, 0);

    var layerBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, layerBuf);
    gl.bufferData(gl.ARRAY_BUFFER, layers, gl.STATIC_DRAW);
    var aLayer = gl.getAttribLocation(prog, "aLayer");
    gl.enableVertexAttribArray(aLayer);
    gl.vertexAttribPointer(aLayer, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(prog, "uTime");
    var uPush = gl.getUniformLocation(prog, "uPush");
    var uAspect = gl.getUniformLocation(prog, "uAspect");
    var uSize = gl.getUniformLocation(prog, "uSize");
    var uSizeMax = gl.getUniformLocation(prog, "uSizeMax");
    var uSpread = gl.getUniformLocation(prog, "uSpread");

    gl.uniform3f(gl.getUniformLocation(prog, "uGold"), 0.847, 0.706, 0.388);
    gl.uniform3f(gl.getUniformLocation(prog, "uIvory"), 0.929, 0.894, 0.808);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);   /* 加算合成。重なるほど光る */
    gl.clearColor(0, 0, 0, 0);

    var dpr = 1;
    var cssW = 0;
    var cssH = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(global.devicePixelRatio || 1, dprCap);
      if (w === cssW && h === cssH) return;
      cssW = w;
      cssH = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uAspect, w / h);
      gl.uniform1f(uSize, 2.25 * dpr);
      gl.uniform1f(uSizeMax, 30 * dpr);
      gl.uniform1f(uSpread, 1);
    }

    resize();

    /* --- スクロール量を前進量へ ---------------------------------------
       VOID はほとんど進まず、IGNITION で一気に手前へ抜け、
       CONNECTION の手前で減速して既存の network へ主役を渡す。   */
    function pushFor(p, elapsed) {
      var ambient = elapsed * 0.009;   /* 止まっていても空間は生きている */
      var scroll;
      if (p <= 0.18) {
        scroll = p * 0.30;
      } else if (p <= 0.40) {
        scroll = 0.054 + (p - 0.18) * 2.55;
      } else {
        scroll = 0.615 + (p - 0.40) * 0.45;
      }
      return ambient + scroll;
    }

    var progress = 0;
    var running = false;
    var rafId = 0;
    var startedAt = 0;
    var lost = false;
    var onLost = opts.onLost || function () {};

    function frame(now) {
      if (!running || lost) return;
      if (!startedAt) startedAt = now;
      var elapsed = (now - startedAt) / 1000;

      resize();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uPush, pushFor(progress, elapsed));
      gl.drawArrays(gl.POINTS, 0, count);

      rafId = global.requestAnimationFrame(frame);
    }

    function start() {
      if (running || lost) return;
      running = true;
      rafId = global.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) global.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function handleLost(e) {
      e.preventDefault();
      lost = true;
      stop();
      onLost();
    }

    canvas.addEventListener("webglcontextlost", handleLost, false);

    return {
      setProgress: function (p) {
        progress = p;
        /* 空間が主役なのは CONNECTION の手前まで。以降は描かない。 */
        if (p < 0.5) { start(); } else { stop(); }
      },
      start: start,
      stop: stop,
      destroy: function () {
        stop();
        canvas.removeEventListener("webglcontextlost", handleLost, false);
      },
      info: {
        particles: count,
        layers: { background: "60% x0.62 speed0.42", midground: "30% x1.0 speed1.0", foreground: "10% x1.92 speed2.15" },
        dprCap: dprCap,
        dpr: dpr,
        antialias: false,
        get drawingBuffer() { return canvas.width + "x" + canvas.height; },
        get cssSize() { return cssW + "x" + cssH; }
      }
    };
  }

  global.LegacraftHeroSpace = { create: create };
})(window);
