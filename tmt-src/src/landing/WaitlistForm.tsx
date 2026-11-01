import React, { useState } from 'react';
import { joinWaitlist } from '../firebase/waitlist';
import { LIMITS, validateWaitlist } from './waitlistLogic';

type Phase = 'idle' | 'submitting' | 'joined' | 'duplicate';

/**
 * Waitlist sign-up (email only). Two shapes for the board's tiles:
 *  - "stack": field above a full-width button (narrow tiles)
 *  - "nested": field with the button inside its right end (wide tile)
 * `idPrefix` keeps ids unique when the form appears twice on the page.
 */
export const WaitlistForm: React.FC<{ idPrefix: string; variant: 'stack' | 'nested' }> = ({ idPrefix, variant }) => {
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState(''); // honeypot: people never see or fill it
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'submitting') return;
    setError('');
    const v = validateWaitlist({ email });
    if (!v.ok) {
      setError(v.errors.email || 'Enter a valid email address.');
      return;
    }
    if (trap) {
      setPhase('joined'); // a bot filled the hidden field: look successful, store nothing
      return;
    }
    setPhase('submitting');
    try {
      setPhase(await joinWaitlist(v.value));
    } catch {
      setPhase('idle');
      setError('We could not save your email just now. Check your connection and try again.');
    }
  };

  if (phase === 'joined' || phase === 'duplicate') {
    return (
      <div role="status" className="wl-done">
        <p className="t-body wl-done-title">{phase === 'joined' ? "You're on the list." : "You're already on the list."}</p>
        <p className="t-small">We'll email {email.trim().toLowerCase()} when early access opens.</p>
      </div>
    );
  }

  const id = `${idPrefix}-email`;
  const busy = phase === 'submitting';

  return (
    <form onSubmit={submit} noValidate className={`wl wl-${variant}`} aria-label="Join the waitlist">
      <label htmlFor={id} className="t-small wl-label">
        Work email
      </label>
      <div className="wl-row">
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          maxLength={LIMITS.email}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="wl-input t-body"
        />
        <button type="submit" disabled={busy} className="wl-button t-body">
          {busy ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      <div aria-hidden="true" className="wl-trap">
        <label htmlFor={`${id}-site`}>Leave this field empty</label>
        <input id={`${id}-site`} tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="t-small wl-error">
          {error}
        </p>
      )}
    </form>
  );
};
