#!/usr/bin/env node
/**
 * Builds the handbook site into dist/.
 *
 * The Markdown files are the source. README.md is both the home page and the
 * table of contents: each `## [Section](section/index.md)` heading and the
 * list of links under it become the navigation, in that order; a section
 * heading with no list under it is a single page, like the manifesto. A page
 * that README.md does not link to is still built, just left out of the
 * navigation.
 *
 * Every colour, typeface and logo comes from @wingravity/brand in the
 * wingravity/branding repo, so the site always matches
 * wingravity.github.io/branding. Point BRANDING_DIR at a checkout of it;
 * locally it defaults to ../wingravity-branding.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, posix, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Marked } from "marked";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://docs.wingravity.com";
const REPO_URL = "https://github.com/wingravity/handbook";

const BRANDING_DIR = resolve(ROOT, process.env.BRANDING_DIR ?? "../wingravity-branding");
const brandEntry = join(BRANDING_DIR, "packages", "brand", "index.mjs");
if (!existsSync(brandEntry)) {
  console.error(`No @wingravity/brand at ${brandEntry}. Clone wingravity/branding there or set BRANDING_DIR.`);
  process.exit(1);
}
const brand = await import(pathToFileURL(brandEntry));

const C = brand.tokens().colors;
const G = C.gray;

/* ---------------------------------------------------------------- helpers -- */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Inline SVG with its fixed size removed, so CSS decides the width. */
const fluid = (svg) =>
  svg.replace(/<\?xml[^>]*>\s*/, "")
    .replace(/<svg[^>]*>/, (tag) => tag.replace(/ (width|height)="[\d.]+"/g, ""));

const WORDMARK = fluid(brand.wordmark("dark"));

const slug = (text) =>
  text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");

/** Source path `handbook/our-values.md` → URL path `handbook/our-values/`. */
function urlPath(src) {
  if (src === "README.md") return "";
  const p = src.replace(/\.md$/, "").replace(/(^|\/)index$/, "");
  return p ? `${p}/` : "";
}

/** A relative href from one URL path to another, so the site works under any base. */
function rel(from, to) {
  const r = posix.relative(`/${from}`, `/${to}`);
  return r === "" ? "./" : (to === "" || to.endsWith("/")) && !r.endsWith("/") ? `${r}/` : r;
}

const plain = (md) => md.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");

function excerpt(text, max = 150) {
  const t = plain(text).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t.replace(/:$/, ".");
  return `${t.slice(0, t.lastIndexOf(" ", max)).replace(/[,;:.\s-]+$/, "")}…`;
}

function listMarkdown(dir = ROOT, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith(".") || ["node_modules", "dist", "site"].includes(e.name)) return [];
    const p = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) return listMarkdown(join(dir, e.name), p);
    return e.name.endsWith(".md") ? [p] : [];
  });
}

/* ------------------------------------------------------------------ pages -- */

/**
 * A page is its H1 (the title), the paragraph straight after it (the lede,
 * when there is one) and the rest (the body).
 */
function readPage(src) {
  const tokens = new Marked().lexer(readFileSync(join(ROOT, src), "utf8"));
  const h1 = tokens.findIndex((t) => t.type === "heading" && t.depth === 1);
  const title = h1 >= 0 ? tokens[h1].text : src;
  const next = tokens.slice(h1 + 1).find((t) => t.type !== "space");
  const lede = next?.type === "paragraph" ? next.text : null;
  const body = tokens.filter((t, i) => i !== h1 && t !== (lede ? next : null));
  body.links = tokens.links;
  const summary = lede ?? body.find((t) => t.type === "paragraph")?.text ?? null;
  return { src, url: urlPath(src), title: plain(title), lede, summary, body };
}

const pages = new Map(listMarkdown().map((src) => [src, readPage(src)]));

