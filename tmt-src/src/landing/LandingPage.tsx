import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Check,
  FileSpreadsheet,
  Palette,
  ShieldCheck,
  Timer,
  UserCog,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { WaitlistForm } from './WaitlistForm';

/*
  Copy rule for this page: say only what the product does today. No claims about AI detection,
  security certifications, uptime, customer counts or pricing.
*/

const FEATURES: { icon: React.ReactNode; title: string; text: string }[] = [
  {
    icon: <Briefcase className="w-5 h-5" aria-hidden="true" />,
    title: 'A test for every role',
    text: 'Group assessments by job role, copy one as a starting point for the next, and keep them organised.',
  },
  {
    icon: <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />,
    title: 'Mixed question types',
    text: 'Single choice, multiple choice, true or false, short answer and written answers. Import questions from Excel.',
  },
  {
    icon: <Timer className="w-5 h-5" aria-hidden="true" />,
    title: 'Timed sections',
    text: 'Give each section its own timer. Optionally lock sections in order and apply negative marking.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" aria-hidden="true" />,
    title: 'Integrity checks',
    text: 'Flags tab switching and leaving full screen during a test, with an optional webcam check before it starts.',
  },
  {
    icon: <UserCog className="w-5 h-5" aria-hidden="true" />,
    title: 'Roles for your team',
    text: 'Owners run the account, managers build and publish tests, and evaluators review submissions.',
  },
  {
    icon: <Palette className="w-5 h-5" aria-hidden="true" />,
    title: 'Your brand, not ours',
    text: "Candidates see your company's name and logo throughout the test.",
  },
];

const STEPS = [
  { n: '1', title: 'Build the test', text: 'Pick the role, add sections with time limits, then write or import the questions.' },
  { n: '2', title: 'Run it', text: 'Candidates take it in the browser, one section at a time, with the rules you chose.' },
  { n: '3', title: 'Review together', text: 'Look through submissions and scores with your team, each person with the right access.' },
];

const FAQ = [
  {
    q: 'Who is it for?',
    a: 'Hiring teams, recruitment agencies and training providers who need to test people on specific skills.',
  },
  {
    q: 'When can I start?',
    a: "We're inviting companies in small groups. We'll email you when it's your turn.",
  },
  {
    q: 'How much will it cost?',
    a: "Pricing isn't final yet. People on the waitlist hear first.",
  },
  {
    q: "Will candidates see my company's branding?",
    a: "Yes. The candidate screens use your company's name and logo.",
  },
];

const EXAMPLE_SECTIONS = [
  { title: 'Kotlin fundamentals', meta: '6 questions · 15 min' },
  { title: 'Android architecture', meta: '4 questions · 20 min' },
  { title: 'Problem solving', meta: '2 questions · 10 min' },
];

