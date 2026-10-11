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
const h3 = (t) => `<h3 class="h3">${esc(t)}</h3>`;
const ul = (items) => `<ul class="plain plain--bulleted">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const ext = (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;

export function about() {
    const trail = [{ name: 'Home', href: '/' }, { name: 'About', href: '/about/' }];
    const live = ['notes', 'dedup', 'a2z', 'pos', 'pharma', 'bhashasetu'].map((k) => `<li>${PRODUCTS[k].web || PRODUCTS[k].play ? `<a href="${PRODUCTS[k].case || PRODUCTS[k].web}">${esc(PRODUCTS[k].name)}</a>` : esc(PRODUCTS[k].name)}: ${esc(PRODUCTS[k].summary)}</li>`).join('');
    // Mobile1X is a solo-founder studio. TODO(facts): company registration details (registration not done yet as of 2026-09-29).
    return {
        path: '/about/',
        html: page({
            title: 'About Mobile1X | Mobile & SI Product Engineering Studio', description: 'Mobile1X is a mobile and SI product engineering studio based in India. Learn who we are, what we have shipped and how to reach us.', path: '/about/', schema: [aboutPage(), breadcrumbList(trail)],
            body: `${hero(trail, 'About', 'We design, build and launch apps that ship.', 'Mobile1X is a mobile and SI product engineering studio based in Indore, India, working with startups, agencies and enterprises worldwide.')}
