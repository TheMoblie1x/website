// Blog posts. Static URLs at /blog/<slug>/. Authored by the founder (Rahul Pahuja).
// Block types: p, h2, ul, table {head, rows}.

export const POSTS = [
    {
        slug: 'how-much-does-it-cost-to-build-a-mobile-app',
        title: 'How Much Does It Cost to Build a Mobile App?',
        metaTitle: 'How Much Does a Mobile App Cost to Build? | Mobile1X',
        description: 'What drives mobile app development cost, what a fair quote includes, and how to cut scope without hurting the product.',
        date: '2026-09-29',
        service: 'mobile-app-development',
        answer: 'Mobile app builds with Mobile1X typically range from $5,000 to $100,000+. Where a project lands depends on platforms, features, backend and integration work, and whether it includes AI or payments. A real quote comes from a written scope, not a headline number.',
        body: [
            { type: 'h2', text: 'The short answer' },
            { type: 'p', text: 'The honest range for a professionally built app is wide. At Mobile1X, product and platform builds typically run from $5,000 to $100,000+. The low end is a tightly scoped MVP; the high end is a multi-platform product with a backend, integrations and ongoing development.' },
            { type: 'h2', text: 'What moves the price' },
            { type: 'table', head: ['Cost driver', 'Why it matters'], rows: [
                ['Platforms', 'Android and iOS separately cost more than one cross-platform codebase, though native can pay back in performance.'],
                ['Feature count and depth', 'A login screen is small. Real-time features, offline mode and complex workflows are not.'],
                ['Backend and APIs', 'Most apps need a server for accounts, data and business logic. This is often as much work as the app itself.'],
                ['Third-party integrations', 'Payments, banking APIs, maps and analytics each add build and testing time.'],
                ['AI features', 'Depends on the data, whether it runs on-device or in the cloud, and how much evaluation it needs.'],
                ['Design', 'A custom design system costs more than standard components, and pays back in polish.'],
                ['Security and compliance', 'Handling money or sensitive data adds design, review and testing work.'],
            ] },
            { type: 'h2', text: 'What a good quote includes' },
            { type: 'ul', items: ['A written scope listing what is in and what is out', 'The platform decision and the reasoning behind it', 'The backend and integrations, named', 'Testing, store submission and launch support', 'What happens after launch: fixes, updates and hosting costs'] },
            { type: 'h2', text: 'How to reduce cost without hurting the product' },
            { type: 'ul', items: ['Launch one platform first if your users are concentrated on one', 'Cut features that do not test your riskiest assumption', 'Use cross-platform tools when both stores matter more than platform-specific polish', 'Build analytics in from the start so the next round of spending is informed'] },
            { type: 'h2', text: 'Get a number for your project' },
            { type: 'p', text: 'Every project we take on starts with a 30-minute discovery call and ends that stage with a written scope and quote. If you already have a rough idea, tell us what you are building and we will tell you where it is likely to land.' },
        ],
    },
    {
        slug: 'native-vs-flutter-vs-react-native',
        title: 'Native vs Flutter vs React Native: How to Choose',
        metaTitle: 'Native vs Flutter vs React Native | Mobile1X',
        description: 'A practical guide to choosing between native Android/iOS, Flutter and React Native for your product.',
        date: '2026-09-29',
        service: 'mobile-app-development',
        answer: 'Choose native when you need the deepest platform capability or top performance on one platform. Choose Flutter or React Native when one codebase for Android and iOS matters more. The right answer depends on your product, team and roadmap.',
        body: [
            { type: 'h2', text: 'The short answer' },
            { type: 'p', text: 'There is no universally best option. The decision comes down to what your app must do, how many platforms you need at launch, and who will maintain it afterwards.' },
            { type: 'h2', text: 'Side by side' },
            { type: 'table', head: ['', 'Native (Android / iOS)', 'Flutter', 'React Native'], rows: [
                ['Codebases', 'One per platform', 'One shared', 'One shared'],
                ['Platform features', 'Full and earliest access', 'Through plugins and channels', 'Through native modules'],
                ['Performance', 'Best ceiling', 'Strong for most apps', 'Strong for most apps'],
                ['Best when', 'Performance or platform APIs are central', 'Custom UI, both stores, one team', 'Web-skilled team, both stores'],
                ['Watch out for', 'Two codebases to maintain', 'Dependence on plugins for new platform features', 'Dependence on native modules for new platform features'],
            ] },
            { type: 'h2', text: 'Questions that decide it' },
            { type: 'ul', items: ['Do you need both Android and iOS at launch?', 'Does the app rely on deep platform features such as background processing, sensors or on-device AI?', 'Who will maintain the code in two years?', 'How custom does the interface need to be?'] },
            { type: 'h2', text: 'Our approach' },
            { type: 'p', text: 'We work across native Android, iOS, Flutter and React Native, so the recommendation is not driven by a single toolset. We give you the reasoning in writing before the build begins, so you can challenge it.' },
        ],
    },
];

export const postBySlug = Object.fromEntries(POSTS.map((p) => [p.slug, p]));
