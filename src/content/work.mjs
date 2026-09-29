// Case studies. Only facts already published on the live site or visible in the products.
// `metrics` holds only figures supplied by the founder (downloads as of 2026-09-29); it stays empty until real outcomes exist; the page omits the block when empty.
// TODO(facts): problem statement in the team's own words, stack, timeline and outcome numbers per product.

export const WORK = [
    {
        slug: 'notes',
        product: 'notes',
        name: 'Notes',
        title: 'Notes: Private AI Notes App Case Study | Mobile1X',
        description: 'How Mobile1X built Notes, a private, local-first AI notes app live on Google Play and the App Store.',
        h1: 'Notes: a private AI brain for Android and iOS',
        category: 'ProductivityApplication',
        os: 'Android, iOS',
        lede: 'Mobile1X’s own product: a fast, distraction-free notes app for people who think faster than they type.',
        sections: [
            { h: 'The problem', p: ['Capturing an idea should take seconds, and finding it again should take fewer. Many note apps are cluttered, and many send everything to the cloud by default. Notes is built around fast capture, clean organisation and privacy.'] },
            { h: 'Context', p: ['Notes is a product Mobile1X designed, engineered and launched itself, for Android and iOS. It is our clearest example of taking an idea through design, engineering, store review and release.'] },
            { h: 'Architecture', p: ['Notes is local-first with encryption: the user’s notes live on their device and are protected there, rather than being sent to a server by default. This is the same privacy-first approach we bring to AI features in client work.'] },
            { h: 'What Mobile1X built', list: ['Instant capture and clean organisation for notes and project outlines', 'Instant search across everything the user has written', 'Archive and reflect workflows for revisiting ideas', 'AI features positioned as a private “second brain”', 'A dedicated website with guides, a blog and how-to videos'] },
            { h: 'Outcome', p: ['Notes is live on Google Play and the App Store and has reached 200 downloads, with its own website, guides and support content.'] },
        ],
        metrics: [{ value: '200', label: 'downloads' }],
    },
    {
        slug: 'dedup',
        product: 'dedup',
        name: 'Dedup',
        title: 'Dedup: Duplicate File Remover Case Study | Mobile1X',
        description: 'How Mobile1X built Dedup, an Android duplicate file remover and storage cleaner backed by a web ecosystem.',
        h1: 'Dedup: reclaiming storage on Android',
        category: 'UtilitiesApplication',
        os: 'Android',
        lede: 'Mobile1X’s own utility app: it finds and clears duplicate files so people get storage back.',
        sections: [
            { h: 'The problem', p: ['Duplicate files quietly consume phone storage, and cleaning them up by hand is slow and risky. Dedup automates the finding so the user only has to decide what to remove.'] },
            { h: 'Context', p: ['Dedup is a Mobile1X product for Android, backed by a dedicated web presence at dedup.space. iOS is planned.'] },
            { h: 'What Mobile1X built', list: ['A scanner that detects redundant files in seconds', 'A dashboard with quick scans and storage insights', 'Sign in with Google, or scan as a guest', 'A supporting website for the product'] },
            { h: 'Outcome', p: ['Dedup is live on Google Play and has reached 200 downloads. An iOS version is coming.'] },
        ],
        metrics: [{ value: '200', label: 'downloads' }],
    },
    {
        slug: 'a2z',
        product: 'a2z',
        name: 'The A2Z Collection',
        title: 'The A2Z Collection: E-commerce Case Study | Mobile1X',
        description: 'How Mobile1X built The A2Z Collection, a full e-commerce web app from browsing to checkout.',
        h1: 'The A2Z Collection: an e-commerce web app',
        category: 'ShoppingApplication',
        os: 'Web',
        lede: 'A full-featured e-commerce web app built for seamless shopping from browse to checkout.',
        sections: [
            { h: 'The problem', p: ['An online store has to make browsing easy and checkout trustworthy, and its catalogue has to keep working as it grows.'] },
            { h: 'What Mobile1X built', list: ['Intuitive navigation and product discovery', 'Product detail pages', 'A checkout designed for secure transactions', 'A catalogue structure designed for scale'] },
            { h: 'Outcome', p: ['The A2Z Collection is live at thea2zcollection.com.'] },
        ],
        metrics: [],
    },
];

export const workBySlug = Object.fromEntries(WORK.map((w) => [w.slug, w]));