/** README.md's sections and their page lists, resolved to pages. */
function readNav() {
  const tokens = new Marked().lexer(readFileSync(join(ROOT, "README.md"), "utf8"));
  const sections = [];
  for (const t of tokens) {
    if (t.type === "heading" && t.depth === 2) {
      const link = t.tokens.find((x) => x.type === "link");
      sections.push({ title: plain(t.text), page: link ? pages.get(posix.normalize(link.href)) : null, items: [] });
    } else if (t.type === "list" && sections.length) {
      for (const item of t.items) {
        const link = item.tokens.flatMap((x) => x.tokens ?? []).find((x) => x.type === "link");
        const page = link && pages.get(posix.normalize(link.href));
        if (page) sections.at(-1).items.push({ title: plain(link.text), page });
      }
    }
  }
  return sections;
}

const NAV = readNav();
const sectionOf = (page) =>
  NAV.find((s) => s.page === page || s.items.some((i) => i.page === page));

/* --------------------------------------------------------------- markdown -- */

/** Renders tokens from `page`, turning links between .md files into site URLs. */
function render(tokens, page) {
  const seen = new Map();
  const md = new Marked({
    renderer: {
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const m = href.match(/^([^:#?]+\.md)(#.*)?$/);
        if (m) {
          const target = posix.normalize(posix.join(posix.dirname(page.src), m[1]));
          href = rel(page.url, urlPath(target)) + (m[2] ?? "");
        }
        const external = /^https?:/.test(href);
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' rel="noopener"' : ""}>${text}</a>`;
      },
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        let id = slug(text);
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}">${text}</a></h${depth}>\n`;
      },
    },
  });
  return md.parser(tokens);
}

const inline = (text, page) => {
  const tokens = new Marked().lexer(text);
  return render(tokens, page).replace(/^<p>|<\/p>\s*$/g, "");
};

/* ------------------------------------------------------------------- shell -- */

function shell({ page, root, title, description, main }) {
  const here = sectionOf(page);
  const nav = NAV.map((s) => {
    const current = s === here ? ' aria-current="true"' : "";
    return `<a href="${rel(page.url, s.page?.url ?? "")}"${current}>${esc(s.title)}</a>`;
  }).join("");
  const edit = `${REPO_URL}/blob/main/${page.src}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="${G["900"]}">
<link rel="canonical" href="${SITE_URL}/${page.url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="Wingravity Handbook">
<link rel="icon" href="${root}assets/icon.svg" type="image/svg+xml">
<link rel="preload" href="${root}assets/fonts/kanit-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/site.css">
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="${rel(page.url, "")}" aria-label="Wingravity Handbook">${WORDMARK}</a>
    <nav>${nav}</nav>
  </div>
</header>
${main}
<script>if(matchMedia("(max-width:900px)").matches)document.querySelector("aside details")?.removeAttribute("open")</script>
<footer>
  <div class="wrap">
    <span>Wingravity<sup>®</sup> Handbook</span>
    <a href="${edit}">Edit this page on GitHub</a>
    <a href="https://www.wingravity.com">wingravity.com</a>
  </div>
</footer>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ views -- */

function homeView(page) {
  const sections = NAV.map((s, i) => `
<section>
  <div class="wrap">
    <div class="eyebrow">${String(i + 1).padStart(2, "0")}</div>
    <h2>${s.page ? `<a href="${rel(page.url, s.page.url)}">${esc(s.title)}</a>` : esc(s.title)}</h2>
    ${s.page?.lede ? `<p class="section-lede">${inline(s.page.lede, s.page)}</p>` : ""}
    ${s.items.length ? `<div class="cards">
      ${s.items.map((it, j) => `
      <a class="card" href="${rel(page.url, it.page.url)}">
        <span class="k">${String(i + 1).padStart(2, "0")}.${String(j + 1).padStart(2, "0")}</span>
        <span class="v">${esc(it.title)}</span>
        ${it.page.summary ? `<span class="p">${esc(excerpt(it.page.summary))}</span>` : ""}
      </a>`).join("")}
    </div>` : s.page && s.page.title !== s.title ? `<div class="cards">
      <a class="card wide" href="${rel(page.url, s.page.url)}">
        <span class="v">${esc(s.page.title)}</span>
        ${s.page.summary ? `<span class="p">${esc(excerpt(s.page.summary, 220))}</span>` : ""}
      </a>
    </div>` : ""}
  </div>
</section>`).join("");

  return `
<main>
<div class="hero">
  <div class="wrap">
    <div class="eyebrow">Wingravity</div>
    <h1>${esc(page.title)}</h1>
    ${page.lede ? `<p class="lede">${inline(page.lede, page)}</p>` : ""}
  </div>
</div>
${sections}
</main>`;
}

function docView(page) {
  const section = sectionOf(page);
  const aside = section?.items.length ? `
  <aside>
    <details open>
      <summary class="eyebrow">${esc(section.title)}</summary>
      <ul>
        ${section.page ? `<li><a href="${rel(page.url, section.page.url)}"${section.page === page ? ' aria-current="page"' : ""}>Overview</a></li>` : ""}
        ${section.items.map((it) => `<li><a href="${rel(page.url, it.page.url)}"${it.page === page ? ' aria-current="page"' : ""}>${esc(it.title)}</a></li>`).join("")}
      </ul>
    </details>
  </aside>` : "";

  const isIndex = section && section.page === page;
  const children = isIndex && section.items.length ? `
    <div class="cards">
      ${section.items.map((it) => `
      <a class="card" href="${rel(page.url, it.page.url)}">
        <span class="v">${esc(it.title)}</span>
        ${it.page.summary ? `<span class="p">${esc(excerpt(it.page.summary))}</span>` : ""}
      </a>`).join("")}
    </div>` : "";

  const order = section ? [section.page, ...section.items.map((i) => i.page)].filter(Boolean) : [];
  const at = order.indexOf(page);
  const prev = at > 0 ? order[at - 1] : null;
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : null;
  const pager = prev || next ? `
    <div class="pager">
      ${prev ? `<a class="card" href="${rel(page.url, prev.url)}"><span class="k">Previous</span><span class="v">${esc(prev.title)}</span></a>` : "<span></span>"}
      ${next ? `<a class="card next" href="${rel(page.url, next.url)}"><span class="k">Next</span><span class="v">${esc(next.title)}</span></a>` : ""}
    </div>` : "";

  return `
<main class="wrap doc${aside ? "" : " solo"}">
  ${aside}
  <article>
    <div class="eyebrow">${esc(section?.title ?? "Wingravity")}</div>
    <h1>${esc(page.title)}</h1>
    ${page.lede ? `<p class="lede">${inline(page.lede, page)}</p>` : ""}
    <div class="prose">
${render(page.body, page)}
    </div>
    ${children}
    ${pager}
  </article>
</main>`;
}

/* ------------------------------------------------------------------- css -- */

function css() {
  const faces = brand.FONT_FILES.map(([family, weight, file]) =>
    `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;` +
    `src:url(fonts/${file}) format("woff2")}`).join("\n");
  return `${faces}
:root{color-scheme:dark;
  --ground:${G["900"]};--raised:${G["800"]};--line:${G["700"]};--quiet:${G["600"]};
  --muted:${G["400"]};--ink:${C.white};--accent:${C.primary};--accent-hover:${C.primaryLight};--warn:${C.yellow}}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-padding-top:88px}
