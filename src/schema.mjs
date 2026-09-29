// JSON-LD builders. Every block describes content that is visible on the same page.
import { SITE, FOUNDER, STACK } from './site.mjs';

const ORG_ID = `${SITE.url}/#org`;
const FOUNDER_ID = `${SITE.url}/about/#founder`;
const abs = (path) => (path.startsWith('http') ? path : SITE.url + path);

export const organization = () => ({
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORG_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: abs('/assets/logo.svg'),
    description: 'Mobile1X is a mobile and AI product engineering studio. It designs, builds and launches Android, iOS and web products, AI systems and fintech platforms, and ships its own apps including Notes and Dedup.',
    email: SITE.email,
    telephone: '+91-97545-25494',
    priceRange: '$500 - $100,000+',
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    foundingLocation: { '@type': 'Place', name: `${SITE.city}, ${SITE.country}` },
    address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: 'IN' },
    founder: { '@id': FOUNDER_ID },
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: SITE.email, telephone: '+91-97545-25494', availableLanguage: ['English', 'Hindi'] }],
});

export const founder = () => ({
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: FOUNDER.name,
    jobTitle: FOUNDER.title,
    description: `${FOUNDER.name} is the founder of Mobile1X, a software engineer with ${FOUNDER.years} years of experience.`,
    url: abs('/about/'),
    worksFor: { '@id': ORG_ID },
    address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressCountry: 'IN' },
    knowsAbout: STACK.flatMap((g) => g.items),
    sameAs: [FOUNDER.github, FOUNDER.linkedin].filter(Boolean),
});

export const website = () => ({ '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: `${SITE.url}/`, name: SITE.name, publisher: { '@id': ORG_ID }, inLanguage: 'en' });

export const breadcrumbList = (trail) => ({
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.href) })),
});

export const service = (s) => ({
    '@type': 'Service',
    name: s.name,
    serviceType: s.name,
    description: s.description,
    url: abs(`/services/${s.slug}/`),
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
});

export const faqPage = (items) => ({
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const article = (p) => ({
    '@type': 'Article',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.modified || p.date,
    mainEntityOfPage: abs(`/blog/${p.slug}/`),
    author: { '@id': FOUNDER_ID },
    publisher: { '@id': ORG_ID },
    image: abs(SITE.ogImage),
});

export const softwareApp = (w) => ({
    '@type': 'SoftwareApplication',
    name: w.name,
    applicationCategory: w.category,
    operatingSystem: w.os,
    description: w.description,
    url: abs(`/work/${w.slug}/`),
    publisher: { '@id': ORG_ID },
});

export const aboutPage = () => ({ '@type': 'AboutPage', name: `About ${SITE.name}`, url: abs('/about/'), about: { '@id': ORG_ID } });

export const graph = (...nodes) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.flat() })}</script>`;