export const LandingPage: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <div className="min-h-screen bg-white text-ink">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-ink focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
    >
      Skip to content
    </a>

    <header className="border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <BrandMark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden md:block px-3 py-2 text-sm font-semibold text-slate-600 hover:text-ink">
            How it works
          </a>
          <a href="#features" className="hidden md:block px-3 py-2 text-sm font-semibold text-slate-600 hover:text-ink">
            Features
          </a>
          <a href="#faq" className="hidden md:block px-3 py-2 text-sm font-semibold text-slate-600 hover:text-ink">
            FAQ
          </a>
          <button
            type="button"
            onClick={onSignIn}
            className="px-3 min-h-11 inline-flex items-center text-sm font-semibold text-slate-700 hover:text-ink cursor-pointer"
          >
            Sign in
          </button>
          <a
            href="#waitlist"
            className="px-4 min-h-11 inline-flex items-center bg-ink hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Join the waitlist
          </a>
        </nav>
      </div>
    </header>

    <main id="main">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-start">
          <div>
            <p className="inline-block text-[13px] font-semibold text-accent bg-accent-soft border border-accent-line rounded-full px-3 py-1">
              Early access
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              Hiring assessments, built for every role you hire for
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
              Set up a timed test for each job, run it in the browser, and review the results with your team. We&apos;re
              opening early access to a small group of companies first.
            </p>
            <ul className="mt-8 space-y-3 text-[15px] text-slate-700">
              {['A separate test for each job role', 'Section timers and marking rules you control', 'Owner, manager and evaluator roles'].map(
                (t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                    {t}
                  </li>
                )
              )}
            </ul>
          </div>

          <div id="waitlist" className="scroll-mt-6 relative bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight">Get early access</h2>
            <p className="text-sm text-slate-600 mt-1.5 mb-6">Join the waitlist and we&apos;ll email you when it&apos;s your turn.</p>
            <WaitlistForm idPrefix="hero" />
          </div>
        </div>
      </section>

      {/* Product example */}
      <section aria-labelledby="example-title" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 id="example-title" className="text-3xl font-bold tracking-tight">
            One place for every test
          </h2>
          <p className="mt-3 text-slate-600 text-lg leading-relaxed">
            Each assessment shows its sections, time and rules at a glance, so anyone on the team can see how a candidate
            will be tested.
          </p>
        </div>

        <figure className="mt-10">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <p className="text-[13px] text-slate-500">Android Developer · 12 questions · 3 sections · 45 min</p>
              <p className="text-xl font-semibold mt-1">Android Developer Screening</p>
            </div>
            <div className="grid sm:grid-cols-[1.2fr_1fr] sm:divide-x divide-slate-200">
              <ul className="divide-y divide-slate-100">
                {EXAMPLE_SECTIONS.map((s, i) => (
                  <li key={s.title} className="px-6 py-4 flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold">
                      {i + 1}. {s.title}
                    </span>
                    <span className="text-[13px] text-slate-500 tabular-nums shrink-0">{s.meta}</span>
                  </li>
                ))}
              </ul>
              <ul className="divide-y divide-slate-100 border-t sm:border-t-0 border-slate-200">
                {[
                  ['Lock sections in order', true],
                  ['Negative marking', true],
                  ['Published', false],
                ].map(([label, on]) => (
                  <li key={String(label)} className="px-6 py-4 flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">{label as string}</span>
                    <span className="text-[13px] font-semibold text-slate-600">{on ? 'On' : 'Off'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <figcaption className="mt-3 text-[13px] text-slate-500">An example assessment, shown with sample data.</figcaption>
        </figure>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="bg-slate-50 border-y border-slate-200 scroll-mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 id="how-title" className="text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-white border border-slate-200 rounded-xl p-6">
                <span className="w-8 h-8 rounded-full bg-ink text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">
                  <span className="sr-only">Step {s.n}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-title" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 scroll-mt-4">
        <h2 id="features-title" className="text-3xl font-bold tracking-tight">
          What you can do today
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <article key={f.title} className="border border-slate-200 rounded-xl p-6">
              <span className="w-10 h-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="bg-slate-50 border-y border-slate-200 scroll-mt-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 id="faq-title" className="text-3xl font-bold tracking-tight">
            Questions
          </h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[17px] font-semibold">
                  {f.q}
                  <ArrowRight
                    className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="cta-title" className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 id="cta-title" className="text-3xl sm:text-4xl font-bold tracking-tight">
              Be among the first to try it
            </h2>
            <p className="mt-4 text-slate-300 text-lg leading-relaxed max-w-md">
              Leave your email and we&apos;ll let you know as soon as there&apos;s room for your team.
            </p>
          </div>
          <div className="bg-white text-ink rounded-2xl p-6 sm:p-8">
            <WaitlistForm idPrefix="footer" compact />
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span>© {new Date().getFullYear()}</span>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="px-3 min-h-11 inline-flex items-center font-semibold text-slate-700 hover:text-ink cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </footer>
  </div>
);
