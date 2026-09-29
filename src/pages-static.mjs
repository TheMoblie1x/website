// About, legal, utility and campaign pages.
import { SITE, PRODUCTS, WHATSAPP_HREF, FOUNDER, STACK } from './site.mjs';
import { page } from './layout.mjs';
import { SERVICES } from './content/services.mjs';
import { breadcrumbList, aboutPage } from './schema.mjs';
import { esc, btn, link, section, sectionHead, breadcrumbs, checks, contactSection, contactChannels, leadForm, icon } from './ui.mjs';

const NOINDEX = 'noindex, follow';
const hero = (trail, eyebrow, h1, lede) => `<section class="page-hero" data-loc="hero"><div class="container">${trail ? breadcrumbs(trail) : ''}<p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(h1)}</h1>${lede ? `<p class="lede lede--answer">${esc(lede)}</p>` : ''}</div></section>`;
const prose = (blocks) => `<section class="section section--tight" data-loc="content"><div class="container container--narrow">${blocks}</div></section>`;
const h2 = (t) => `<h2 class="h2 h2--post">${esc(t)}</h2>`;
const p = (t) => `<p class="prose">${t}</p>`;

export function about() {
    const trail = [{ name: 'Home', href: '/' }, { name: 'About', href: '/about/' }];
    const live = ['notes', 'dedup', 'a2z', 'pos', 'pharma'].map((k) => `<li>${PRODUCTS[k].web || PRODUCTS[k].play ? `<a href="${PRODUCTS[k].case || PRODUCTS[k].web}">${esc(PRODUCTS[k].name)}</a>` : esc(PRODUCTS[k].name)}: ${esc(PRODUCTS[k].summary)}</li>`).join('');
    // Mobile1X is a solo-founder studio. TODO(facts): company registration details (registration not done yet as of 2026-09-29).
    return {
        path: '/about/',
        html: page({
            title: 'About Mobile1X | Mobile & AI Product Engineering Studio', description: 'Mobile1X is a mobile and AI product engineering studio based in India. Learn who we are, what we have shipped and how to reach us.', path: '/about/', schema: [aboutPage(), breadcrumbList(trail)],
            body: `${hero(trail, 'About', 'We design, build and launch apps that ship.', 'Mobile1X is a mobile and AI product engineering studio based in Indore, India, working with startups, agencies and enterprises worldwide.')}
${prose(`${h2('What we do')}${p('We design, engineer and launch Android and iOS apps, AI products, MVPs and fintech platforms. You can read the detail on each service page: ' + SERVICES.map((s) => `<a href="/services/${s.slug}/">${esc(s.name)}</a>`).join(', ') + '.')}
${h2('Founder')}${p(`Mobile1X is founded and led by <strong>${FOUNDER.name}</strong>, a software engineer with ${FOUNDER.years} years of experience, based in ${SITE.city}, ${SITE.country}. Find ${FOUNDER.name.split(' ')[0]} on <a href="${FOUNDER.github}" target="_blank" rel="noopener noreferrer">GitHub</a>${FOUNDER.linkedin ? ` and <a href="${FOUNDER.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}, and the company on <a href="${SITE.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a> and <a href="${SITE.github}" target="_blank" rel="noopener noreferrer">GitHub</a>.`)}
${h2('Our engineering stack')}${p('The work spans mobile, backend, cloud and web:')}<div class="grid grid--2">${STACK.map((g) => `<div class="card"><h3>${esc(g.group)}</h3><ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
${h2('What we have shipped')}${p('The clearest evidence of what we do is the products we run ourselves. Notes and Dedup have each reached 200 downloads:')}<ul class="plain">${live}</ul>
${h2('How we work')}${p('You work directly with the founder-engineer who builds your product. Every project starts with a 30-minute discovery call and a written scope and quote before work begins. Published price ranges are on the <a href="/#pricing">pricing section</a>.')}
${h2('Company information')}<ul class="plain"><li>Name: Mobile1X</li><li>Location: ${SITE.city}, ${SITE.country}, working worldwide</li><li>Email: <a href="mailto:${SITE.email}">${SITE.email}</a></li><li>Phone and WhatsApp: <a href="${SITE.phoneHref}">${SITE.phone}</a></li><li>Discovery call: <a href="${SITE.calendly}" target="_blank" rel="noopener noreferrer">book 30 minutes</a></li></ul>`)}
${contactSection({ source: '/about/' })}`,
        }),
    };
}

const legal = (path, title, description, h1, intro, sections) => {
    const trail = [{ name: 'Home', href: '/' }, { name: h1, href: path }];
    return {
        path,
        html: page({ title, description, path, schema: [breadcrumbList(trail)], body: `${hero(trail, 'Legal', h1, intro)}${prose(sections.map(([h, t]) => h2(h) + p(t)).join('') + p(`Last updated: ${SITE.updated}.`))}` }),
    };
};

export const privacy = () => legal('/privacy/', 'Privacy Policy | Mobile1X', 'How Mobile1X collects, uses and protects information submitted through mobile1x.com.', 'Privacy Policy', 'How Mobile1X handles information on mobile1x.com.', [
    ['Who we are', `Mobile1X (“we”) operates mobile1x.com. Contact us about privacy at <a href="mailto:${SITE.email}">${SITE.email}</a>.`],
    ['Information you give us', 'When you send an inquiry through our form we receive the details you enter: your name, email address, optional phone number, project type and project description. If you contact us by email, phone or WhatsApp, we receive the information you share in that conversation. If you book a call, the booking is handled by Calendly under its own privacy policy.'],
    ['How we use it', 'We use inquiry details to reply to you, scope and quote projects and manage the resulting relationship. We do not sell your information.'],
    ['Analytics and cookies', 'We use Google Analytics (GA4) to understand how the site is used, for example which pages are viewed and which contact options are clicked. Analytics cookies are set only if you click Accept on the cookie banner. Until you choose, Google Analytics runs in a restricted, cookieless mode that sends only anonymous page-view pings, and nothing is sent once you decline. We store your choice in your browser (local storage) so we do not ask on every visit. You can change it at any time with Cookie settings in the footer.'],
    ['Service providers', 'We use Netlify to host this site, Google for the inquiry form (Google Forms), analytics (only with your consent) and fonts, and Calendly for bookings. These providers process data on our behalf under their own terms.'],
    ['Retention', 'We keep inquiry details for as long as needed to respond and manage the relationship, and for legitimate business records afterwards.'],
    ['Your choices', `You can ask us to access, correct or delete the personal information we hold about you by emailing <a href="mailto:${SITE.email}">${SITE.email}</a>.`],
    ['Changes', 'We may update this policy. The date above shows the latest version.'],
]);

export const terms = () => legal('/terms/', 'Terms of Use | Mobile1X', 'Terms governing use of the Mobile1X website and how project engagements are agreed.', 'Terms of Use', 'The terms for using mobile1x.com.', [
    ['Using this site', 'This site provides information about Mobile1X and its services. You may use it for lawful purposes. Do not attempt to disrupt the site or its security.'],
    ['No advice or guarantee', 'Content, including price ranges and cost guides, is general information, not a quote or an offer. Actual prices, timelines and deliverables are set out in a written scope and agreement for each project.'],
    ['Project work', 'Services are provided under a separate written agreement that covers scope, fees, ownership of work, confidentiality, liability and governing law. If this page conflicts with that agreement, the agreement applies.'],
    ['Intellectual property', 'The Mobile1X name, logo, site design and content belong to Mobile1X unless stated otherwise. Product names such as Notes and Dedup belong to their owners. Do not copy or reuse them without permission.'],
    ['Third-party links', 'This site links to third-party services such as Google Play, the App Store, Calendly and WhatsApp. We are not responsible for their content or practices.'],
    ['Liability', 'The site is provided “as is”. To the extent permitted by law, we are not liable for losses arising from use of this site.'],
    ['Contact', `Questions about these terms: <a href="mailto:${SITE.email}">${SITE.email}</a>.`],
]);

export function notFound() {
    return {
        path: '/404.html', indexable: false,
        html: page({
            title: 'Page not found | Mobile1X', description: 'This page could not be found.', path: '/404.html', robots: NOINDEX,
            body: `<section class="page-hero" data-loc="hero"><div class="container"><p class="eyebrow">Error 404</p><h1>That page doesn’t exist.</h1><p class="lede lede--answer">It may have moved. Try one of these, or talk to an engineer directly.</p><div class="hero__actions">${btn({ href: '/', label: 'Go to the homepage', loc: 'hero' })}${btn({ href: SITE.phoneHref, label: 'Call Mobile1X', variant: 'ghost', ic: 'phone', loc: 'hero' })}</div>
<ul class="plain plain--links">${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${esc(s.name)}</a></li>`).join('')}<li><a href="/blog/">Blog</a></li><li><a href="/about/">About</a></li></ul></div></section>`,
        }),
    };
}

/** B2B pharma platform: a real page (visible H1 and content) that links out to the live app. */
export function pharma() {
    const trail = [{ name: 'Home', href: '/' }, { name: 'Work', href: '/#portfolio' }, { name: 'B2B Pharma Platform', href: '/pharma/' }];
    return {
        path: '/pharma/',
        html: page({
            title: 'B2B Pharma Trading Platform | Mobile1X', description: 'A B2B platform by Mobile1X connecting pharmaceutical suppliers and buyers with catalogue browsing, pricing and ordering.', path: '/pharma/', schema: [breadcrumbList(trail)],
            body: `${hero(trail, 'B2B · Web', 'B2B Pharma Trading Platform', 'A platform connecting pharmaceutical suppliers and buyers, built for the operational demands of pharma trade.')}
${prose(`${h2('What it does')}${checks(['Catalogue browsing for buyers', 'Pricing visibility for suppliers and buyers', 'Ordering built for procurement at scale'])}<div class="hero__actions">${btn({ href: 'https://m1x-druglist.netlify.app/', label: 'Open the platform', arrow: true, loc: 'case-study' })}</div>`)}
${contactSection({ source: '/pharma/', title: 'Need a B2B platform?' })}`,
        }),
    };
}

export const MAGNETS = [
    { slug: 'free-ai-project-assessment', name: 'Free AI Project Assessment', h1: 'Get a free assessment of your AI project', lede: 'Tell us the AI feature you want to build. An engineer reviews it and tells you what is practical, what it needs and where the risks are.', gets: ['Whether the idea is feasible with your data', 'On-device versus cloud recommendation', 'Main risks and unknowns', 'A rough scope to discuss'], fit: 'Best for teams with a defined use case and a real budget.', button: 'Request my assessment' },
    { slug: 'free-mobile-app-architecture-review', name: 'Free Mobile App Architecture Review', h1: 'Get a free architecture review of your mobile app', lede: 'Share your app or codebase overview. An engineer reviews the architecture and points out the biggest risks to performance, security and maintainability.', gets: ['Review of structure and stack choices', 'Top risks to scale, speed and security', 'Fix, refactor or rebuild guidance'], fit: 'Best for apps already in production or in late development.', button: 'Request my review' },
    { slug: 'free-mvp-cost-scope-assessment', name: 'Free MVP Cost & Scope Assessment', h1: 'Find out what your MVP should include, and cost', lede: 'Describe your idea. We help you define the smallest release that tests it and give you a scoped estimate to plan around.', gets: ['A proposed MVP scope', 'What to defer to later releases', 'A written estimate range for the scope'], fit: 'Best for founders ready to start building within a few months.', button: 'Get my MVP estimate' },
    { slug: 'mobile-app-performance-audit', name: 'Mobile App Performance Audit', h1: 'Find out why your app is slow', lede: 'Tell us about your app and what feels slow. An engineer reviews it and identifies where speed is being lost and what to fix first.', gets: ['Where time is being lost', 'Prioritised fixes', 'Guidance on effort involved'], fit: 'Best for apps with real users and a performance problem.', button: 'Request my audit' },
];

export function magnet(m) {
    const path = `/${m.slug}/`;
    return {
        path, indexable: false,
        html: page({
            title: `${m.name} | Mobile1X`, description: m.lede, path, robots: NOINDEX,
            body: `${hero(null, 'Free assessment', m.h1, m.lede)}
${section({ loc: 'lead-magnet', body: `<div class="contact"><div class="reveal"><h2 class="h2">What you get</h2>${checks(m.gets.map(esc))}<p class="prose">${esc(m.fit)}</p><h3 class="h3">What happens next</h3><ol class="plain plain--ordered"><li>You send the short form.</li><li>An engineer reads it and replies, usually within one business day.</li><li>If it looks like a fit, we book a call to go through the findings.</li></ol></div>${leadForm({ source: path, heading: m.name, button: m.button })}</div>` })}`,
        }),
    };
}
