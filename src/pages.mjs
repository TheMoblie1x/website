// Page renderers: each returns { path, html, indexable, lastmod? }.
import { SITE, PRODUCTS, WHATSAPP_HREF, FOUNDER } from './site.mjs';
import { page } from './layout.mjs';
import { SERVICES, PROCESS, PRICING_NOTE, serviceBySlug } from './content/services.mjs';
import { WORK } from './content/work.mjs';
import { POSTS, postBySlug } from './content/posts.mjs';
import { breadcrumbList, service as serviceSchema, faqPage, article, softwareApp } from './schema.mjs';
import { esc, icon, btn, link, section, sectionHead, breadcrumbs, checks, serviceCard, productCard, pricingCard, faq, processSteps, archStack, contactSection, heroStage, metricCard, phone } from './ui.mjs';

const CTA_TALK = (loc) => btn({ href: '#contact', label: 'Talk to an Engineer', arrow: true, loc });
const CTA_CALL = (loc) => btn({ href: SITE.phoneHref, label: 'Call Mobile1X', variant: 'ghost', ic: 'phone', loc });

const HOME_FAQ = [
    { q: 'What is Mobile1X?', a: 'Mobile1X is a mobile and AI product engineering studio based in Indore, India, that designs, builds and launches Android, iOS and web products, AI systems and fintech platforms for clients worldwide. It also ships its own products, including the Notes app, the Dedup duplicate file remover, The A2Z Collection e-commerce platform and Auction Manager sports-auction software.' },
    { q: 'How much does mobile app development cost?', a: 'Product and platform builds with Mobile1X typically range from $5,000 to $100,000+ depending on platforms, features, integrations and whether AI or payments are involved. Standalone web performance audits start at $500. You receive a written scope and quote before work starts.' },
    { q: 'How long does an MVP take?', a: 'It depends on scope, so Mobile1X does not quote a generic timeline. After a 30-minute discovery call you receive a scoped estimate that includes timing.' },
    { q: 'Can Mobile1X add AI to an existing mobile application?', a: 'Yes. AI integration into existing products is part of what Mobile1X does. It starts with a review of your app and the data the feature would use, then a scoped plan and estimate.' },
    { q: 'What technologies does Mobile1X use?', a: 'Mobile1X builds Android apps in Kotlin and Java, iOS apps in Swift and Objective-C, and cross-platform apps in Flutter and React Native, with Spring Boot backends, SQL and SQLite data, Firebase, AWS and Cloudflare infrastructure, and web and desktop front ends in React JS, ElectronJS, HTML, CSS and JavaScript. For AI it works with applications, agents, retrieval-augmented generation (RAG), AI integration and on-device AI. The right stack is chosen per product and explained in writing before the build.' },
    { q: 'What kind of AI systems does Mobile1X build?', a: 'AI applications and features inside mobile and web products, AI agents and automation, RAG systems grounded in your data, chatbots, and lead-scoring and qualification systems for sales teams.' },
    { q: 'Does Mobile1X build fintech platforms?', a: 'Yes. Mobile1X engineers secure, scalable fintech systems for banks, startups and enterprises, including banking and payment API integrations and compliance-minded architecture.' },
    { q: 'What is a Mobile1X performance audit and what does it cost?', a: 'A performance audit identifies revenue leaks, speed problems and scaling opportunities in an existing web platform. Audits start at $500 and scale to around $5,000 depending on scope.' },
    { q: 'Where is Mobile1X based and who does it work with?', a: 'Mobile1X is based in Indore, India, and works with startups, agencies and enterprises globally. Reach Mobile1X by email at hello@mobile1x.com, by phone or WhatsApp at +91 97545 25494, or book a 30-minute discovery call.' },
    { q: 'How do I start a project with Mobile1X?', a: 'Use the form to talk to an engineer, call or message on WhatsApp, or book a 30-minute discovery call. Mobile1X typically responds within one business day.' },
];