body{background:var(--ground);color:var(--ink);font-family:"Kanit",system-ui,sans-serif;font-weight:300;
  font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
main{flex:1}
svg{display:block}
a{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--line)}
a:hover{color:var(--accent-hover)}
.wrap{max-width:1040px;margin:0 auto;padding:0 32px}
.eyebrow{font-family:"Space Mono",monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}

header.top{border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--ground);z-index:2}
header.top .wrap{display:flex;align-items:center;gap:28px;height:64px}
header.top .brand{width:112px;flex:none;border:0}
header.top nav{display:flex;gap:18px;overflow-x:auto;white-space:nowrap;font-size:13px}
header.top nav a{border:0;color:var(--muted)}
header.top nav a:hover,header.top nav a[aria-current]{color:var(--ink)}

.hero{padding:120px 0 96px;border-bottom:1px solid var(--line)}
.hero h1{font-weight:300;font-size:64px;line-height:1.05;letter-spacing:-.02em;margin:20px 0 22px;max-width:14ch}
.lede{color:var(--muted);font-size:20px;max-width:52ch}
section{padding:88px 0;border-bottom:1px solid var(--line)}
section h2{font-weight:300;font-size:38px;letter-spacing:-.01em;margin:10px 0 18px}
section h2 a{color:var(--ink);border:0}
section h2 a:hover{color:var(--accent)}
.section-lede{color:var(--muted);max-width:64ch}

