/**
 * Candidates use a SEPARATE Firebase app instance with its own (anonymous) session, so opening an invite link in a
 * browser where a staff member is signed in with Google never replaces or signs out that staff session.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './config';

const NAME = 'candidate';
export const candidateApp = getApps().some((a) => a.name === NAME) ? getApp(NAME) : initializeApp(firebaseConfig, NAME);
export const candidateAuth = getAuth(candidateApp);
export const candidateDb = getDatabase(candidateApp);