const ARCH_LAYERS = [
    { name: 'Client', items: ['Android: Kotlin, Java', 'iOS: Swift, Objective-C', 'Cross-platform: Flutter, React Native', 'Web: React JS, HTML, CSS, JavaScript', 'Desktop: ElectronJS'] },
    { name: 'API and backend', items: ['Spring Boot', 'Firebase', 'Authentication', 'Payments', 'Integrations'] },
    { name: 'AI layer', items: ['Agents', 'RAG', 'Chatbots', 'On-device AI', 'Evaluation'] },
    { name: 'Data and operations', items: ['SQL', 'SQLite', 'AWS', 'Cloudflare', 'Analytics and monitoring'] },
];

const pricing = () => `<div class="grid grid--2">
    ${pricingCard({ name: 'Performance Audit', price: '$500', unit: 'to about $5,000', text: 'For an existing web platform: find where it loses revenue or speed, with a prioritised fix list.', items: ['Speed and Core Web Vitals findings', 'Conversion and funnel leak review', 'Scaling risks and opportunities'], cta: btn({ href: '#contact', label: 'Request an audit', variant: 'ghost', loc: 'pricing' }) })}
    ${pricingCard({ name: 'Product & Platform Build', price: '$5,000', unit: 'to $100,000+', text: 'Mobile, AI, MVP and fintech products designed, built and launched end to end.', items: ['Written scope and quote before work starts', 'Design, engineering, testing and launch', 'Security built in from the start'], cta: btn({ href: '#contact', label: 'Talk to an Engineer', arrow: true, loc: 'pricing' }), featured: true })}
</div><p class="plan__note reveal">Prices are ranges. Your quote follows a 30-minute discovery call.</p>`;

