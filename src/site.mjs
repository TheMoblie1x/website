// Single source of truth for company facts, URLs and navigation.
// Every page, schema block, sitemap and llms.txt is generated from this + src/content/*.

export const SITE = {
    name: 'Mobile1X',
    url: 'https://mobile1x.com',
    email: 'hello@mobile1x.com',
    phone: '+91 97545 25494',
    phoneHref: 'tel:+919754525494',
    whatsappText: 'Hi Mobile1X, I want to discuss a software project.',
    calendly: 'https://calendly.com/themobile1x/30min',
    ga4: 'G-FTJGYFC2BV',
    country: 'India',
    city: 'Indore',
    region: 'Madhya Pradesh',
    linkedin: 'https://www.linkedin.com/company/the-mobile1x/',
    updated: '2026-09-29',
    // Real profile URLs go here once they exist; empty entries are dropped from schema.
    github: 'https://github.com/TheMoblie1x',
    sameAs: ['https://www.linkedin.com/company/the-mobile1x/', 'https://github.com/TheMoblie1x'],
    ogImage: '/assets/apps/notes/shot1.png',
};

export const FOUNDER = {
    name: 'Rahul Pahuja',
    title: 'Founder',
    years: 12,
    github: 'https://github.com/rahulpahuja',
    linkedin: 'https://www.linkedin.com/in/therahulpahuja/',
};

// The engineering stack the team works in, as stated by the founder.
export const STACK = [
    { group: 'Mobile', items: ['Kotlin', 'Java', 'Swift', 'Objective-C', 'Flutter', 'React Native'] },
    { group: 'Backend and data', items: ['Spring Boot', 'SQL', 'SQLite'] },
    { group: 'Cloud and edge', items: ['AWS', 'Firebase', 'Cloudflare'] },
    { group: 'Web and desktop', items: ['React JS', 'ElectronJS', 'HTML', 'CSS', 'JavaScript'] },
];

export const WHATSAPP_HREF = `https://wa.me/919754525494?text=${encodeURIComponent(SITE.whatsappText)}`;

export const PRODUCTS = {
    notes: {
        name: 'Notes',
        tag: 'Android · iOS',
        summary: 'A private, local-first AI notes app for Android and iOS.',
        play: 'https://play.google.com/store/apps/details?id=com.rp.notes',
        appStore: 'https://apps.apple.com/us/app/notes-archive-reflect/id6798175378',
        web: '/notes/',
        icon: '/assets/apps/notes/icon.webp',
        shots: ['/assets/apps/notes/shot1.webp', '/assets/apps/notes/shot2.webp', '/assets/apps/notes/shot3.webp'],
        case: '/work/notes/',
    },
    dedup: {
        name: 'Dedup',
        tag: 'Android · iOS coming soon',
        summary: 'A duplicate file remover and storage cleaner for Android.',
        play: 'https://play.google.com/store/apps/details?id=com.rp.dedup',
        web: 'https://www.dedup.space',
        icon: '/assets/apps/dedup/icon.webp',
        shots: ['/assets/apps/dedup/shot1.webp', '/assets/apps/dedup/shot2.webp', '/assets/apps/dedup/shot3.webp'],
        case: '/work/dedup/',
    },
    a2z: {
        name: 'The A2Z Collection',
        tag: 'E-commerce · Web',
        summary: 'A full-featured e-commerce web app, from browse to checkout.',
        web: 'https://thea2zcollection.com',
        shots: ['/assets/a2z/home.webp', '/assets/a2z/product.webp'],
        case: '/work/a2z/',
    },
    pos: {
        name: 'POS System',
        tag: 'Retail · Web',
        summary: 'Point-of-sale software: fast billing, inventory and sales reporting.',
        web: 'https://a2zpos.netlify.app',
    },
    pharma: {
        name: 'B2B Pharma Platform',
        tag: 'B2B · Web',
        summary: 'Connects pharmaceutical suppliers and buyers: catalogue, pricing, ordering.',
        web: '/pharma/',
    },
    auction: {
        name: 'Auction Manager',
        tag: 'Sports · Web',
        summary: 'A real-time command centre for IPL-style player auctions.',
    },
};

export const SERVICE_ORDER = ['mobile-app-development', 'ai-development', 'mvp-development', 'fintech-development'];

export const NAV = [
    { label: 'Work', href: '/#portfolio' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Blog', href: '/blog/' },
    { label: 'About', href: '/about/' },
];
