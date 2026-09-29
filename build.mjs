// Static site generator (zero dependencies). Run: node build.mjs
// Reads src/, writes the deployable HTML to the repo root. Commit the output; Netlify needs no build step.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PRODUCTS } from './src/site.mjs';
import { SERVICES } from './src/content/services.mjs';
import { WORK } from './src/content/work.mjs';
import { POSTS } from './src/content/posts.mjs';
import { home, servicePage, workPage, blogIndex, postPage } from './src/pages.mjs';
import { syncForm } from './src/google-form.mjs';
import { about, privacy, terms, notFound, pharma, magnet, MAGNETS } from './src/pages-static.mjs';

if (process.argv.includes('--sync-form')) { console.log('Google Form snapshot updated:', JSON.stringify(await syncForm())); console.log('Run "node build.mjs" again to rebuild pages from it.'); process.exit(0); }

const root = dirname(fileURLToPath(import.meta.url));
const write = (rel, content) => { const f = join(root, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); };

const pages = [
    home(), ...SERVICES.map(servicePage), ...WORK.map(workPage), blogIndex(), ...POSTS.map(postPage),
    about(), privacy(), terms(), pharma(), notFound(), ...MAGNETS.map(magnet),
];

for (const p of pages) write(p.path === '/' ? 'index.html' : p.path.endsWith('.html') ? p.path.slice(1) : `${p.path.slice(1)}index.html`, p.html);

// Sitemap: same-host, canonical, indexable URLs only.
const urls = [...pages.filter((p) => p.indexable !== false).map((p) => p.path), '/notes/', '/notes/blogs/'];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${SITE.url}${u}</loc>\n    <lastmod>${SITE.updated}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`);

// llms.txt: a readable index of the same facts, generated so it cannot drift from the pages.
const abs = (u) => (u.startsWith('http') ? u : SITE.url + u);
write('llms.txt', `# Mobile1X

> Mobile1X is a mobile and AI product engineering studio based in Indore, India, founded by Rahul Pahuja. It designs, builds and launches Android, iOS and web apps, AI products, MVPs and fintech platforms for clients worldwide, and ships its own apps including Notes and Dedup.

Engagements typically range from $5,000 to $100,000+; standalone web performance audits start at $500. Every project has a written scope and quote before work starts.

## Services

${SERVICES.map((s) => `- [${s.name}](${SITE.url}/services/${s.slug}/): ${s.blurb}`).join('\n')}

## Products and case studies

${WORK.map((w) => `- [${w.name}](${SITE.url}/work/${w.slug}/): ${PRODUCTS[w.product].summary}`).join('\n')}
- [POS System](${PRODUCTS.pos.web}): ${PRODUCTS.pos.summary}
- [B2B Pharma Platform](${SITE.url}/pharma/): ${PRODUCTS.pharma.summary}

## Guides

${POSTS.map((p) => `- [${p.title}](${SITE.url}/blog/${p.slug}/): ${p.description}`).join('\n')}

## Company and contact

- [About and founder](${SITE.url}/about/)
- LinkedIn: ${SITE.linkedin}
- Email: ${SITE.email}
- Phone / WhatsApp: ${SITE.phone}
- Book a 30-minute discovery call: ${SITE.calendly}
`);

// Brand mark (used as logo, favicon and in Organization schema).
const mark = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4C15D"/><stop offset="1" stop-color="#C89B3C"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><g fill="none" stroke="#050505" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11.5 10.5 9v14"/><path d="M15.5 12.5 24.5 22M24.5 12.5 15.5 22"/></g></svg>\n';
write('assets/logo.svg', mark);
write('assets/favicon.svg', mark);

console.log(`Built ${pages.length} pages, ${urls.length} sitemap URLs.`);