export function home() {
    const hero = `<section class="hero" data-loc="hero">
    <div class="hero__light" aria-hidden="true"><i class="hero__glow"></i><i class="hero__motes"></i><i class="hero__motes hero__motes--far"></i></div>
    <div class="container">
        <div class="hero__copy">
            <p class="eyebrow">Mobile and AI product engineering</p>
            <h1>Mobile &amp; AI products, built by <em>engineers who ship.</em></h1>
            <p class="hero__lede">Mobile1X designs, builds and launches Android and iOS apps, AI products and MVPs, from idea to engineering to launch. Our own apps are live on Google Play and the App Store.</p>
            <div class="hero__actions">${CTA_TALK('hero')}${btn({ href: '#portfolio', label: 'See Our Work', variant: 'ghost', loc: 'hero' })}</div>
            <p class="hero__call"><a class="link-call" href="${SITE.phoneHref}" data-loc="hero">${icon('phone')}Call Mobile1X ${SITE.phone}</a><a class="link-call" href="${WHATSAPP_HREF}" target="_blank" rel="noopener noreferrer" data-loc="hero">${icon('whatsapp')}WhatsApp</a></p>
            <ul class="hero__facts"><li>6 shipped products</li><li>Android · iOS · Web</li><li>Based in Indore, India</li></ul>
        </div>
    ${heroStage(['notes', 'dedup', 'a2z'].map((k) => PRODUCTS[k]))}
</div>
</section>`;

    const proof = section({
        id: 'portfolio', loc: 'case-study', body: `${sectionHead({ eyebrow: 'Proof', title: 'Products we’ve actually shipped.', lede: 'Real products, live in the stores and on the web. This is our track record, not a mock-up.' })}
        <div class="products">${['notes', 'dedup', 'a2z'].map((k) => productCard(PRODUCTS[k])).join('')}</div>
        <div class="products products--compact">${['pos', 'pharma', 'auction'].map((k) => productCard(PRODUCTS[k])).join('')}</div>`,
    });

    const services = section({
        id: 'services', loc: 'service', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'Services', title: 'What we build.', lede: 'Four focus areas, each with its own detailed page: approach, technology, pricing and proof.' })}
        <div class="grid grid--4" id="fintech">${SERVICES.map(serviceCard).join('')}</div>`,
    });

    const capabilities = section({
        loc: 'capabilities', body: `${sectionHead({ eyebrow: 'Engineering', title: 'One engineer across the whole stack.', lede: 'A typical product spans four layers. We design and build all of them, so the pieces fit.' })}${archStack(ARCH_LAYERS)}`,
    });

    const cases = section({
        loc: 'case-study', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'Case studies', title: 'How we built them.' })}
        <div class="grid grid--3">${WORK.map((w) => `<article class="card reveal"><span class="tag">${esc(PRODUCTS[w.product].tag)}</span><h3><a class="card__link" href="/work/${w.slug}/" data-loc="case-study">${esc(w.name)}</a></h3><p>${esc(w.lede)}</p>${link({ href: `/work/${w.slug}/`, label: 'Read the case study', loc: 'case-study' })}</article>`).join('')}</div>`,
    });

    const process = section({ id: 'process', loc: 'process', body: `${sectionHead({ eyebrow: 'How we work', title: 'Discover, architect, build, test, launch, improve.' })}${processSteps(PROCESS)}` });

    const price = section({ id: 'pricing', loc: 'pricing', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'Pricing', title: 'Transparent ranges, before the first call.', lede: 'Every project is scoped individually. These ranges show where to start.', center: true })}${pricing()}` });

    const trust = section({
        loc: 'trust', body: `${sectionHead({ eyebrow: 'Why Mobile1X', title: 'Evidence, not adjectives.' })}
        <div class="grid grid--3">
            <article class="card reveal"><h3>We ship our own products</h3><p>Notes and Dedup are live on Google Play; Notes is also on the App Store. Every claim on this site points to something you can open.</p></article>
            <article class="card reveal"><h3>Founder-led engineering</h3><p>Mobile1X is founded and led by ${FOUNDER.name}, a software engineer in ${SITE.city} with ${FOUNDER.years} years of experience. You talk to the engineer who builds your product.</p></article>
            <article class="card reveal"><h3>Prices and scope up front</h3><p>Published ranges, a written scope and a quote before work starts. Read more <a href="/about/">about Mobile1X</a>.</p></article>
        </div>`,
    });

    const faqSection = section({ id: 'faq', loc: 'faq', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'FAQ', title: 'Questions, answered.', center: true })}${faq(HOME_FAQ)}` });

    return {
        path: '/',
        html: page({
            title: 'Mobile & AI Product Engineering Studio | Mobile1X',
            description: 'Mobile1X designs, builds and launches Android and iOS apps, AI products, MVPs and fintech platforms. See our live apps and talk to an engineer.',
            path: '/',
            preload: '<link rel="preload" as="image" href="/assets/apps/notes/shot1.webp" fetchpriority="high">',
            scripts: '<script defer src="/assets/js/hero-stage.js"></script>',
            schema: [faqPage(HOME_FAQ), ...['notes', 'dedup'].map((k) => softwareApp({ slug: k, name: PRODUCTS[k].name, category: k === 'notes' ? 'ProductivityApplication' : 'UtilitiesApplication', os: k === 'notes' ? 'Android, iOS' : 'Android', description: PRODUCTS[k].summary }))],
            body: [hero, proof, services, capabilities, cases, process, price, trust, faqSection, contactSection({ source: '/' })].join('\n'),
        }),
    };
}

