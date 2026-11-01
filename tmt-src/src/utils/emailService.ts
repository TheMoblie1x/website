import { CandidateAttempt, Test, EmailNotification } from '../types/testforge';
import { evaluateAttempt } from './scoring';

const STORAGE_KEY_EMAILS = 'testforge_mock_emails';

export const getSentEmails = (): EmailNotification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAILS);
    if (!raw) {
      const seeded = getSeededEmails();
      localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading mock emails:', e);
    return getSeededEmails();
  }
};

export const saveSentEmails = (emails: EmailNotification[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
  } catch (e) {
    console.error('Error persisting mock emails:', e);
  }
};

export const sendSubmissionSummaryEmail = (
  test: Test,
  attempt: CandidateAttempt,
  brandName = 'TakeMyTest Enterprise'
): EmailNotification => {
  const evaluated = evaluateAttempt(test, attempt);
  const receipt =
    attempt.confirmationReceipt ||
    `TMT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;

  const isMalpractice = attempt.status === 'TERMINATED_MALPRACTICE';
  const verdict = isMalpractice
    ? 'TERMINATED_MALPRACTICE'
    : evaluated.isPassed
    ? 'PASSED'
    : 'FAILED';

  const sectionBreakdown = test.sections.map((sec) => {
    const secSum = evaluated.sectionsSummary.find((s) => s.sectionId === sec.id);
    // calculate total time spent in section
    let totalSecTime = 0;
    sec.questions.forEach((q) => {
      totalSecTime += attempt.responses[q.id]?.timeSpentSec || 0;
    });

    return {
      title: sec.title,
      score: secSum?.scoreAwarded ?? 0,
      total: secSum?.totalMarks ?? sec.totalMarks ?? 10,
      timeSpentSec: totalSecTime,
    };
  });

  const emailId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const formattedVerdict =
    verdict === 'PASSED'
      ? 'PASSED - ASSESSMENT CERTIFIED'
      : verdict === 'TERMINATED_MALPRACTICE'
      ? 'DISQUALIFIED - MALPRACTICE INFRACTION'
      : 'NEEDS REVIEW / DID NOT MEET THRESHOLD';

  const verdictColor =
    verdict === 'PASSED'
      ? '#1a5c9a'
      : verdict === 'TERMINATED_MALPRACTICE'
      ? '#dc2626'
      : '#475569';

  const newEmail: EmailNotification = {
    id: emailId,
    attemptId: attempt.id,
    testId: test.id,
    toEmail: attempt.candidateEmail,
    toName: attempt.candidateName,
    fromName: `${brandName} Examination Directorate`,
    fromEmail: 'noreply@examinations.takemytest.cloud',
    subject: `[Official Report] Assessment Results: ${test.title} (Receipt: ${receipt})`,
    sentAt: timestamp,
    receiptId: receipt,
    status: 'DELIVERED',
    verdict,
    scoreSummary: {
      totalScore: evaluated.totalScore,
      maxScore: evaluated.maxScore,
      percentage: evaluated.percentage,
    },
    sectionBreakdown,
    roomSweepStatus: attempt.roomSweep
      ? {
          isVerified: attempt.roomSweep.isVerified,
          integrityScore: attempt.roomSweep.integrityScore,
        }
      : undefined,
    infractionsCount: attempt.infractionCount || 0,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0f172a; padding: 24px; color: #ffffff;">
          <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700;">${brandName} Evaluation Directorate</h2>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Official Examination Completion & Performance Statement</p>
        </div>

        <div style="padding: 24px;">
          <div style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
            <p style="font-size: 14px; color: #334155; margin: 0 0 4px 0;">Dear <strong>${attempt.candidateName}</strong>,</p>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Your candidate examination session for <strong>${test.title}</strong> has been received and verified by the authoritative evaluation engine.</p>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
              <span style="color: #64748b;">Confirmation Receipt:</span>
              <strong style="color: #0f172a; font-family: monospace;">${receipt}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
              <span style="color: #64748b;">Overall Status Verdict:</span>
              <strong style="color: ${verdictColor};">${formattedVerdict}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
              <span style="color: #64748b;">Score Awarded:</span>
              <strong style="color: #0f172a;">${evaluated.totalScore} / ${evaluated.maxScore} pts (${evaluated.percentage}%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #64748b;">Passing Threshold:</span>
              <span style="color: #475569;">${test.passPercentage}%</span>
            </div>
          </div>

          ${
            attempt.roomSweep
              ? `
            <div style="background: #eef9fe; border: 1px solid #bce4f7; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: #0a3668;">
              <strong>✓ 360° AI Room Sweep Certified:</strong> ${attempt.roomSweep.integrityScore}% Integrity Score recorded across all 5 cardinal angles.
            </div>
          `
              : ''
          }

          ${
            attempt.infractionCount > 0
              ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: #991b1b;">
              <strong>⚠️ Proctoring Security Notice:</strong> ${attempt.infractionCount} infraction(s) logged during testing.
            </div>
          `
              : ''
          }

          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 10px 0;">Sectional Performance Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; color: #475569;">
                <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1;">Section</th>
                <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Time</th>
                <th style="padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Score</th>
              </tr>
            </thead>
            <tbody>
              ${sectionBreakdown
                .map(
                  (s) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 10px; color: #1e293b;">${s.title}</td>
                  <td style="padding: 8px 10px; text-align: right; color: #64748b; font-family: monospace;">${Math.round(
                    s.timeSpentSec / 60
                  )}m</td>
                  <td style="padding: 8px 10px; text-align: right; color: #0f172a; font-weight: bold; font-family: monospace;">${s.score} / ${s.total}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0 0 4px 0;">This email is an automated system confirmation generated by TakeMyTest Assessment Engine.</p>
            <p style="margin: 0;">Cryptographic Audit Signature: SHA-256 Verified • Timestamp: ${timestamp}</p>
          </div>
        </div>
      </div>
    `,
  };

  const existingEmails = getSentEmails();
  const updatedEmails = [newEmail, ...existingEmails];
  saveSentEmails(updatedEmails);

  return newEmail;
};

export const getLatestEmailForCandidate = (email: string): EmailNotification | undefined => {
  const all = getSentEmails();
  return all.find((e) => e.toEmail.toLowerCase() === email.toLowerCase());
};

const getSeededEmails = (): EmailNotification[] => [
  {
    id: 'eml_seed_01',
    attemptId: 'att_sample_01',
    testId: 'test_fullstack_2026',
    toEmail: 'alex.chen@mit.edu',
    toName: 'Alex Chen',
    fromName: 'Acme Cloud & Systems Examination Directorate',
    fromEmail: 'noreply@examinations.takemytest.cloud',
    subject:
      '[Official Report] Assessment Results: Senior Software Engineer Assessment (Receipt: TMT-ALEX-98104)',
    sentAt: '2026-10-31T09:42:20Z',
    receiptId: 'TMT-ALEX-98104',
    status: 'DELIVERED',
    verdict: 'PASSED',
    scoreSummary: {
      totalScore: 41.5,
      maxScore: 47.0,
      percentage: 88.3,
    },
    sectionBreakdown: [
      { title: 'Technical Core & Architecture', score: 11.0, total: 12.0, timeSpentSec: 680 },
      { title: 'Quantitative & Algorithmic Reasoning', score: 10.0, total: 10.0, timeSpentSec: 720 },
      { title: 'Algorithmic Coding Sandbox', score: 15.0, total: 15.0, timeSpentSec: 840 },
      { title: 'Incident Post-Mortem & Subjective Analysis', score: 5.5, total: 10.0, timeSpentSec: 540 },
    ],
    roomSweepStatus: {
      isVerified: true,
      integrityScore: 98,
    },
    infractionsCount: 0,
    htmlContent: '',
  },
  {
    id: 'eml_seed_02',
    attemptId: 'att_sample_02',
    testId: 'test_fullstack_2026',
    toEmail: 'sarah.jenkins@stanford.edu',
    toName: 'Sarah Jenkins',
    fromName: 'Acme Cloud & Systems Examination Directorate',
    fromEmail: 'noreply@examinations.takemytest.cloud',
    subject:
      '[Official Report] Assessment Results: Senior Software Engineer Assessment (Receipt: TMT-MALPRACTICE-TERMINATED)',
    sentAt: '2026-10-31T11:24:50Z',
    receiptId: 'TMT-MALPRACTICE-TERMINATED',
    status: 'DELIVERED',
    verdict: 'TERMINATED_MALPRACTICE',
    scoreSummary: {
      totalScore: 6.5,
      maxScore: 47.0,
      percentage: 13.8,
    },
    sectionBreakdown: [
      { title: 'Technical Core & Architecture', score: 6.5, total: 12.0, timeSpentSec: 580 },
      { title: 'Quantitative & Algorithmic Reasoning', score: 0, total: 10.0, timeSpentSec: 0 },
      { title: 'Algorithmic Coding Sandbox', score: 0, total: 15.0, timeSpentSec: 0 },
      { title: 'Incident Post-Mortem & Subjective Analysis', score: 0, total: 10.0, timeSpentSec: 0 },
    ],
    roomSweepStatus: {
      isVerified: true,
      integrityScore: 92,
    },
    infractionsCount: 3,
    htmlContent: '',
  },
];
