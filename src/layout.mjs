// Page shell: head, header, footer, mobile action bar. Used by every generated page.
import { SITE, NAV, WHATSAPP_HREF } from './site.mjs';
import { esc, icon, sprite, btn } from './ui.mjs';
import { graph, organization, website, founder } from './schema.mjs';
import { SERVICES } from './content/services.mjs';

const header = () => `<header class="site-header" id="site-header" data-loc="header">
    <div class="container site-header__bar">
        <a class="brand" href="/" aria-label="Mobile1X home"><img src="/assets/logo.svg" alt="" width="32" height="32">Mobile1X</a>
        <nav class="nav" id="site-nav" aria-label="Primary">
            <div class="nav__group">
                <a class="nav__parent" href="/#services">Services${icon('chevron')}</a>
                <ul class="nav__menu">${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul>
            </div>
            ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join('')}
            <a class="btn btn--primary nav__cta-mobile" href="/#contact">Talk to an Engineer</a>
        </nav>
        <div class="site-header__actions">
            <a class="header-call" href="${SITE.phoneHref}" aria-label="Call Mobile1X ${SITE.phone}">${icon('phone')}<span>Call</span></a>
            <a class="btn btn--primary btn--sm site-header__cta" href="/#contact">Talk to an Engineer</a>
            <button class="nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Toggle menu">${icon('menu', 'i-open')}${icon('close', 'i-close')}</button>
        </div>
    </div>
</header>`;

const footer = () => `<footer class="site-footer" data-loc="footer">
    <div class="container footer__grid">
        <div>
            <a class="brand" href="/"><img src="/assets/logo.svg" alt="" width="32" height="32">Mobile1X</a>
            <p class="footer__about">Mobile and AI product engineering studio. We design, build and launch apps that ship.</p>
        </div>
        <nav aria-label="Services"><h2 class="footer__h">Services</h2><ul>${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul></nav>
        <nav aria-label="Company"><h2 class="footer__h">Company</h2><ul><li><a href="/about/">About</a></li><li><a href="/#portfolio">Work</a></li><li><a href="/blog/">Blog</a></li><li><a href="/#pricing">Pricing</a></li><li><a href="/#faq">FAQ</a></li></ul></nav>
        <div><h2 class="footer__h">Contact</h2><ul>
            <li><a href="${SITE.phoneHref}">${SITE.phone}</a></li>
            <li><a href="${WHATSAPP_HREF}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
            <li><a href="${SITE.calendly}" target="_blank" rel="noopener noreferrer">Book a discovery call</a></li></ul></div>
    </div>
    <div class="container footer__legal"><p>© 2026 Mobile1X. All rights reserved. Based in ${SITE.city}, ${SITE.country}, working worldwide.</p><nav aria-label="Legal"><a href="${SITE.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="${SITE.github}" target="_blank" rel="noopener noreferrer">GitHub</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><button class="link-btn" type="button" data-cookie-settings>Cookie settings</button></nav></div>
</footer>`;

const consentBanner = () => `<section class="consent" id="consent" aria-label="Cookie consent" hidden>
    <p class="consent__text"><strong>Analytics cookies.</strong> We use Google Analytics to see which pages and contact options get used. Cookies are set only if you accept. <a href="/privacy/">Privacy Policy</a></p>
    <div class="consent__actions"><button class="btn btn--ghost btn--sm" type="button" data-consent="denied">Decline</button><button class="btn btn--primary btn--sm" type="button" data-consent="granted">Accept</button></div>
</section>`;

const actionBar = () => `<div class="action-bar" role="group" aria-label="Contact Mobile1X" data-loc="sticky-bar">
    ${btn({ href: SITE.phoneHref, label: 'Call', ic: 'phone' })}
    ${btn({ href: WHATSAPP_HREF, label: 'WhatsApp', ic: 'whatsapp', variant: 'ghost' })}
</div>`;

/** Wraps page content. `path` is the canonical path, e.g. "/services/ai-development/". */
export const page = ({ title, description, path, body, schema = [], robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', ogType = 'website', preload = '' }) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${SITE.url}${path}">
    <meta name="robots" content="${robots}">
    <meta name="author" content="Mobile1X">
    <meta name="theme-color" content="#050505">
    <meta property="og:locale" content="en_US">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Mobile1X">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${SITE.url}${path}">
    <meta property="og:image" content="${SITE.url}${SITE.ogImage}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${SITE.url}${SITE.ogImage}">
    <link rel="alternate" type="text/plain" href="${SITE.url}/llms.txt" title="llms.txt">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/site.css">
    ${preload}
    <script>document.documentElement.classList.add('js')</script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=${SITE.ga4}"></script>
    <script>
    window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
    (function(){var c;try{c=localStorage.getItem('m1x-consent')}catch(e){}
    gtag('consent','default',{analytics_storage:c==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if(c==='denied')window['ga-disable-${SITE.ga4}']=true})();
    gtag('js',new Date());gtag('config','${SITE.ga4}');
    </script>
    ${graph(organization(), website(), founder(), schema)}
</head>
<body data-ga="${SITE.ga4}">
    ${sprite()}
    <a class="skip-link" href="#main">Skip to main content</a>
    ${header()}
    <main id="main">
${body}
    </main>
    ${footer()}
    ${actionBar()}
    ${consentBanner()}
    <script src="/assets/js/site.js"></script>
    <script src="/assets/js/track.js"></script>
</body>
</html>
`;
