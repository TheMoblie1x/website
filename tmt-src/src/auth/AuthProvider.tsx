import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { get, ref, remove, set } from 'firebase/database';
import { auth, db } from '../firebase/client';
import { emailKey, isRole, Role } from './roles';

export type AuthStatus = 'loading' | 'signedOut' | 'noAccess' | 'ready';

export interface StaffUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
}

export interface Membership {
  companyId: string;
  companyName: string;
  role: Role;
}

interface AuthContextValue {
  status: AuthStatus;
  user: StaffUser | null;
  membership: Membership | null;
  /** Message to show on the sign-in or no-access screen, if any. */
  error: string;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-check access (e.g. after an owner adds this email). */
  recheck: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site, then try again.';
    case 'auth/unauthorized-domain':
      return 'This website address is not authorised for sign-in yet. Ask the platform administrator to add it.';
    case 'auth/network-request-failed':
      return 'Could not reach Google. Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Google sign-in is not switched on for this project yet.';
    default:
      return 'Could not sign you in. Please try again.';
  }
}

function toStaffUser(u: User): StaffUser {
  return {
    uid: u.uid,
    email: u.email || '',
    name: u.displayName || u.email || 'Team member',
    photoURL: u.photoURL,
  };
}

/**
 * Work out who this person is in the company:
 *  1. an existing membership, or
 *  2. a pending invite an owner registered for their verified email (claimed on first sign-in).
 * Returns null when the account has not been added to any company.
 */
async function resolveMembership(u: User): Promise<Membership | null> {
  let snap = await get(ref(db, `members/${u.uid}`));

  if (!snap.exists() && u.email && u.emailVerified) {
    const pendingRef = ref(db, `pendingMembers/${emailKey(u.email)}`);
    const pending = await get(pendingRef);
    const p = pending.val();
    if (p && isRole(p.role) && typeof p.companyId === 'string') {
      const profile = { email: u.email, name: u.displayName || u.email };
      await set(ref(db, `members/${u.uid}`), { companyId: p.companyId, role: p.role, ...profile });
      await set(ref(db, `companyMembers/${p.companyId}/${u.uid}`), { role: p.role, ...profile });
      await remove(pendingRef);
      snap = await get(ref(db, `members/${u.uid}`));
    }
  }

  const m = snap.val();
  if (!m || !isRole(m.role) || typeof m.companyId !== 'string') return null;

  let companyName = '';
  try {
    companyName = (await get(ref(db, `companies/${m.companyId}/name`))).val() || '';
  } catch {
    // The name is cosmetic; access does not depend on it.
  }
  return { companyId: m.companyId, companyName: companyName || 'Your company', role: m.role };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<StaffUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [recheckTick, setRecheckTick] = useState(0);
  const currentUser = useRef<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      currentUser.current = u;
      // Anonymous sessions are candidates, never staff.
      if (!u || u.isAnonymous) {
        setUser(null);
        setMembership(null);
        setStatus('signedOut');
        return;
      }
      setUser(toStaffUser(u));
      setStatus('loading');
      try {
        const m = await resolveMembership(u);
        if (cancelled) return;
        setMembership(m);
        setError('');
        setStatus(m ? 'ready' : 'noAccess');
      } catch {
        if (cancelled) return;
        setMembership(null);
        setError('We could not verify your access. Check your connection and try again.');
        setStatus('noAccess');
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [recheckTick]);

  const signInWithGoogle = useCallback(async () => {
    setError('');
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(friendlyAuthError((e as { code?: string }).code || ''));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setError('');
  }, []);

  const recheck = useCallback(() => setRecheckTick((n) => n + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, membership, error, signingIn, signInWithGoogle, signOut, recheck }),
    [status, user, membership, error, signingIn, signInWithGoogle, signOut, recheck]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
