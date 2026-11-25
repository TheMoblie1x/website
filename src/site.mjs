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
    ga4: 'G-PYSXJKMRQV',
    gtm: 'GTM-N6PJHVXT',
    clarity: 'yw03jhbkgs',
    country: 'India',
    city: 'Indore',
    region: 'Madhya Pradesh',
    linkedin: 'https://www.linkedin.com/company/the-mobile1x/',
    updated: '2026-10-11',
    // Real profile URLs go here once they exist; empty entries are dropped from schema.
    github: 'https://github.com/TheMoblie1x',
    sameAs: ['https://www.linkedin.com/company/the-mobile1x/', 'https://github.com/TheMoblie1x'],
    ogImage: '/assets/apps/notes/shot1.png',
    ogImageAlt: 'Mobile1X Notes app on an Android phone',
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

/** Logo file (assets/tech/*.svg) per STACK item. Logos are from Simple Icons (CC0); SQL and Objective-C are generic glyphs drawn for this site. */
export const TECH_ICON = {
    'Kotlin': 'kotlin', 'Java': 'java', 'Swift': 'swift', 'Objective-C': 'objc', 'Flutter': 'flutter', 'React Native': 'react',
    'Spring Boot': 'springboot', 'SQL': 'sql', 'SQLite': 'sqlite', 'AWS': 'aws', 'Firebase': 'firebase', 'Cloudflare': 'cloudflare',
    'React JS': 'react', 'ElectronJS': 'electron', 'HTML': 'html5', 'CSS': 'css3', 'JavaScript': 'javascript',
};

/** Store listings of a product, for structured data and llms.txt. */
export const storeLinks = (p) => [p.play && { name: 'Google Play', url: p.play }, p.appStore && { name: 'App Store', url: p.appStore }].filter(Boolean);

export const WHATSAPP_HREF = `https://wa.me/919754525494?text=${encodeURIComponent(SITE.whatsappText)}`;

// Traction figures supplied by the founder (not independently verified in this repo). Update here only; the hero strip reads from this.
export const TRACTION = [
    { value: '4,900+', label: 'Global users' },
    { value: '60+', label: 'Countries reached' },
    { value: '3', label: 'Live production platforms & apps' },
];

/** Every Mobile1X product, each at its own short URL: mobile1x.com/<slug>. Routing lives in netlify.toml (proxies/redirects) and the static folders. */
export const SUITE = [
    { slug: 'notes', name: 'Notes', cat: 'Android · iOS', text: 'A private, local-first AI notes app.', icon: '/assets/apps/notes/icon.webp' },
    { slug: 'dedup', name: 'Dedup', cat: 'Android · iOS', text: 'Duplicate file remover and storage cleaner.', icon: '/assets/apps/dedup/icon.webp' },
    { slug: 'commerce', name: 'Commerce by Mobile1X', cat: 'E-commerce', text: 'Full-featured e-commerce, browse to checkout.', icon: '/assets/apps/commerce/icon.svg' },
    { slug: 'pos', name: 'POS System', cat: 'Billing', text: 'Fast billing, inventory and sales reporting.', icon: '/assets/apps/pos/icon.svg' },
    { slug: 'pharma', name: 'B2B Pharma', cat: 'Marketplace', text: 'Connects pharma suppliers and buyers.', icon: '/assets/apps/pharma/icon.svg' },
    { slug: 'auction', name: 'Auction Manager', cat: 'Real-time', text: 'Command centre for IPL-style player auctions.', icon: '/assets/apps/auction/icon.svg' },
    { slug: 'bhashasetu', name: 'BhashaSetu', cat: 'Learning', text: 'Hindi-first spoken English practice.', icon: '/assets/apps/bhashasetu/icon.svg' },
    { slug: 'crm', name: 'Mobile1X CRM', cat: 'CRM', text: 'Customer relationship management.', icon: '/assets/apps/crm/icon.svg' },
    { slug: 'collab', name: 'Collab', cat: 'Tasks', text: 'Task and kanban collaboration.', icon: '/assets/apps/collab/icon.svg' },
    { slug: 'resto', name: 'Resto by Mobile1X', cat: 'Restaurant', text: 'Restaurant software.', icon: '/assets/apps/resto/icon.svg' },
    { slug: 'tmt', name: 'TakeMyTest', cat: 'Hiring', text: 'Online assessments for hiring.', icon: '/assets/apps/tmt/icon.svg' },
];

export const PRODUCTS = {
    notes: {
        name: 'Notes',
        tag: 'Android · iOS',
        summary: 'A private, local-first AI notes app for Android and iOS.',
        play: 'https://play.google.com/store/apps/details?id=com.rp.notes',
        appStore: 'https://apps.apple.com/us/app/notes-voice-record-ai/id6798175378',
        web: '/notes/',
        icon: '/assets/apps/notes/icon.webp',
        shots: ['/assets/apps/notes/shot1.webp', '/assets/apps/notes/shot2.webp', '/assets/apps/notes/shot3.webp'],
        flagship: { badges: ['300+ Users', '30+ Countries'], highlight: 'Offline-first AI voice notes suite with on-device Whisper transcription, OCR, and biometric encryption.' },
        case: '/work/notes/',
    },
    dedup: {
        name: 'Dedup',
        tag: 'Android · iOS',
        summary: 'A duplicate file remover and storage cleaner for Android and iPhone.',
        play: 'https://play.google.com/store/apps/details?id=com.rp.dedup',
        appStore: 'https://apps.apple.com/us/app/dedup-duplicate-photo-cleaner/id6814824281',
        web: 'https://www.dedup.space',
        icon: '/assets/apps/dedup/icon.webp',
        shots: ['/assets/apps/dedup/shot1.webp', '/assets/apps/dedup/shot2.webp', '/assets/apps/dedup/shot3.webp'],
        flagship: { badges: ['600+ Users', '60+ Countries'], highlight: '100% on-device ML duplicate photo & media cleaner for iOS & Android with zero telemetry.' },
        case: '/work/dedup/',
    },
    a2z: {
        name: 'The A2Z Collection',
        tag: 'E-commerce · Web',
        summary: 'A full-featured e-commerce web app, from browse to checkout.',
        web: 'https://thea2zcollection.com',
        shots: ['/assets/a2z/home.webp', '/assets/a2z/product.webp', '/assets/a2z/listing.webp', '/assets/a2z/checkout.webp', '/assets/a2z/cart.webp', '/assets/a2z/reviews.webp', '/assets/a2z/footer.webp'],
        flagship: { title: 'Commerce by Mobile1X', badges: ['4,000+ Users', '43 Countries'], highlight: 'High-volume production e-commerce platform built and powered by Mobile1X serving shoppers across 43 countries, featuring Razorpay checkout, Cloudflare R2 media delivery, OTP authentication, and automated logistics integration.' },
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
    bhashasetu: {
        name: 'BhashaSetu',
        tag: 'Education · Web',
        summary: 'A Hindi-first web app for practising spoken English: listen and repeat phrases, answer by voice or in writing, and build a daily streak.',
        web: '/english/',
    },
    auction: {
        name: 'Auction Manager',
        tag: 'Sports · Web',
        summary: 'A real-time command centre for IPL-style player auctions.',
        web: 'https://thempl.netlify.app/',
    },
};

export const SERVICE_ORDER = ['mobile-app-development', 'ai-development', 'mvp-development', 'fintech-development'];

export const NAV = [
    { label: 'Store Platform', href: '/ecommerce-store-platform/' },
    { label: 'Work', href: '/home/#portfolio' },
    { label: 'Blog', href: '/blog/' },
    { label: 'About', href: '/about/' },
];
