import React, { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from './AuthProvider';
import { ROLE_LABELS } from './roles';

const GoogleG: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
      <BrandMark className="mb-8" />
      {children}
    </div>
  </main>
);

export const LoadingScreen: React.FC = () => (
  <Shell>
    <p role="status" className="text-sm text-slate-600">
      Checking your access…
    </p>
  </Shell>
);

export const SignInScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { signInWithGoogle, signingIn, error } = useAuth();
  return (
    <Shell>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Sign in</h1>
      <p className="text-sm text-slate-600 mt-1.5">
        Use the Google account your company registered with TakeMyTest.
      </p>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={signingIn}
        className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-semibold text-ink transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        <GoogleG />
        <span>{signingIn ? 'Opening Google…' : 'Sign in with Google'}</span>
      </button>

      {error && (
        <p role="alert" className="text-[13px] text-red-600 mt-3">
          {error}
        </p>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm font-semibold text-slate-600 hover:text-ink cursor-pointer"
        >
          ← Back to home
        </button>
      )}
    </Shell>
  );
};

export const NoAccessScreen: React.FC = () => {
  const { user, signOut, recheck, error } = useAuth();
  return (
    <Shell>
      <h1 className="text-2xl font-bold tracking-tight text-ink">No access yet</h1>
      <p className="text-sm text-slate-600 mt-1.5">
        {user?.email ? (
          <>
            <span className="font-semibold text-ink">{user.email}</span> has not been added to a
            company.
          </>
        ) : (
          'This account has not been added to a company.'
        )}{' '}
        Ask your company owner to add this email address as a team member, then try again.
      </p>

      {error && (
        <p role="alert" className="text-[13px] text-red-600 mt-3">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={recheck}
          className="flex-1 px-4 py-2.5 bg-cta hover:bg-cta-hover active:bg-cta-press text-ink font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        >
          Use another account
        </button>
      </div>
    </Shell>
  );
};

/** Avatar button with name, role and sign-out. */
export const AccountMenu: React.FC = () => {
  const { user, membership, signOut, isPlatformAdmin, platformView, setPlatformView } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user || (!membership && !isPlatformAdmin)) return null;
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2 rounded-full cursor-pointer"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-white text-ink border border-slate-200 rounded-xl shadow-lg p-2 z-50"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-[13px] text-slate-500 truncate">{user.email}</p>
            <p className="text-[13px] text-slate-600 mt-1.5">
              {isPlatformAdmin && (platformView || !membership)
                ? 'Platform administrator'
                : `${ROLE_LABELS[membership!.role]} · ${membership!.companyName}`}
            </p>
          </div>
          {isPlatformAdmin && membership && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setPlatformView(!platformView);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              {platformView ? `Open ${membership.companyName}` : 'Open platform console'}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
