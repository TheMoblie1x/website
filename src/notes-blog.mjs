// Notes blog: pre-renders /notes/blogs/ and /notes/blogs/<slug>/ from notes/blogs/data/posts.json.
// The studio (notes/blogs/studio-k7m3x9) still publishes by committing that file, so a post added there is
// shown by the client fallback (blog.js + post.html?slug=) until `node build.mjs` next runs and pre-renders it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE } from './site.mjs';

const POSTS_FILE = fileURLToPath(new URL('../notes/blogs/data/posts.json', import.meta.url));
const BASE = `${SITE.url}/notes/blogs/`;
const PLAY = 'https://play.google.com/store/apps/details?id=com.rp.notes';
const APPLE = 'https://apps.apple.com/us/app/notes-voice-record-ai/id6798175378';
const THEME_COLOR = '#0D1013';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PLATFORM = { android: 'Android', ios: 'iPhone', web: 'Web' };
const TYPE = { howto: 'How-to', blog: 'Article' };
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/* ---------- Markdown: the small subset the posts use (headings, lists, tables, bold, italics, code, links) ---------- */
const inline = (text) => esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
        const external = /^https?:\/\//.test(href) && !href.startsWith(SITE.url);
        return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    });

export function markdown(md) {
    const lines = String(md ?? '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        let m;
        if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
        if (/^\|.*\|\s*$/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
            const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
            const head = cells(line);
            i += 2;
            const rows = [];
            while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
            out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
            continue;
        }
        if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
            const ordered = /^\s*\d+\./.test(line);
            const items = [];
            while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) items.push(lines[i++].replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, ''));
            out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
            continue;
        }
        const para = [];
        while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i])) para.push(lines[i++]);
        out.push(`<p>${inline(para.join(' '))}</p>`);
    }
    return out.join('\n');
}

export const loadPosts = () => JSON.parse(readFileSync(POSTS_FILE, 'utf8')).posts
    .filter((p) => p.published)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