.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:36px}
.card{border:1px solid var(--line);border-radius:12px;padding:22px 24px;background:var(--raised);
  display:flex;flex-direction:column;gap:6px;color:var(--ink);transition:border-color .15s}
.card:hover{border-color:var(--accent);color:var(--ink)}
.card .k{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.card .v{font-size:19px;font-weight:400}
.card .p{font-size:15px;color:var(--muted);line-height:1.5}
.card.wide{grid-column:1/-1;max-width:640px}

.doc{display:grid;grid-template-columns:220px minmax(0,1fr);gap:64px;padding-top:72px;padding-bottom:96px}
.doc.solo{grid-template-columns:minmax(0,1fr)}
aside{position:sticky;top:112px;align-self:start}
aside summary{list-style:none;cursor:default;margin-bottom:14px}
aside summary::-webkit-details-marker{display:none}
aside ul{list-style:none;display:grid;gap:2px;border-left:1px solid var(--line)}
aside a{display:block;border:0;color:var(--muted);font-size:15px;padding:5px 0 5px 16px;margin-left:-1px;border-left:1px solid transparent}
aside a:hover{color:var(--ink)}
aside a[aria-current]{color:var(--ink);border-left-color:var(--accent)}
article{max-width:720px}
article>h1{font-weight:300;font-size:52px;line-height:1.08;letter-spacing:-.02em;margin:16px 0 18px}
article>.lede{margin-bottom:8px}
.prose{margin-top:40px}
.prose h2{font-weight:300;font-size:30px;letter-spacing:-.01em;line-height:1.2;margin:56px 0 14px;
  padding-top:40px;border-top:1px solid var(--line)}
.prose>h2:first-child{margin-top:0}
.prose h3{font-weight:400;font-size:20px;margin:36px 0 10px}
.prose h4{font-weight:400;font-size:17px;margin:28px 0 8px}
.prose a.anchor{color:inherit;border:0}
.prose a.anchor:hover{color:var(--accent)}
.prose p,.prose li{color:var(--muted)}
.prose p{margin:0 0 16px;max-width:64ch}
.prose strong{color:var(--ink);font-weight:400}
.prose ul,.prose ol{margin:0 0 20px;display:grid;gap:10px;max-width:66ch}
.prose ul{list-style:none}
.prose ul>li{padding-left:22px;position:relative}
.prose ul>li::before{content:"·";position:absolute;left:4px;color:var(--accent)}
.prose ol{list-style:none;counter-reset:n}
.prose ol>li{padding-left:36px;position:relative;counter-increment:n}
.prose ol>li::before{content:counter(n,decimal-leading-zero);position:absolute;left:0;top:.2em;
  font-family:"Space Mono",monospace;font-size:12px;color:var(--accent)}
.prose li>ul,.prose li>ol{margin:10px 0 0}
.prose blockquote{border-left:2px solid var(--accent);padding:14px 20px;margin:28px 0;background:var(--raised);
  border-radius:0 10px 10px 0;max-width:70ch}
.prose blockquote p{color:var(--ink);margin:0;max-width:none}
.prose code{font-family:"Space Mono",monospace;font-size:.82em;color:var(--ink);background:var(--raised);padding:1px 6px;border-radius:4px}
.prose pre{background:var(--raised);border:1px solid var(--line);border-radius:12px;padding:20px 22px;overflow-x:auto;margin:0 0 20px}
.prose pre code{background:none;padding:0;font-size:13px;line-height:1.7}
.prose hr{border:0;border-top:1px solid var(--line);margin:40px 0}
.prose img{max-width:100%;border-radius:12px;border:1px solid var(--line)}
.prose table{border-collapse:collapse;width:100%;margin:28px 0;font-size:15px}
.prose th{text-align:left;font-weight:400;color:var(--muted);font-size:12px;letter-spacing:.06em;padding:10px 12px;border-bottom:1px solid var(--line)}
.prose td{padding:10px 12px;border-bottom:1px solid var(--raised);color:var(--muted)}
article .cards{grid-template-columns:repeat(2,1fr)}
.pager{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:72px;padding-top:40px;border-top:1px solid var(--line)}
.pager .next{text-align:right}

footer{border-top:1px solid var(--line);padding:32px 0 48px;color:var(--muted);font-size:13px}
footer .wrap{display:flex;gap:24px;flex-wrap:wrap}
footer span{margin-right:auto}
footer sup{font-size:.6em}
footer a{color:var(--muted);border:0}
footer a:hover{color:var(--ink)}

.lost{padding:160px 0;text-align:left}
.lost h1{font-weight:300;font-size:64px;letter-spacing:-.02em;margin:20px 0 18px}

@media (max-width:900px){
  .cards{grid-template-columns:1fr 1fr}
  .doc{grid-template-columns:minmax(0,1fr);gap:32px;padding-top:40px}
  aside{position:static;border:1px solid var(--line);border-radius:12px;padding:14px 18px;background:var(--raised)}
  aside summary{cursor:pointer;margin:0}
  aside details[open] summary{margin-bottom:12px}
  aside summary::after{content:"＋";float:right;color:var(--muted)}
  aside details[open] summary::after{content:"－"}
}
@media (max-width:640px){
  .wrap{padding:0 16px}
  header.top .wrap{gap:20px}
  header.top .brand{width:96px}
  .hero{padding:72px 0 56px}
  .hero h1{font-size:42px}
  .lede{font-size:18px}
  section{padding:56px 0}
  section h2{font-size:30px}
  .cards,article .cards,.pager{grid-template-columns:1fr}
  article>h1{font-size:38px}
  .prose h2{font-size:25px}
  .lost{padding:96px 0}
  .lost h1{font-size:42px}
}
@media print{
  header.top,aside,footer,.pager{display:none}
  body{background:#fff;color:#000}
}
`;
}

/* ------------------------------------------------------------------ write -- */

function write(urlPathOut, html) {
  const out = join(DIST, urlPathOut, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, "assets", "fonts"), { recursive: true });
writeFileSync(join(DIST, "assets", "site.css"), css());
for (const [, , file] of brand.FONT_FILES) {
  copyFileSync(join(brand.BRAND_DIR, "fonts", file), join(DIST, "assets", "fonts", file));
}
copyFileSync(brand.logoPath("app-icon"), join(DIST, "assets", "icon.svg"));

for (const page of pages.values()) {
  const root = rel(page.url, "") === "./" ? "" : rel(page.url, "").replace(/\/?$/, "/");
  const home = page.src === "README.md";
  write(page.url, shell({
    page,
    root,
    title: home ? page.title : `${page.title} · Wingravity Handbook`,
    description: plain(page.summary ?? pages.get("README.md").lede ?? ""),
    main: home ? homeView(page) : docView(page),
  }));
}

/* GitHub Pages serves 404.html at whatever path was missed, so it links from the site root. */
const lost = { src: "README.md", url: "" };
writeFileSync(join(DIST, "404.html"), shell({
  page: lost,
  root: "/",
  title: "Lost in space · Wingravity Handbook",
  description: "This page is not in the handbook.",
  main: `
<main class="wrap lost">
  <div class="eyebrow">404</div>
  <h1>Lost in space</h1>
  <p class="lede">You have reached the end of the universe. Head back to <a href="/">the handbook</a>.</p>
</main>`,
}).replace(/href="(\.\/|(?!\/|https?:|#)[^"]*)"/g, (m, h) => `href="/${h === "./" ? "" : h}"`));

const urls = [...pages.values()].map((p) => `<url><loc>${SITE_URL}/${p.url}</loc></url>`).join("");
writeFileSync(join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`Built ${pages.size} pages into dist/`);
