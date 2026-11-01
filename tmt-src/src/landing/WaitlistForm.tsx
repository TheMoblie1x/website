import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { joinWaitlist } from '../firebase/waitlist';
import { INTERESTS, LIMITS, WaitlistErrors, validateWaitlist } from './waitlistLogic';

type Phase = 'idle' | 'submitting' | 'joined' | 'duplicate';

const field =
  'w-full px-3.5 py-3 text-[15px] bg-white border border-slate-300 rounded-lg text-ink placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

/** Waitlist sign-up. `idPrefix` keeps field ids unique when the form appears twice on the page. */
export const WaitlistForm: React.FC<{ idPrefix: string; compact?: boolean }> = ({ idPrefix, compact }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [interest, setInterest] = useState('');
  const [trap, setTrap] = useState(''); // honeypot: real people never see or fill this
  const [errors, setErrors] = useState<WaitlistErrors>({});
  const [formError, setFormError] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'submitting') return;
    setFormError('');

    const v = validateWaitlist({ email, name, company, interest });
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});

    if (trap) {
      // A bot filled the hidden field. Look successful, store nothing.
      setPhase('joined');
      return;
    }

    setPhase('submitting');
    try {
      setPhase(await joinWaitlist(v.value));
    } catch {
      setPhase('idle');
      setFormError('We could not save your email just now. Check your connection and try again.');
    }
  };

  if (phase === 'joined' || phase === 'duplicate') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-accent-line bg-accent-soft p-5">
        <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[15px] font-semibold text-ink">
            {phase === 'joined' ? "You're on the list." : "You're already on the list."}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            We'll email <span className="font-semibold text-ink break-all">{email.trim().toLowerCase()}</span> when early
            access opens.
          </p>
        </div>
      </div>
    );
  }

  const id = (n: string) => `${idPrefix}-${n}`;
  const busy = phase === 'submitting';

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-label="Join the waitlist">
      <div>
        <label htmlFor={id('email')} className="block text-sm font-semibold text-ink mb-1.5">
          Work email
        </label>
        <input
          id={id('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? id('email-err') : undefined}
          maxLength={LIMITS.email}
          className={field}
        />
        {errors.email && (
          <p id={id('email-err')} role="alert" className="text-[13px] text-red-600 mt-1.5">
            {errors.email}
          </p>
        )}
      </div>

      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id('name')} className="block text-sm font-semibold text-ink mb-1.5">
              Name <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id={id('name')}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIMITS.name}
              aria-invalid={!!errors.name}
              className={field}
            />
            {errors.name && (
              <p role="alert" className="text-[13px] text-red-600 mt-1.5">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={id('company')} className="block text-sm font-semibold text-ink mb-1.5">
              Company <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id={id('company')}
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={LIMITS.company}
              aria-invalid={!!errors.company}
              className={field}
            />
            {errors.company && (
              <p role="alert" className="text-[13px] text-red-600 mt-1.5">
                {errors.company}
              </p>
            )}
          </div>
        </div>
      )}

      {!compact && (
        <div>
          <label htmlFor={id('interest')} className="block text-sm font-semibold text-ink mb-1.5">
            I'm using it as <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <select id={id('interest')} value={interest} onChange={(e) => setInterest(e.target.value)} className={field}>
            <option value="">Choose one</option>
            {INTERESTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Honeypot, hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={id('website')}>Leave this field empty</label>
        <input
          id={id('website')}
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full px-5 py-3 bg-cta hover:bg-cta-hover active:bg-cta-press text-ink text-[15px] font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        {busy ? 'Joining…' : 'Join the waitlist'}
      </button>

      {formError && (
        <p role="alert" className="text-[13px] text-red-600">
          {formError}
        </p>
      )}
      <p className="text-[13px] text-slate-500">
        We use your email only to contact you about TakeMyTest early access.
      </p>
    </form>
  );
};