/* ---------- Shared page chrome (same look and scripts as the Notes landing page) ---------- */
const head = ({ title, description, canonical, image, extra = '' }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="/notes/assets/js/analytics.js"></script>
  <script defer src="/notes/assets/js/track.js"></script>
  <script>(function(){var t=null;try{t=localStorage.getItem('app-theme')}catch(e){}if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.add('js')})();</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="author" content="Mobile1X" />
  <meta name="theme-color" content="${THEME_COLOR}" />
  <meta property="og:type" content="${extra.includes('"BlogPosting"') ? 'article' : 'website'}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Mobile1X" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="icon" href="/assets/apps/notes/icon.webp" type="image/webp" />
  ${extra}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/notes/assets/css/notes.css">
</head>`;

const nav = () => `<a class="skip" href="#main">Skip to content</a>
  <header class="nav" data-loc="nav">
    <div class="wrap nav__in">
      <a href="/notes/" class="brand" aria-label="Notes by Mobile1X, home">
        <img src="/assets/apps/notes/icon.webp" alt="" width="36" height="36" class="brand__icon">
        <span class="brand__name">Notes</span>
        <span class="brand__by">by Mobile1X</span>
      </a>
      <nav class="nav__links" aria-label="Main">
        <a href="/notes/#features">Features</a>
        <a href="/notes/#how-it-works">How it works</a>
        <a href="/notes/blogs/" aria-current="page">Guides</a>
        <a href="/notes/#faq">FAQ</a>
      </nav>
      <div class="nav__actions">
        <button type="button" class="theme" id="theme-toggle" aria-label="Switch colour theme"><span class="theme__dark">Light</span><span class="theme__light">Dark</span></button>
        <a href="/notes/#download" class="btn btn--sm" data-store-cta>Get the app</a>
      </div>
    </div>
  </header>`;

const badges = (loc, extraClass = '') => `<div class="badges ${extraClass}" data-badges data-loc="${loc}">
    <a class="badge badge--apple" href="${APPLE}" target="_blank" rel="noopener noreferrer" aria-label="Download Notes on the App Store"><img src="/notes/assets/img/app-store-badge.svg" alt="Download on the App Store" width="150" height="50" loading="lazy"></a>
    <a class="badge badge--play" href="${PLAY}" target="_blank" rel="noopener noreferrer" aria-label="Get Notes on Google Play"><img src="/notes/assets/img/google-play-badge.png" alt="Get it on Google Play" width="646" height="250" loading="lazy"></a>
  </div>`;

const foot = () => `<footer class="foot" data-loc="footer">
    <div class="wrap foot__in">
      <p>&copy; 2026 Mobile1X. Notes is an app by <a href="/">Mobile1X</a>.</p>
      <nav aria-label="Footer">
        <a href="${APPLE}" target="_blank" rel="noopener noreferrer">App Store</a>
        <a href="${PLAY}" target="_blank" rel="noopener noreferrer">Google Play</a>
        <a href="/notes/">Notes home</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
      </nav>
    </div>
  </footer>
  <script defer src="/notes/assets/js/blog.js"></script>
</body>
</html>
`;

const card = (p, position) => `<article class="post-card reveal" data-type="${p.type}" data-slug="${esc(p.slug)}">
        <a href="/notes/blogs/${p.slug}/" class="post-card__link" data-track="blog_card_click" data-track-post-slug="${esc(p.slug)}" data-track-post-type="${p.type}" data-track-position="${position}">
          ${p.thumbnail ? `<div class="post-card__img"><img src="${esc(p.thumbnail)}" alt="" width="640" height="1331" loading="lazy"></div>` : ''}
          <div class="post-card__body">
            <p class="post-card__meta"><span class="tag tag--${p.type}">${TYPE[p.type] || 'Post'}</span><span>${(p.platforms || []).map((x) => PLATFORM[x] || x).join(' · ')}</span></p>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
          </div>
        </a>
      </article>`;

/* ---------- Pages ---------- */
export function blogIndex(posts) {
    const howtos = posts.filter((p) => p.type === 'howto');
    const articles = posts.filter((p) => p.type !== 'howto');
    const description = 'Step-by-step how-tos and short guides for Notes by Mobile1X: voice notes, handwriting scan, locking notes, reminders and more.';
    const ld = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'CollectionPage', name: 'Notes guides and how-tos', url: BASE, description, isPartOf: { '@type': 'WebSite', name: 'Mobile1X', url: `${SITE.url}/` } },
            { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Notes', item: `${SITE.url}/notes/` }, { '@type': 'ListItem', position: 2, name: 'Guides', item: BASE }] },
        ],
    });
    const html = `${head({ title: 'Notes guides and how-tos — Notes by Mobile1X', description, canonical: BASE, image: `${SITE.url}/assets/apps/notes/shot1.png`, extra: `<script type="application/ld+json">${ld}</script>` })}
<body>
  ${nav()}
  <main id="main">
    <section class="section section--tight" id="blog-hero" data-loc="blog-hero">
      <div class="wrap head">
        <p class="eyebrow">Guides</p>
        <h1 class="display display--sm">Get more out of Notes.</h1>
        <p class="lead">Short, step-by-step how-tos for Android, plus a few longer reads. Each one takes a couple of minutes.</p>
      </div>
    </section>
    <section class="section section--tight" id="posts" data-loc="posts" style="padding-top:0">
      <div class="wrap">
        <div class="filters" role="group" aria-label="Filter guides">
          <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span>${posts.length}</span></button>
          <button type="button" class="chip" data-filter="howto" aria-pressed="false">How-tos <span>${howtos.length}</span></button>
          <button type="button" class="chip" data-filter="blog" aria-pressed="false">Articles <span>${articles.length}</span></button>
        </div>
        <div class="post-grid" id="post-grid">
      ${posts.map((p, i) => card(p, i + 1)).join('\n      ')}
        </div>
      </div>
    </section>
    <section class="section section--cta" id="download" data-loc="blog-download">
      <div class="wrap">
        <div class="cta">
          <img src="/assets/apps/notes/icon.webp" alt="Notes app icon" width="80" height="80" class="cta__icon" loading="lazy">
          <h2 class="display display--sm">Try it on your phone.</h2>
          <p class="lead">Notes is on Android and iPhone.</p>
          ${badges('blog-download', 'badges--center')}
        </div>
      </div>
    </section>
  </main>
  ${foot()}`;
    return { path: '/notes/blogs/', file: 'notes/blogs/index.html', html };
}

export function postPage(p, posts) {
    const url = `${BASE}${p.slug}/`;
    const image = p.thumbnail ? (p.thumbnail.startsWith('http') ? p.thumbnail : `${SITE.url}${p.thumbnail}`) : `${SITE.url}/assets/apps/notes/shot1.png`;
    const related = posts.filter((o) => o.slug !== p.slug).sort((a, b) => (b.type === p.type) - (a.type === p.type)).slice(0, 3);
    const ld = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.date, dateModified: p.date, image, mainEntityOfPage: url, inLanguage: 'en',
                author: { '@type': 'Organization', name: 'Mobile1X', url: `${SITE.url}/` }, publisher: { '@type': 'Organization', name: 'Mobile1X', url: `${SITE.url}/` } },
            { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Notes', item: `${SITE.url}/notes/` }, { '@type': 'ListItem', position: 2, name: 'Guides', item: BASE }, { '@type': 'ListItem', position: 3, name: p.title, item: url }] },
        ],
    });
    const html = `${head({ title: `${p.title} — Notes by Mobile1X`, description: p.excerpt, canonical: url, image, extra: `<script type="application/ld+json">${ld}</script>` })}
<body>
  ${nav()}
  <main id="main">
    <article class="post wrap wrap--narrow" id="post" data-loc="post" data-post-slug="${esc(p.slug)}" data-post-type="${p.type}">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/notes/">Notes</a><span>/</span><a href="/notes/blogs/">Guides</a></nav>
      <p class="post__meta"><span class="tag tag--${p.type}">${TYPE[p.type] || 'Post'}</span><span>${(p.platforms || []).map((x) => PLATFORM[x] || x).join(' · ')}</span><span>${fmtDate(p.date)}</span></p>
      <h1 class="display display--sm">${esc(p.title)}</h1>
      <p class="lead">${esc(p.excerpt)}</p>
      <div class="prose">
${markdown(p.body)}
      </div>
      <div id="post-end" aria-hidden="true"></div>
    </article>
    <section class="section section--tight" id="post-cta" data-loc="post-cta">
      <div class="wrap wrap--narrow">
        <div class="cta">
          <img src="/assets/apps/notes/icon.webp" alt="Notes app icon" width="80" height="80" class="cta__icon" loading="lazy">
          <h2 class="h2">Get Notes</h2>
          <p class="lead">Say it, snap it, and let it file itself.</p>
          ${badges('post-cta', 'badges--center')}
        </div>
      </div>
    </section>
    <section class="section section--alt" id="more-guides" data-loc="more-guides">
      <div class="wrap">
        <header class="head"><h2 class="h2">More guides</h2></header>
        <div class="post-grid">
      ${related.map((r, i) => card(r, i + 1)).join('\n      ')}
        </div>
      </div>
    </section>
  </main>
  ${foot()}`;
    return { path: `/notes/blogs/${p.slug}/`, file: `notes/blogs/${p.slug}/index.html`, html };
}

/** All pre-rendered Notes blog pages. Written by build.mjs before the sitemap is built. */
export function notesBlogPages() {
    const posts = loadPosts();
    return [blogIndex(posts), ...posts.map((p) => postPage(p, posts))];
}
