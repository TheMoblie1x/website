import React from 'react';
import './board.css';

/**
 * Privacy notice. DRAFT FOR OWNER REVIEW: every statement below was checked against the code and configuration
 * (see the comments), but the owner must confirm the contact address and that these practices are what they intend.
 */
const CONTACT_EMAIL = 'themobile1x@gmail.com'; // TODO(owner): confirm this is the address to publish.

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="board" style={{ minHeight: '100vh' }}>
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 96px' }}>
      <button type="button" className="link" onClick={onBack} style={{ minHeight: 44, textDecoration: 'underline' }}>
        ← Back
      </button>
      <h1 className="t-heading" style={{ marginTop: 24 }}>Privacy</h1>
      <p className="t-small" style={{ marginTop: 8 }}>Last updated 1 November 2026</p>

      <h2 className="t-body" style={{ fontWeight: 700, marginTop: 32 }}>Waitlist</h2>
      <p className="t-body" style={{ marginTop: 8 }}>
        If you join the waitlist we store your email address and the time you joined. We use it only to contact you about TakeMyTest early
        access. We do not sell it or share it with advertisers. To be removed, email us and we will delete it.
      </p>

      <h2 className="t-body" style={{ fontWeight: 700, marginTop: 32 }}>Companies and their staff</h2>
      <p className="t-body" style={{ marginTop: 8 }}>
        Staff sign in with Google. We store the name and email address Google provides, the company they belong to and their role, so we
        can control what each person may do. Tests, questions, answer keys, results and company branding belong to the company that created them.
      </p>

      <h2 className="t-body" style={{ fontWeight: 700, marginTop: 32 }}>Candidates</h2>
      <p className="t-body" style={{ marginTop: 8 }}>
        A candidate opens a link from a company. We store the name and email they enter, their answers, timing, and a record of full-screen
        exits and tab switches during the test. This is held for the company that sent the link, which decides how long to keep it and what to do
        with it. Candidates do not need an account; their browser gets an anonymous identifier so they can continue after a reload. To see,
        correct or delete your data, ask the company that invited you.
      </p>
      <p className="t-body" style={{ marginTop: 8 }}>
        Tests may discourage screenshots and copying and show your name, email and attempt code across the page. These measures cannot stop every
        way of capturing a screen, and the watermark exists so a leaked image can be traced.
      </p>

      <h2 className="t-body" style={{ fontWeight: 700, marginTop: 32 }}>Where data is kept</h2>
      <p className="t-body" style={{ marginTop: 8 }}>
        Data is stored in Google Firebase (Realtime Database and Authentication). We do not use advertising or analytics trackers on this site.
        Nothing is stored in your browser except what is needed to keep you signed in and to resume a test.
      </p>

      <h2 className="t-body" style={{ fontWeight: 700, marginTop: 32 }}>Contact</h2>
      <p className="t-body" style={{ marginTop: 8 }}>
        Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`} style={{ textDecoration: 'underline' }}>{CONTACT_EMAIL}</a>
      </p>
    </main>
  </div>
);
