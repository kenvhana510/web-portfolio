#!/usr/bin/env node
/**
 * LEGACRAFT コラム ビルダー（依存なし・Node 20+）
 *
 *   node scripts/build-column.mjs            … 今日（JST）以前の記事だけを公開ビルド
 *   BUILD_DATE=2026-10-31 node scripts/build-column.mjs … 指定日時点のビルド（確認用）
 *   node scripts/build-column.mjs --check    … 全記事の front matter / 文字数 / リンクを検査するだけ
 *
 * 入力 : column/_src/YYYY-MM-DD-slug.md（front matter + Markdown）
 * 出力 : column/<slug>/index.html, column/index.html, column/feed.xml, sitemap.xml（column 部分のみ更新）
 * 予約 : date が BUILD_DATE より未来の記事は一切出力しない（HTMLも一覧もサイトマップも）。
 *        .github/workflows/publish-column.yml が毎朝 07:00 JST にこのスクリプトを回して commit する。
 * 画像 : images/column/<image> があればそれを、無ければ images/column/default.svg を使う。
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "column", "_src");
const OUT = path.join(ROOT, "column");
const IMG_DIR = path.join(ROOT, "images", "column");
const SITE = "https://legacraft.jp";
const LINE_URL = "https://lin.ee/XQBjU3A";
const CHECK = process.argv.includes("--check");
const TODAY = process.env.BUILD_DATE || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

const CATEGORIES = ["はじめての方へ", "料金・費用", "作り方・運用", "業種別", "集客・SEO", "制度・税務"];
const CAT_COLOR = { "はじめての方へ": "y", "料金・費用": "r", "作り方・運用": "b", "業種別": "g", "集客・SEO": "b", "制度・税務": "" };

// ───────────────────────── front matter / markdown ─────────────────────────
function parseFrontMatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: front matter がありません`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (mm) meta[mm[1]] = mm[2].trim().replace(/^["']|["']$/g, "");
  }
  for (const k of ["title", "slug", "date", "description", "keywords", "category", "image", "imageAlt", "imagePrompt", "readingTime"]) {
    if (!meta[k]) throw new Error(`${file}: front matter に ${k} がありません`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${file}: date の形式が不正です（${meta.date}）`);
  if (!CATEGORIES.includes(meta.category)) throw new Error(`${file}: category が不正です（${meta.category}）`);
  meta.keywords = meta.keywords.split(/[,、]/).map((s) => s.trim()).filter(Boolean);
  meta.readingTime = parseInt(meta.readingTime, 10) || 5;
  return { meta, body: m[2] };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text, ctx) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label, href) => {
    const mm = href.match(/^\/column\/([a-z0-9-]+)\/?$/);
    if (mm) {
      if (!ctx.published.has(mm[1])) { ctx.droppedLinks.push(mm[1]); return label; } // 未公開記事へのリンクは文字だけにする
      return `<a href="/column/${mm[1]}/">${label}</a>`;
    }
    if (/^https?:\/\//.test(href) && !href.startsWith(SITE)) ctx.externalLinks.push(href);
    return `<a href="${href}">${label}</a>`;
  });
  return s;
}

const slugify = (t, used) => {
  let base = t.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "sec";
  let id = base, i = 2;
  while (used.has(id)) id = `${base}-${i++}`;
  used.add(id);
  return id;
};

function markdownToHtml(md, ctx) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [], toc = [], used = new Set();
  let i = 0, ctaCount = 0;
  const flushPara = (buf) => { if (buf.length) { out.push(`<p>${inline(buf.join(" "), ctx)}</p>`); buf.length = 0; } };
  const para = [];
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flushPara(para); i++; continue; }
    if (/^\{\{\s*cta\s*\}\}$/.test(line.trim())) {
      flushPara(para); ctaCount++;
      out.push(ctaBox(ctaCount === 1 ? "mid" : "end"));
      i++; continue;
    }
    let h;
    if ((h = line.match(/^(#{2,4})\s+(.+)$/))) {
      flushPara(para);
      const level = h[1].length, text = h[2].trim(), id = slugify(text, used);
      if (level === 2) toc.push({ id, text });
      out.push(`<h${level} id="${id}">${inline(text, ctx)}</h${level}>`);
      i++; continue;
    }
    if (/^\s*>/.test(line)) {
      flushPara(para);
      const q = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      out.push(`<blockquote>${markdownToHtml(q.join("\n"), { ...ctx, nested: true }).html}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara(para);
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
      out.push(`<ul>${items.map((t) => `<li>${inline(t, ctx)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flushPara(para);
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "")); i++; }
      out.push(`<ol>${items.map((t) => `<li>${inline(t, ctx)}</li>`).join("")}</ol>`);
      continue;
    }
    if (/^\s*\|/.test(line)) {
      flushPara(para);
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(1).filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map(cells);
      out.push(`<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${inline(c, ctx)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c, ctx)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flushPara(para);
  return { html: out.join("\n"), toc, ctaCount };
}

// ───────────────────────── 部品 ─────────────────────────
const LINE_ICON = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.5 2 2 5.7 2 10.2c0 4 3.6 7.4 8.4 8.1.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6s6-3.6 8.2-6.1c1.5-1.6 2.2-3.3 2.2-5C22.5 5.7 18 2 12 2z"/></svg>`;

function ctaBox(kind) {
  const h = kind === "mid" ? "ホームページのこと、LINEで気軽に聞いてください" : "読んで「うちも必要かも」と思ったら";
  const p = kind === "mid"
    ? "LEGACRAFTは制作費0円・月額2,980円（税込）のサブスク型。更新は回数無制限、24ヶ月後はサイトを譲渡します。質問だけでも大歓迎です。"
    : "まずは友だち追加して「ホームページの相談」とひとこと送ってください。しつこい営業はしません。";
  return `<aside class="cta-box"><p class="cta-k">LINEで無料相談</p><h3>${h}</h3><p>${p}</p><a class="btn line" href="${LINE_URL}" target="_blank" rel="noopener" data-cta="column-${kind}">${LINE_ICON}LINEで無料相談する</a><p class="cta-sub"><a href="/#price">料金の詳細を見る</a>　<a href="/#works">制作例を見る</a></p></aside>`;
}

const header = () => `<header class="hd">
  <div class="wrap hd-in">
    <a class="brand" href="/" aria-label="LEGACRAFT トップへ"><img src="/images/brand/logo-pop.svg" alt="LEGACRAFT" width="560" height="120"></a>
    <nav class="nav" aria-label="メイン">
      <a href="/#points">特徴</a><a href="/#price">料金</a><a href="/#works">制作例</a><a href="/column/">コラム</a><a href="/#faq">よくある質問</a>
    </nav>
    <a class="btn line" href="${LINE_URL}" target="_blank" rel="noopener">${LINE_ICON}LINEで相談</a>
  </div>
</header>`;

const footer = () => `<footer class="ft">
  <div class="wrap ft-in">
    <div>
      <img src="/images/brand/logo-pop.svg" alt="LEGACRAFT" width="560" height="120">
      <p class="ft-tag">制作費0円・月額2,980円の<wbr>サブスク型<wbr>ホームページ制作</p>
      <dl><dt>屋号</dt><dd>LEGACRAFT（レガクラフト）</dd><dt>拠点</dt><dd>愛知県（全国オンライン対応）</dd><dt>メール</dt><dd><a href="mailto:info@legacraft.jp">info@legacraft.jp</a></dd></dl>
    </div>
    <div><h4>MENU</h4><ul><li><a href="/#points">特徴</a></li><li><a href="/#price">料金</a></li><li><a href="/#works">制作例</a></li><li><a href="/#flow">ご利用の流れ</a></li><li><a href="/#faq">よくあるご質問</a></li><li><a href="/column/">コラム</a></li><li><a href="/privacy.html">プライバシーポリシー</a></li><li><a href="/terms/">利用規約</a></li><li><a href="/tokushoho/">特定商取引法に基づく表記</a></li></ul></div>
    <p class="ft-note">掲載している制作例・デモはすべて架空の企業を想定した自主制作です。実在する企業・団体とは関係ありません。<br>© LEGACRAFT</p>
  </div>
</footer>
<div class="float-line"><a class="btn line" href="${LINE_URL}" target="_blank" rel="noopener">${LINE_ICON}LINEで無料相談</a></div>
<div class="sp-bar"><a class="btn line" href="${LINE_URL}" target="_blank" rel="noopener">${LINE_ICON}LINEで無料相談（制作費0円）</a></div>`;

const head = ({ title, description, url, image, extra = "" }) => `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#FFD23F">
<link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<meta property="og:type" content="article"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="LEGACRAFT">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="LEGACRAFT コラム" href="${SITE}/column/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&family=Zen+Maru+Gothic:wght@700;900&display=swap">
<script src="/js/site-config.js"></script>
<link rel="stylesheet" href="/assets/v5-pop.css">
<link rel="stylesheet" href="/assets/column.css">
${extra}
</head>
<body class="col-page">`;

const fmtDate = (d) => { const [y, m, dd] = d.split("-"); return `${y}年${+m}月${+dd}日`; };
const imgSrc = (p) => existsSync(path.join(IMG_DIR, p.meta.image)) ? `/images/column/${p.meta.image}` : "/images/column/default.svg";

function card(p) {
  return `<a class="pcard" href="/column/${p.meta.slug}/" data-cat="${esc(p.meta.category)}">
  <figure><img src="${imgSrc(p)}" alt="" width="1600" height="900" loading="lazy" decoding="async"></figure>
  <div class="pcard-b"><span class="chip ${CAT_COLOR[p.meta.category] || ""}">${esc(p.meta.category)}</span><h3>${esc(p.meta.title)}</h3><p>${esc(p.meta.description)}</p><p class="pmeta"><time datetime="${p.meta.date}">${fmtDate(p.meta.date)}</time>・約${p.meta.readingTime}分</p></div></a>`;
}

// ───────────────────────── 記事ページ ─────────────────────────
function renderPost(p, all, idx) {
  const url = `${SITE}/column/${p.meta.slug}/`;
  const image = `${SITE}${imgSrc(p)}`;
  const related = all.filter((o) => o !== p && o.meta.category === p.meta.category).slice(0, 3);
  const more = related.length < 3 ? all.filter((o) => o !== p && !related.includes(o)).slice(0, 3 - related.length) : [];
  const rel = [...related, ...more];
  const newer = all[idx - 1], older = all[idx + 1];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: p.meta.title, description: p.meta.description, image: [image], datePublished: p.meta.date, dateModified: p.meta.date, mainEntityOfPage: url,
        author: { "@type": "Organization", name: "LEGACRAFT", url: SITE }, publisher: { "@type": "Organization", name: "LEGACRAFT", logo: { "@type": "ImageObject", url: `${SITE}/images/brand/logo-pop.svg` } }, keywords: p.meta.keywords.join(", "), inLanguage: "ja" },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "コラム", item: `${SITE}/column/` },
        { "@type": "ListItem", position: 3, name: p.meta.title, item: url } ] }
    ]
  };
  const toc = p.toc.length ? `<nav class="toc" aria-label="目次"><p class="toc-h">この記事の内容</p><ol>${p.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join("")}</ol></nav>` : "";
  return `${head({ title: `${p.meta.title} | LEGACRAFT コラム`, description: p.meta.description, url, image, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` })}
${header()}
<main class="col-main">
  <div class="wrap narrow">
    <nav class="crumb" aria-label="パンくず"><a href="/">ホーム</a><span>›</span><a href="/column/">コラム</a><span>›</span><span>${esc(p.meta.category)}</span></nav>
    <article class="post">
      <header class="post-head">
        <span class="chip ${CAT_COLOR[p.meta.category] || ""}">${esc(p.meta.category)}</span>
        <h1>${esc(p.meta.title)}</h1>
        <p class="pmeta"><time datetime="${p.meta.date}">${fmtDate(p.meta.date)}</time>・読了目安 約${p.meta.readingTime}分</p>
        <figure class="hero-img"><img src="${imgSrc(p)}" alt="${esc(p.meta.imageAlt)}" width="1600" height="900" fetchpriority="high" decoding="async"></figure>
      </header>
      ${toc}
      <div class="post-body">
${p.html}
      </div>
      <aside class="author"><img src="/images/brand/mark-pop.svg" alt="" width="64" height="64"><div><p class="a-name">LEGACRAFT（レガクラフト）</p><p>愛知県を拠点にしたWeb制作。制作費0円・月額2,980円（税込）のサブスク型で、小さな会社のホームページを作って育てています。</p></div></aside>
      <nav class="prevnext" aria-label="前後の記事">
        ${newer ? `<a class="pn" href="/column/${newer.meta.slug}/"><span>新しい記事</span>${esc(newer.meta.title)}</a>` : "<span></span>"}
        ${older ? `<a class="pn next" href="/column/${older.meta.slug}/"><span>前の記事</span>${esc(older.meta.title)}</a>` : "<span></span>"}
      </nav>
    </article>
  </div>
  ${rel.length ? `<section class="related"><div class="wrap"><h2 class="h2">あわせて読みたい</h2><div class="pgrid">${rel.map(card).join("")}</div><p class="center"><a class="btn y" href="/column/">コラム一覧へ</a></p></div></section>` : ""}
</main>
${footer()}
</body>
</html>
`;
}

// ───────────────────────── 一覧ページ ─────────────────────────
function renderIndex(all) {
  const url = `${SITE}/column/`;
  const cats = CATEGORIES.filter((c) => all.some((p) => p.meta.category === c));
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "LEGACRAFT コラム", url, description: "小さな会社・個人事業主のためのホームページの作り方・費用・運用のコラム。" };
  return `${head({ title: "コラム｜小さな会社のホームページの作り方・費用・運用 | LEGACRAFT", description: "ホームページの費用相場、サブスク型の仕組み、自分で作るか頼むか、業種別の載せるべき内容、SEOの基本まで。個人事業主・小さな会社向けにやさしく解説します。毎日更新。", url, image: `${SITE}/images/ogp.png`, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` }).replace('property="og:type" content="article"', 'property="og:type" content="website"')}
${header()}
<main class="col-main">
  <section class="col-hero"><div class="wrap">
    <p class="kicker y">COLUMN</p>
    <h1 class="h2">ホームページの「わからない」を、<span class="mk">ぜんぶ解決するコラム</span></h1>
    <p class="lead">費用のこと、作り方のこと、作ったあとのこと。小さな会社・個人事業主の方に向けて、むずかしい言葉を使わずに書いています。</p>
    <figure style="margin:22px auto 0;max-width:640px"><img src="/images/site/column-top.webp" alt="本からブロックが飛び出す本棚の前で、楽しそうに本を読む二人のイラスト" width="1200" height="675" decoding="async" style="width:100%;height:auto;display:block;border:3px solid #1B1B2F;border-radius:18px"></figure>
  </div></section>
  <div class="wrap">
    <div class="cats" role="tablist" aria-label="カテゴリ"><button class="chip on" data-filter="all">すべて（${all.length}）</button>${cats.map((c) => `<button class="chip ${CAT_COLOR[c] || ""}" data-filter="${esc(c)}">${esc(c)}（${all.filter((p) => p.meta.category === c).length}）</button>`).join("")}</div>
    <div class="pgrid" id="plist">${all.map(card).join("\n")}</div>
    <p class="empty" id="pempty" hidden>このカテゴリの記事は準備中です。</p>
  </div>
  <section class="related"><div class="wrap narrow">${ctaBox("end")}</div></section>
</main>
${footer()}
<script>
(function(){var bs=document.querySelectorAll('.cats .chip'),cards=document.querySelectorAll('#plist .pcard'),empty=document.getElementById('pempty');
bs.forEach(function(b){b.addEventListener('click',function(){var f=b.getAttribute('data-filter');bs.forEach(function(x){x.classList.toggle('on',x===b)});var n=0;cards.forEach(function(c){var show=f==='all'||c.getAttribute('data-cat')===f;c.hidden=!show;if(show)n++});empty.hidden=n>0;});});})();
</script>
</body>
</html>
`;
}

function renderFeed(all) {
  const items = all.slice(0, 20).map((p) => `  <item><title>${esc(p.meta.title)}</title><link>${SITE}/column/${p.meta.slug}/</link><guid>${SITE}/column/${p.meta.slug}/</guid><pubDate>${new Date(`${p.meta.date}T07:00:00+09:00`).toUTCString()}</pubDate><description>${esc(p.meta.description)}</description></item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>LEGACRAFT コラム</title><link>${SITE}/column/</link><description>小さな会社・個人事業主のためのホームページの作り方・費用・運用</description><language>ja</language>\n${items}\n</channel></rss>\n`;
}

function updateSitemap(all) {
  const p = path.join(ROOT, "sitemap.xml");
  let xml = readFileSync(p, "utf8");
  xml = xml.replace(/  <url>\s*<loc>https:\/\/legacraft\.jp\/column\/[^<]*<\/loc>[\s\S]*?<\/url>\n/g, "");
  const entries = [`  <url>\n    <loc>${SITE}/column/</loc>\n    <lastmod>${all[0]?.meta.date || TODAY}</lastmod>\n  </url>\n`,
    ...all.map((q) => `  <url>\n    <loc>${SITE}/column/${q.meta.slug}/</loc>\n    <lastmod>${q.meta.date}</lastmod>\n  </url>\n`)];
  xml = xml.replace(/<\/urlset>/, `${entries.join("")}</urlset>`);
  writeFileSync(p, xml, "utf8");
}

// ───────────────────────── main ─────────────────────────
const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith(".md")).sort() : [];
const posts = files.map((f) => ({ file: f, ...parseFrontMatter(readFileSync(path.join(SRC, f), "utf8"), f) }));
const slugs = new Set();
for (const p of posts) { if (slugs.has(p.meta.slug)) throw new Error(`slug 重複: ${p.meta.slug}`); slugs.add(p.meta.slug); }

const published = posts.filter((p) => p.meta.date <= TODAY).sort((a, b) => (a.meta.date < b.meta.date ? 1 : a.meta.date > b.meta.date ? -1 : 0));
const pubSlugs = new Set(published.map((p) => p.meta.slug));

let problems = 0;
for (const p of posts) {
  const ctx = { published: CHECK ? new Set(posts.map((q) => q.meta.slug)) : pubSlugs, droppedLinks: [], externalLinks: [] };
  const r = markdownToHtml(p.body, ctx);
  Object.assign(p, r, { ctx });
  const chars = p.body.replace(/\s+/g, "").length;
  const issues = [];
  if (chars < 1800) issues.push(`本文が短い（${chars}字）`);
  if (r.ctaCount !== 2) issues.push(`{{cta}} が ${r.ctaCount} 回（2回必要）`);
  if (p.toc.length < 3) issues.push(`h2 が ${p.toc.length} 個`);
  if (!/##\s*まとめ/.test(p.body)) issues.push("「## まとめ」がない");
  if (ctx.externalLinks.length) issues.push(`外部リンク: ${ctx.externalLinks.join(", ")}`);
  if (/\d+(\.\d+)?\s*[%％]/.test(p.body)) issues.push("割合（%）の記述あり—根拠を確認");
  if (!existsSync(path.join(IMG_DIR, p.meta.image))) issues.push(`画像なし（default.svg を使用）: ${p.meta.image}`);
  p.chars = chars;
  if (CHECK || issues.some((s) => !s.startsWith("画像なし"))) {
    const tag = p.meta.date <= TODAY ? "公開" : "予約";
    console.log(`${issues.some((s) => !s.startsWith("画像なし")) ? "⚠" : "✓"} [${tag} ${p.meta.date}] ${p.meta.slug} ${chars}字${issues.length ? " — " + issues.join(" / ") : ""}`);
    if (issues.some((s) => !s.startsWith("画像なし"))) problems++;
  }
}
if (CHECK) { console.log(`\n${posts.length} 記事を検査、要確認 ${problems} 件（BUILD_DATE=${TODAY} 時点で公開 ${published.length} 件）`); process.exit(0); }

// 公開ディレクトリを同期（未公開・削除済みのディレクトリは消す）
mkdirSync(OUT, { recursive: true });
for (const d of readdirSync(OUT)) {
  const full = path.join(OUT, d);
  if (statSync(full).isDirectory() && d !== "_src" && !pubSlugs.has(d)) rmSync(full, { recursive: true, force: true });
}
published.forEach((p, idx) => {
  const dir = path.join(OUT, p.meta.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "index.html"), renderPost(p, published, idx), "utf8");
});
writeFileSync(path.join(OUT, "index.html"), renderIndex(published), "utf8");
writeFileSync(path.join(OUT, "feed.xml"), renderFeed(published), "utf8");
updateSitemap(published);

console.log(`✅ BUILD_DATE=${TODAY}: 公開 ${published.length} / 全 ${posts.length} 記事（予約 ${posts.length - published.length} 件）`);
for (const p of published) if (p.ctx.droppedLinks.length) console.log(`   ${p.meta.slug}: 未公開記事へのリンクを文字化 → ${[...new Set(p.ctx.droppedLinks)].join(", ")}`);
const next = posts.filter((p) => p.meta.date > TODAY).sort((a, b) => (a.meta.date > b.meta.date ? 1 : -1))[0];
if (next) console.log(`   次の公開: ${next.meta.date} ${next.meta.slug}`);