export function servicePage(s) {
    const trail = [{ name: 'Home', href: '/' }, { name: 'Services', href: '/#services' }, { name: s.name, href: `/services/${s.slug}/` }];
    const hero = `<section class="page-hero" data-loc="hero"><div class="container">${breadcrumbs(trail)}<p class="eyebrow">${esc(s.category)}</p><h1>${esc(s.h1)}</h1><p class="lede lede--answer">${esc(s.answer)}</p><div class="hero__actions">${CTA_TALK('hero')}${CTA_CALL('hero')}</div></div></section>`;
    const problem = section({ loc: 'problem', body: `<div class="split"><div>${sectionHead({ eyebrow: 'The problem', title: 'Where projects go wrong.' })}<p class="prose">${esc(s.problem.text)}</p></div><div class="reveal">${checks(s.problem.points.map(esc))}</div></div>` });
    const solution = section({ loc: 'solution', cls: 'section--alt', body: `<div class="split"><div>${sectionHead({ eyebrow: 'Our approach', title: 'How we solve it.' })}<p class="prose">${esc(s.solution)}</p></div><div class="reveal"><h3 class="h3">What we build</h3>${checks(s.capabilities.map(esc))}</div></div>` });
    const tech = section({ loc: 'capabilities', body: `${sectionHead({ eyebrow: 'Technology', title: 'What it’s built with.' })}<div class="grid grid--3">${s.tech.map((g) => `<div class="card reveal"><h3>${esc(g.group)}</h3><ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>` });
    const process = section({ id: 'process', loc: 'process', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'Process', title: 'From first call to launch.' })}${processSteps(PROCESS)}` });
    const price = section({ id: 'pricing', loc: 'pricing', body: `${sectionHead({ eyebrow: 'Pricing', title: 'What it costs.' })}<p class="prose reveal">${esc(PRICING_NOTE)}</p><div class="hero__actions">${CTA_TALK('pricing')}</div>` });
    const proof = section({ loc: 'case-study', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'Proof', title: 'Related work.' })}${s.proofNote ? `<p class="prose reveal">${esc(s.proofNote)}</p>` : ''}<div class="products products--compact">${s.proof.map((k) => productCard(PRODUCTS[k])).join('')}</div>` });
    const faqSection = section({ id: 'faq', loc: 'faq', body: `${sectionHead({ eyebrow: 'FAQ', title: `${s.name}: common questions.`, center: true })}${faq(s.faq)}` });
    const posts = s.posts.length ? section({ loc: 'blog', cls: 'section--alt', body: `${sectionHead({ eyebrow: 'Read more', title: 'Guides.' })}<div class="grid grid--2">${s.posts.map((p) => `<article class="card reveal"><h3><a class="card__link" href="/blog/${p}/" data-loc="blog">${esc(postBySlug[p].title)}</a></h3><p>${esc(postBySlug[p].description)}</p>${link({ href: `/blog/${p}/`, label: 'Read the guide', loc: 'blog' })}</article>`).join('')}</div>` }) : '';
    return {
        path: `/services/${s.slug}/`,
        html: page({
            title: s.title, description: s.description, path: `/services/${s.slug}/`,
            schema: [serviceSchema({ ...s, description: s.answer }), breadcrumbList(trail), faqPage(s.faq)],
            body: [hero, problem, solution, tech, process, price, proof, faqSection, posts, contactSection({ source: `/services/${s.slug}/`, title: `Talk to an engineer about ${s.name.toLowerCase()}.` })].join('\n'),
        }),
    };
}

export function workPage(w) {
    const p = PRODUCTS[w.product];
    const trail = [{ name: 'Home', href: '/' }, { name: 'Work', href: '/#portfolio' }, { name: w.name, href: `/work/${w.slug}/` }];
    const shots = p.icon ? `<div class="product__shots product__shots--hero">${p.shots.map((s, i) => phone(s, `${w.name} screenshot ${i + 1}`, { eager: i === 0 })).join('')}</div>` : `<div class="product__shots product__shots--wide">${p.shots.map((s, i) => `<img src="${s}" alt="${esc(w.name)} screenshot ${i + 1}" width="1200" height="567" loading="lazy">`).join('')}</div>`;
    const links = [p.play && btn({ href: p.play, label: 'Google Play', variant: 'ghost', loc: 'case-study' }), p.appStore && btn({ href: p.appStore, label: 'App Store', variant: 'ghost', loc: 'case-study' }), p.web && btn({ href: p.web, label: p.play ? 'Website' : 'View live', variant: 'ghost', loc: 'case-study' })].filter(Boolean).join('');
    const body = w.sections.map((sec) => `<section class="section" data-loc="case-study"><div class="container container--narrow"><h2 class="h2 reveal">${esc(sec.h)}</h2>${sec.p ? sec.p.map((t) => `<p class="prose reveal">${esc(t)}</p>`).join('') : ''}${sec.list ? checks(sec.list.map(esc)) : ''}</div></section>`).join('');
    const metrics = w.metrics.length ? `<section class="section" data-loc="case-study"><div class="container"><div class="metrics">${w.metrics.map(metricCard).join('')}</div></div></section>` : '';
    return {
        path: `/work/${w.slug}/`,
        html: page({
            title: w.title, description: w.description, path: `/work/${w.slug}/`,
            schema: [softwareApp({ slug: w.slug, name: w.name, category: w.category, os: w.os, description: w.description }), breadcrumbList(trail)],
            body: `<section class="page-hero" data-loc="hero"><div class="container">${breadcrumbs(trail)}<p class="eyebrow">Case study</p><h1>${esc(w.h1)}</h1><p class="lede lede--answer">${esc(w.lede)}</p><div class="hero__actions">${links}</div></div></section>
