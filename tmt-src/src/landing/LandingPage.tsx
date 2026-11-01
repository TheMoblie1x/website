import React, { useEffect, useState } from 'react';
import { SettingSwitch } from '../components/SettingSwitch';
import { WaitlistForm } from './WaitlistForm';
import './board.css';

/*
  Copy rule: say only what the product does today. No AI-detection claims, no customers, no proof we do not have.
  Every picture is a real piece of the product's interface (data-ui), built in HTML.
*/

const noop = () => {};
const inertProps = { inert: true } as Record<string, unknown>;

/** Entrances: parts rise in as they arrive. Content stays visible if script fails (see index.html). */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

const rv = (i = 0) => ({ className: 'rv', style: { '--i': i } as React.CSSProperties });

/* ----------------------------- interface fragments ----------------------------- */

type Cell = 'ans' | 'mark' | 'both' | 'una' | 'unv';
const CELL_CLASS: Record<Cell, string> = {
  ans: 'bg-brand-600 text-white',
  mark: 'bg-cta text-ink',
  both: 'bg-brand-600 text-white border-2 border-cta',
  una: 'bg-white text-slate-700 border border-dashed border-slate-400',
  unv: 'bg-slate-100 text-slate-700',
};
const PALETTE: Cell[] = ['ans', 'ans', 'mark', 'ans', 'both', 'ans', 'una', 'ans', 'mark', 'ans', 'ans', 'both', 'ans', 'una', 'unv', 'ans', 'mark', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv', 'unv'];

const PaletteFragment: React.FC<{ cols?: number; size?: string; count?: number }> = ({ cols = 5, size = '2em', count = 30 }) => (
  <div data-ui role="img" aria-label="Question palette: answered, marked for review and not visited questions" {...inertProps}
    className="grid gap-[0.35em]" style={{ gridTemplateColumns: `repeat(${cols}, ${size})` }}>
    {PALETTE.slice(0, count).map((c, i) => (
      <span key={i} className={`flex items-center justify-center rounded-md text-[0.8em] font-bold ${CELL_CLASS[c]}`} style={{ height: size }}>
        {i + 1}
      </span>
    ))}
  </div>
);

const TeamFragment: React.FC = () => (
  <div data-ui role="img" aria-label="The team list: three people with the roles owner, manager and evaluator" {...inertProps}
    className="bg-white text-ink rounded-xl w-[340px] p-5 text-[15px]">
    <p className="font-semibold text-sm">People</p>
    <ul className="divide-y divide-slate-100 mt-2">
      {[['Priya Nair', 'priya@acme.example', 'Owner'], ['Daniel Okafor', 'daniel@acme.example', 'Manager'], ['Mei Tan', 'mei@acme.example', 'Evaluator']].map(([n, e, r]) => (
        <li key={n} className="py-3 flex items-center justify-between gap-3">
          <span><span className="block font-semibold">{n}</span><span className="block text-[13px] text-slate-500">{e}</span></span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-sm font-semibold">{r}</span>
        </li>
      ))}
    </ul>
  </div>
);

const OverviewFragment: React.FC = () => (
  <div data-ui role="img" aria-label="An assessment overview: Android Developer Screening with its sections and rules" {...inertProps}
    className="bg-white text-ink w-full h-full p-5 md:p-8 text-[17px]">
    <p className="text-slate-500 text-[14px] tabular-nums">Android Developer · 16 questions · 5 sections · 75 min</p>
    <p className="text-2xl md:text-4xl font-semibold mt-2 tracking-tight">Android Developer Screening</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-6 md:mt-8">
      <ul className="divide-y divide-slate-100">
        {[['1. Kotlin fundamentals', '6 questions · 15 min'], ['2. Android architecture', '4 questions · 20 min'], ['3. Coroutines and Flow', '3 questions · 10 min'], ['4. Debugging a crash', '1 question · 15 min'], ['5. Code review', '2 questions · 15 min']].map(([a, b]) => (
          <li key={a} className="py-4 flex justify-between gap-3"><span className="font-semibold">{a}</span><span className="text-slate-500 tabular-nums text-[14px]">{b}</span></li>
        ))}
      </ul>
      <div className="divide-y divide-slate-100">
        <SettingSwitch label="Lock sections in order" description="Finish one section before the next opens." checked onChange={noop} />
        <SettingSwitch label="Negative marking" description="Wrong answers deduct marks." checked onChange={noop} />
      </div>
    </div>
  </div>
);

/* ------------------------------- sample tests ---------------------------------- */

type Row = { name: string; q: number; min: number; kind: 'Choice' | 'Short' | 'Written'; label: string };
const ROLES: Record<string, Row[]> = {
  'Android Developer': [
    { name: 'Kotlin fundamentals', q: 6, min: 15, kind: 'Choice', label: 'Choice' },
    { name: 'Android architecture', q: 4, min: 20, kind: 'Choice', label: 'Choice' },
    { name: 'Coroutines and Flow', q: 3, min: 10, kind: 'Short', label: 'Short answer' },
    { name: 'Debugging a crash', q: 1, min: 15, kind: 'Written', label: 'Written' },
    { name: 'Code review', q: 2, min: 15, kind: 'Written', label: 'Written' },
  ],
  'QA Engineer': [
    { name: 'Testing fundamentals', q: 8, min: 15, kind: 'Choice', label: 'Choice' },
    { name: 'Writing test cases', q: 3, min: 20, kind: 'Written', label: 'Written' },
    { name: 'SQL basics', q: 5, min: 10, kind: 'Short', label: 'Short answer' },
    { name: 'Bug reports', q: 2, min: 15, kind: 'Written', label: 'Written' },
    { name: 'Automation concepts', q: 4, min: 15, kind: 'Choice', label: 'Choice' },
  ],
  'Sales Executive': [
    { name: 'Product knowledge', q: 10, min: 15, kind: 'Choice', label: 'Choice' },
    { name: 'Handling objections', q: 3, min: 20, kind: 'Written', label: 'Written' },
    { name: 'Pipeline maths', q: 5, min: 15, kind: 'Short', label: 'Short answer' },
    { name: 'An email to a lead', q: 1, min: 15, kind: 'Written', label: 'Written' },
  ],
};
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

const RoleBoard: React.FC = () => {
  const names = Object.keys(ROLES);
  const [role, setRole] = useState(names[0]);
  const [open, setOpen] = useState(0);
  const rows = ROLES[role];
  const total = rows.reduce((a, r) => a + r.min, 0);

  return (
    <section id="roles" aria-labelledby="roles-h" className="rows-wrap">
      <div className="section-head">
        <h2 id="roles-h" className="t-heading rv">Pick a role. See its test.</h2>
        <p className="t-body rv" style={{ '--i': 1 } as React.CSSProperties}>
          Each role gets its own sections, time limits and question types. These are examples; you build your own.
        </p>
      </div>
      <div className="roles" role="group" aria-label="Choose a role">
        {names.map((n) => (
          <button key={n} type="button" className="role" aria-pressed={n === role} onClick={() => { setRole(n); setOpen(0); }}>
            {n}
          </button>
        ))}
      </div>
      <div className="rb" data-ui key={role}>
        {rows.map((r, i) => (
          <button key={r.name} type="button" className="rb-row" style={{ '--i': i } as React.CSSProperties}
            aria-expanded={open === i} onClick={() => setOpen(i)}>
            <span className="rb-name t-statement">{r.name}</span>
            <span className="rb-f q t-body tabular-nums">{plural(r.q, 'question')}</span>
            <span className="rb-f m t-body tabular-nums">{r.min} min</span>
            <span className="rb-status t-body"><span className={r.kind}>{r.label}</span></span>
            {open === i && (
              <span className="rb-detail t-body">
                {role} test, {rows.length} sections, {total} minutes in all. Each section has its own clock; with the order locked, the next section opens when this one closes.
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="t-small" style={{ margin: '16px 8px 0', color: 'var(--ground)' }}>Example tests, shown with sample content.</p>
    </section>
  );
};

/* ------------------------------- the page -------------------------------------- */

const MARQUEE = 'A test for every role you hire';
const SEGMENTS = [
  { min: 15, word: 'Fifteen minutes', bg: 'var(--color-brand-100)', fg: 'var(--color-ink)', note: 'First, candidates work through the opening section.' },
  { min: 15, word: 'Fifteen minutes', bg: 'var(--color-brand-300)', fg: 'var(--color-ink)', note: 'Then its clock ends and the next section opens.' },
  { min: 15, word: 'Fifteen minutes', bg: 'var(--color-cta)', fg: 'var(--color-ink)', note: 'Then the same again. With the order locked, finished sections stay closed.' },
  { min: 10, word: 'Ten minutes', bg: 'var(--color-ink)', fg: '#fff', note: 'Last, when the final clock ends, the candidate reviews and submits.' },
];
const FAQ = [
  ['Who is it for?', 'Hiring teams, recruitment agencies and training providers who need to test people on specific skills.'],
  ['When can I start?', "We're inviting companies in small groups. We'll email you when it's your turn."],
  ['How much will it cost?', "Pricing isn't final yet. People on the waitlist hear first."],
  ["Will candidates see my company's branding?", "Yes. The candidate screens use your company's name and logo."],
  ['What happens after I join?', 'We hold your place and email you when early access opens. Nothing else.'],
];
const MARK_COLOURS: [string, string][] = [
  ['var(--color-ink)', 'var(--color-brand-100)'], ['var(--color-cta)', 'var(--color-ink)'], ['var(--color-brand-300)', 'var(--color-ink)'],
  ['var(--color-ink)', 'var(--color-brand-100)'], ['var(--color-brand-700)', '#fff'], ['var(--color-cta)', 'var(--color-ink)'],
  ['var(--color-brand-300)', 'var(--color-ink)'], ['var(--color-ink)', 'var(--color-brand-100)'], ['var(--color-brand-700)', '#fff'], ['var(--color-cta)', 'var(--color-ink)'],
];
const MARK_H = [100, 78, 92, 66, 100, 84, 70, 96, 62, 88];

const Marquee: React.FC = () => {
  const group = (hidden: boolean) => (
    <div className="marquee-group t-heading" aria-hidden={hidden || undefined}>
      {[0, 1, 2].map((k) => (
        <React.Fragment key={k}>
          <span>{MARQUEE}</span><span className="dot">·</span><span>TakeMyTest</span><span className="dot">·</span>
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <div className="marquee" role="presentation">
      <div className="marquee-track">{group(false)}{group(true)}</div>
    </div>
  );
};

export const LandingPage: React.FC<{ onSignIn: () => void; onPrivacy: () => void }> = ({ onSignIn, onPrivacy }) => {
  useReveal();
  const year = new Date().getFullYear();

  return (
    <div className="board">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-ink focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to content
      </a>

      <main id="main">
        {/* Hero: name band and rails */}
        <header className="hero">
          <div className="band tile on-navy" style={{ padding: 0 }}>
            <h1 className="t-display"><span className="take">Take</span><span className="mytest">MyTest</span></h1>
          </div>
          <nav className="links" aria-label="Main">
            <a className="link" href="#how">How it works</a>
            <a className="link" href="#inside">What&apos;s inside</a>
            <a className="link" href="#questions">Questions</a>
            <button type="button" className="link" onClick={onSignIn}>Sign in</button>
          </nav>

          <div className="left">
            <div className="tile on-navy" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(11px, 1.18vw, 17px)' }}>
              <PaletteFragment />
            </div>
            <ul className="tile on-paper facts t-small">
              {['Five kinds of question', 'A clock for every section', 'Owner, manager, evaluator', 'Questions from Excel', 'Your name on the test'].map((f) => (
                <li key={f} className="t-body">{f}</li>
              ))}
            </ul>
          </div>

          <div className="center">
            <OverviewFragment />
            <p className="statement t-statement">A timed test for every role you hire, in the browser.</p>
          </div>

          <div className="right">
            {[
              ['#ffffff', 'Opening to small groups first'],
              ['var(--color-brand-200)', 'Joining is free'],
              ['var(--color-brand-400)', "We email when it's your turn"],
              ['var(--color-brand-700)', 'Built for hiring teams'],
            ].map(([bg, t], i) => (
              <p key={t} className="tile fact t-body" style={{ background: bg, color: i === 3 ? '#fff' : 'var(--color-ink)' }}>{t}</p>
            ))}
            <div id="waitlist" className="tile on-pink action" style={{ scrollMarginTop: 16 }}>
              <WaitlistForm idPrefix="hero" variant="stack" />
            </div>
          </div>
        </header>

        <div style={{ marginTop: 120 }}><Marquee /></div>

        <RoleBoard />

        {/* Stages as one bar */}
        <section id="how" aria-labelledby="how-h" className="section">
          <div className="section-head">
            <h2 id="how-h" className="t-heading rv">Each section, its own clock</h2>
            <p className="t-body rv" style={{ '--i': 1 } as React.CSSProperties}>A sample test with four sections and &ldquo;Lock sections in order&rdquo; switched on.</p>
          </div>
          <div className="bar" data-ui>
            {SEGMENTS.map((s, i) => (
              <p key={i} className="seg t-statement rv" style={{ '--w': s.min, '--i': i, background: s.bg, color: s.fg } as React.CSSProperties}>{s.word}</p>
            ))}
          </div>
          <div className="bar-notes">
            {SEGMENTS.map((s, i) => (
              <p key={i} className="t-body rv" style={{ '--w': s.min, '--i': i + 2 } as React.CSSProperties}>{s.note}</p>
            ))}
          </div>
        </section>

        {/* Close-ups on a board */}
        <section id="inside" aria-labelledby="inside-h" className="section">
          <div className="section-head"><h2 id="inside-h" className="t-heading rv">What&apos;s inside</h2></div>
          <div className="mosaic">
            <div className="cu on-navy wide rv" style={{ gridColumn: 'span 6', gridRow: 'span 4' }}>
              <div className="art" style={{ alignItems: 'flex-start', justifyContent: 'flex-end', padding: '6% 5% 0 0' }}><div style={{ fontSize: 16, transform: 'scale(2.7)', transformOrigin: '100% 0' }}><PaletteFragment count={20} /></div></div>
              <p className="cap"><strong>Question palette</strong><span className="t-small">Answered, marked and not visited, at a glance.</span></p>
            </div>
            <div className="cu rv" style={{ gridColumn: 'span 3', gridRow: 'span 4', background: 'var(--color-brand-300)', '--i': 1 } as React.CSSProperties}>
              <div className="art" style={{ fontSize: 64, alignItems: 'flex-start', justifyContent: 'flex-end', padding: '9% 7% 0 0' }}>
                <span data-ui style={{ display: 'inline-block', width: '2.4em', height: '1.3em', borderRadius: '1em', background: 'var(--color-ink)', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '0.15em', left: '1.25em', width: '1em', height: '1em', borderRadius: '50%', background: '#fff' }} />
                </span>
              </div>
              <p className="cap"><strong>Lock sections in order</strong><span className="t-small">Finish one section before the next opens.</span></p>
            </div>
            <div className="cu rv" style={{ gridColumn: 'span 3', gridRow: 'span 4', background: 'var(--color-cta)', '--i': 2 } as React.CSSProperties}>
              <div className="art" style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '9% 0 0 7%', transform: 'translate(-6%, 0)' }}><span data-ui className="tabular-nums">14:58</span></div>
              <p className="cap"><strong>Section clock</strong><span className="t-small">Every section has its own time limit.</span></p>
            </div>
            <div className="cu cu-t rv" style={{ gridColumn: 'span 3', gridRow: 'span 2', background: 'var(--color-brand-50)' }}>
              <div className="art" style={{ fontSize: 66, fontWeight: 800 }}><span data-ui className="tabular-nums">−0.5</span></div>
              <p className="cap"><strong>Negative marking</strong><span className="t-small">Wrong answers can cost marks.</span></p>
            </div>
            <div className="cu cu-t on-navy rv" style={{ gridColumn: 'span 3', gridRow: 'span 2', '--i': 1 } as React.CSSProperties}>
              <div className="art" style={{ fontSize: 44 }}>
                <span data-ui style={{ display: 'flex' }}>
                  {[['O', 'var(--color-cta)', 'var(--color-ink)'], ['M', 'var(--color-brand-300)', 'var(--color-ink)'], ['E', 'var(--color-brand-100)', 'var(--color-ink)']].map(([l, bg, fg], i) => (
                    <span key={l} style={{ width: '1.5em', height: '1.5em', borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginLeft: i ? '-0.35em' : 0 }}>{l}</span>
                  ))}
                </span>
              </div>
              <p className="cap"><strong>Three roles</strong><span className="t-small">Owner, manager and evaluator see different things.</span></p>
            </div>
            <div className="cu cu-t rv" style={{ gridColumn: 'span 6', gridRow: 'span 2', background: 'var(--color-brand-300)', '--i': 2 } as React.CSSProperties}>
              <div className="art" style={{ fontSize: 66, fontWeight: 800, letterSpacing: '-0.04em' }}><span data-ui>.xlsx</span></div>
              <p className="cap"><strong>Import from Excel</strong><span className="t-small">Bring your questions in from a spreadsheet.</span></p>
            </div>
            <div className="cu cu-t on-paper rv" style={{ gridColumn: 'span 6', gridRow: 'span 2' }}>
              <div className="art" style={{ fontSize: 66, fontWeight: 800 }}><span data-ui className="tabular-nums">2 / 3</span></div>
              <p className="cap"><strong>Integrity checks</strong><span className="t-small">Tab switches and leaving full screen are logged.</span></p>
            </div>
            <div className="cu cu-t rv" style={{ gridColumn: 'span 6', gridRow: 'span 2', background: 'var(--color-brand-50)', '--i': 1 } as React.CSSProperties}>
              <div className="art">
                <span data-ui className="t-body" style={{ textAlign: 'right' }}>Acme Cloud &amp; Systems<br /><span className="t-small">Candidate Examination Portal</span></span>
              </div>
              <p className="cap"><strong>Your brand</strong><span className="t-small">Candidates see your company&apos;s name and logo.</span></p>
            </div>
          </div>
        </section>

        {/* A band per question */}
        <section id="questions" aria-labelledby="q-h" className="section" style={{ padding: '120px 0 0' }}>
          <div className="qa-head"><h2 id="q-h" className="t-heading rv">Common questions</h2></div>
          <dl style={{ margin: 0 }}>
            {FAQ.map(([q, a], i) => (
              <div key={q} className={`qa ${i % 2 ? 'b' : 'a'}`}>
                <dt className="t-statement rv">{q}</dt>
                <dd className="t-body rv" style={{ '--i': 1 } as React.CSSProperties}>{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* The action tile */}
        <section aria-labelledby="cta-h" className="cta" style={{ paddingBottom: 0 }}>
          <div className="side-l"><div style={{ position: 'absolute', left: -150, top: 36 }}><TeamFragment /></div></div>
          <div className="main tile on-pink rv">
            <h2 id="cta-h" className="t-statement">Be among the first</h2>
            <p className="t-body">Leave your email. We&apos;ll let you know when there&apos;s room for your team.</p>
            <WaitlistForm idPrefix="cta" variant="nested" />
            <p className="t-small">We use your email only to contact you about TakeMyTest early access. <button type="button" onClick={onPrivacy} style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}>Privacy</button></p>
          </div>
          <div className="side-r"><div style={{ position: 'absolute', right: -50, top: 28, fontSize: 'clamp(14px, 1.5vw, 22px)' }}><PaletteFragment count={20} /></div></div>
        </section>
      </main>

      {/* Footer: the mark, built large */}
      <footer className="foot">
        <div className="mark">
          <span className="sr-only" style={{ position: 'absolute' }}>TakeMyTest</span>
          {'TakeMyTest'.split('').map((l, i) => (
            <span key={i} aria-hidden="true" style={{ '--k': MARK_H[i] / 100, background: MARK_COLOURS[i][0], color: MARK_COLOURS[i][1] } as React.CSSProperties}>{l}</span>
          ))}
        </div>
        <div className="foot-cols">
          <ul>
            <li><a href="#how">How it works</a></li>
            <li><a href="#inside">What&apos;s inside</a></li>
          </ul>
          <ul>
            <li><a href="#questions">Common questions</a></li>
            <li><a href="#waitlist">Join the waitlist</a></li>
          </ul>
          <ul>
            <li><button type="button" onClick={onSignIn}>Sign in</button></li>
            <li><button type="button" onClick={onPrivacy}>Privacy</button></li>
          </ul>
        </div>
        <div className="foot-last t-small">
          <span>© {year} TakeMyTest</span>
          <button type="button" className="wl-button t-small" style={{ minHeight: 44 }} onClick={onSignIn}>Sign in</button>
        </div>
      </footer>
    </div>
  );
};