${prose(`${h2('What we do')}${p('We design, engineer and launch Android and iOS apps, SI products, MVPs and fintech platforms. You can read the detail on each service page: ' + SERVICES.map((s) => `<a href="/services/${s.slug}/">${esc(s.name)}</a>`).join(', ') + '.')}
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
        html: page({ title, description, path, schema: [breadcrumbList(trail)], body: `${hero(trail, 'Legal', h1, intro)}${prose(sections.map(([h, t]) => h2(h) + (Array.isArray(t) ? t.join('') : p(t))).join('') + p(`Last updated: ${SITE.updated}.`))}` }),
    };
};

/** What the consent-gated analytics collect. Each line traces to assets/js/site.js or assets/js/track.js. */
const ANALYTICS = [
    p('We use Google Analytics (GA4) to understand how the site is used, for example which pages are viewed and which contact options are clicked. Analytics cookies are set only if you click Accept on the cookie banner. Until you choose, Google Analytics runs in a restricted, cookieless mode that sends only anonymous page-view pings, and nothing is sent once you decline. We store your choice in your browser (local storage) so we do not ask on every visit.'),
    h3('What we measure'),
    p('After you accept, the site records how it is used. This is the full list:'),
    ul([
        'which pages you view, how far you scroll, which sections of a page you see and for how long, and how long you are actively engaged;',
        'how far through a guide or blog post you read;',
        'which links and buttons you click: phone, WhatsApp, email and booking links, App Store and Google Play links (with which app and which store), links to other sites, file downloads and menu links;',
        'which FAQ questions you open, and what you choose in the product showcase on the home page (which product, pause, spin);',
        'when you rest the mouse on a card or plan, and when you select or copy a passage of text (we record only how long it was and where on the page, never the text);',
        'how you use the contact form: whether you start it, which fields you complete, how long you spend in each field, corrections, validation errors, how long it takes, and whether you abandon it (we record field names and the option you pick in a dropdown such as project type or budget, never what you type into a text field);',
        'problems: script errors, pages that were not found (the address requested and the site you came from), and repeated rapid clicks on one spot;',
        'how soon you first interact with a page and when you return to the tab after being away.',
    ]),
    p('Every event also carries the page address. Google Analytics adds its standard information, such as your device and browser type, approximate location and the site or campaign that referred you. If you arrive through a tagged link, its campaign parameters (utm_source and similar) and the page you send an inquiry from are added to your inquiry so we know where it came from.'),
    h3('Microsoft Clarity'),
    p('With the same consent we also use Microsoft Clarity, which records how visitors use pages (clicks, scrolling and mouse movement) as session replays and heatmaps so we can improve the site. Clarity is not loaded and sets no cookies until you click Accept, and it is never loaded if you decline.'),
    p('You can change it at any time with Cookie settings in the footer.'),
];

/** What search engines and AI assistants can see, and how we help them find it. */
const SEARCH_AND_AI = [
    p('This site is public. We publish a sitemap (<a href="/sitemap.xml">sitemap.xml</a>), a crawler policy (<a href="/robots.txt">robots.txt</a>) and a plain-text summary for language models (<a href="/llms.txt">llms.txt</a>), and we mark up pages with structured data (schema.org) describing our company, services, apps and articles. Search engines and AI assistants, including those named in robots.txt, are welcome to read, index, quote and summarise these public pages. We do not control how third parties use what they collect.'),
    p('Pages that are not meant to appear in search, such as the free-assessment landing pages, are marked noindex. We use Google Search Console to see how the site performs in search; it reports aggregated queries, impressions and clicks and does not tell us who searched.'),
];

/** Google's own Tag Manager terms, reproduced as Google publishes them; "we" in the last block is Google. */
const GTM_TERMS = [
    p(`By clicking “Yes” below or by using the Google Tag Manager service (the “Service”), you and the legal entity on whose behalf you are using the Service (if any) (together, “You”) agree to use the Service in accordance with the Google Terms of Service (located at ${ext('https://www.google.com/intl/en/policies/terms/')}), the Google Privacy Policy (located at ${ext('https://www.google.com/intl/en/policies/privacy/')}), and the Google Tag Manager Use Policy (located at ${ext('https://www.google.com/analytics/tag-manager/use-policy/')}), each as may be modified from time to time and collectively, the “Google Tag Manager Terms of Service.”`),
    h3('Google Tag Manager Use Policy'),
    p('Use of the Google Tag Manager (the “Service”) is subject to this Google Tag Manager Use Policy (the “GTM Use Policy”).'),
    p(`If You use the Service to support products or services from a 3rd party or designed by You (together, “3rd Party Tags”) or Google, You will have and abide by an appropriate privacy policy and will comply with the EU user consent policy (located at ${ext('https://www.google.com/about/company/user-consent-policy.html')}) and all applicable agreements and regulations (also relating to the collection of information), including for example:`),
    ul([`the Google Analytics Terms of Service located at: ${ext('https://www.google.com/analytics/terms/us.html')},`, 'the agreement between You and Google that is in effect during the dates that You are participating in the Service, and', 'the Google LLC Advertising Program Terms (or, if applicable, as negotiated).']),
    p('If You have 3rd Party Tags delivered through the Service:'),
    ul(['Google is not responsible for 3rd Party Tags.', 'Google may screen such 3rd Party Tags to ensure compliance with this GTM Use Policy.', 'You guarantee that You have the rights to upload the 3rd Party Tags.']),
    p('You agree not to, and not to allow third parties to use the Service or interfaces provided with the Service:'),
    ul(['to engage in or promote any unlawful, infringing, defamatory or otherwise harmful activity;', 'to disable, interfere with or circumvent any aspect of the Service;', 'to upload any data to Google Tag Manager that personally identifies an individual (such as a name, email address or billing information), or other data which can be reasonably linked to such information by Google, or', 'to access any other Google product or service in a manner that violates their respective terms.']),
    p(`Your use of the Platform Home is subject to the Platform Home Additional Terms available at ${ext('https://support.google.com/marketingplatform/answer/9047313')} (or such other URL as Google may provide) and as modified from time to time (the “Platform Home Terms”).`),
    p(`To the extent Your use of the Service is within scope, You and Google agree to the Google Ads Data Processing Terms at ${ext('https://privacy.google.com/businesses/processorterms')} (the “Processing Terms”). Google will not modify the Processing Terms, except as expressly permitted under the Processing Terms.`),
    h3('Our use of Google Tag Manager data'),
    p('We may collect information such as how the Service is used, and how and what tags are deployed. We may use this data to improve, maintain, protect and develop the Service as described in our privacy policy, but we will not share this data with any other Google product without Your consent.'),
    p('Google Tag Manager terms last updated: July 24, 2018.'),
];

export const privacy = () => legal('/privacy/', 'Privacy Policy | Mobile1X', 'How Mobile1X collects, uses and protects information on mobile1x.com: inquiries, consent-based analytics, Clarity, Tag Manager and search crawlers.', 'Privacy Policy', 'How Mobile1X handles information on mobile1x.com.', [
    ['Who we are', `Mobile1X (“we”) operates mobile1x.com. Contact us about privacy at <a href="mailto:${SITE.email}">${SITE.email}</a>.`],
    ['Information you give us', 'When you send an inquiry through our form we receive the details you enter: your name, email address, optional phone number, project type and project description. If you contact us by email, phone or WhatsApp, we receive the information you share in that conversation. If you book a call, the booking is handled by Calendly under its own privacy policy.'],
    ['How we use it', 'We use inquiry details to reply to you, scope and quote projects and manage the resulting relationship. We do not sell your information.'],
    ['Analytics and cookies', ANALYTICS],
    ['Search engines and AI assistants', SEARCH_AND_AI],
    ['Google Tag Manager', GTM_TERMS],
    ['Service providers', 'We use Netlify to host this site, Google for the inquiry form (Google Forms), analytics (only with your consent) and fonts, Microsoft for Clarity session analytics (only with your consent), and Calendly for bookings. These providers process data on our behalf under their own terms.'],
    ['Retention', 'We keep inquiry details for as long as needed to respond and manage the relationship, and for legitimate business records afterwards.'],
    ['Your choices', `You can ask us to access, correct or delete the personal information we hold about you by emailing <a href="mailto:${SITE.email}">${SITE.email}</a>.`],
    ['Changes', 'We may update this policy. The date above shows the latest version.'],
]);

export const terms = () => legal('/terms/', 'Terms of Use | Mobile1X', 'Terms for using the Mobile1X website and how project engagements are agreed: scope, fees and ownership of work are set in a written agreement.', 'Terms of Use', 'The terms for using mobile1x.com.', [
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
    { slug: 'free-ai-project-assessment', name: 'Free SI Project Assessment', h1: 'Get a free assessment of your SI project', lede: 'Tell us the SI feature you want to build. An engineer reviews it and tells you what is practical, what it needs and where the risks are.', gets: ['Whether the idea is feasible with your data', 'On-device versus cloud recommendation', 'Main risks and unknowns', 'A rough scope to discuss'], fit: 'Best for teams with a defined use case and a real budget.', button: 'Request my assessment' },
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