<section class="section section--tight" data-loc="case-study"><div class="container">${shots}</div></section>
${metrics}${body}
${contactSection({ source: `/work/${w.slug}/`, title: 'Have a similar project?', lede: 'Talk to an engineer about what you want to build. We reply within one business day.' })}`,
        }),
    };
}

const renderBlock = (b) => ({
    p: () => `<p class="prose">${esc(b.text)}</p>`,
    h2: () => `<h2 class="h2 h2--post">${esc(b.text)}</h2>`,
    ul: () => checks(b.items.map(esc)),
    table: () => `<div class="table-wrap"><table><thead><tr>${b.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`,
}[b.type]());

export function blogIndex() {
    const trail = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog/' }];
    return {
        path: '/blog/',
        html: page({
            title: 'Blog: Mobile App & AI Engineering Guides | Mobile1X', description: 'Practical guides on mobile app cost, choosing a stack, AI development and building MVPs, from Mobile1X founder Rahul Pahuja.', path: '/blog/', schema: [breadcrumbList(trail)],
            body: `<section class="page-hero" data-loc="hero"><div class="container">${breadcrumbs(trail)}<p class="eyebrow">Blog</p><h1>Engineering guides for mobile and AI products</h1><p class="lede lede--answer">Practical answers on cost, stack decisions and shipping, written by founder Rahul Pahuja.</p></div></section>
${section({ loc: 'blog', body: `<div class="grid grid--2">${POSTS.map((p) => `<article class="card reveal"><time datetime="${p.date}">${p.date}</time><h2 class="h3"><a class="card__link" href="/blog/${p.slug}/" data-loc="blog">${esc(p.title)}</a></h2><p>${esc(p.description)}</p>${link({ href: `/blog/${p.slug}/`, label: 'Read the guide', loc: 'blog' })}</article>`).join('')}</div>` })}
${contactSection({ source: '/blog/' })}`,
        }),
    };
}

export function postPage(p) {
    const svc = serviceBySlug[p.service];
    const trail = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog/' }, { name: p.title, href: `/blog/${p.slug}/` }];
    return {
        path: `/blog/${p.slug}/`,
        html: page({
            title: p.metaTitle, description: p.description, path: `/blog/${p.slug}/`, ogType: 'article', schema: [article(p), breadcrumbList(trail)],
            body: `<article><section class="page-hero" data-loc="hero"><div class="container container--narrow">${breadcrumbs(trail)}<h1>${esc(p.title)}</h1><p class="post-meta">By <a href="/about/">${FOUNDER.name}</a>, Founder · <time datetime="${p.date}">${p.date}</time></p><p class="lede lede--answer">${esc(p.answer)}</p></div></section>
<section class="section section--tight" data-loc="blog"><div class="container container--narrow">${p.body.map(renderBlock).join('\n')}
<aside class="callout"><h2 class="h3">Planning a ${esc(svc.name.toLowerCase())} project?</h2><p>Read how we approach it, or talk to an engineer.</p><div class="hero__actions">${btn({ href: `/services/${svc.slug}/`, label: svc.name, variant: 'ghost', loc: 'blog' })}${CTA_TALK('blog')}</div></aside></div></section></article>
${contactSection({ source: `/blog/${p.slug}/` })}`,
        }),
    };
}
