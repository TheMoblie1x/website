import React, { useState } from 'react';
import {
  Mail,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Copy,
  Check,
  Compass,
  ShieldAlert,
  Inbox,
  Send,
  ExternalLink,
} from 'lucide-react';
import { EmailNotification } from '../types/testforge';

interface MockEmailViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: EmailNotification;
  allEmails?: EmailNotification[];
}

export const MockEmailViewerModal: React.FC<MockEmailViewerModalProps> = ({
  isOpen,
  onClose,
  initialEmail,
  allEmails = [],
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | undefined>(
    initialEmail || allEmails[0]
  );
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [viewMode, setViewMode] = useState<'RENDERED' | 'RAW'>('RENDERED');

  // Sync if initialEmail changes
  React.useEffect(() => {
    if (initialEmail) {
      setSelectedEmail(initialEmail);
    } else if (allEmails.length > 0) {
      setSelectedEmail(allEmails[0]);
    }
  }, [initialEmail, allEmails]);

  if (!isOpen) return null;

  const emailToDisplay = selectedEmail || allEmails[0];

  const handleCopyReceipt = (receipt: string) => {
    navigator.clipboard?.writeText(receipt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide flex items-center gap-2">
                <span>Mock Email Dispatch Notification Service</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SMTP 250 OK
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Automated candidate report delivery engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar list if multiple emails + Preview Frame */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email Outbox List if opened from Admin */}
          {allEmails.length > 1 && (
            <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 hidden md:flex">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5" /> Dispatched Outbox ({allEmails.length})
                </span>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {allEmails.map((eml) => {
                  const isSelected = emailToDisplay?.id === eml.id;
                  return (
                    <button
                      key={eml.id}
                      onClick={() => setSelectedEmail(eml)}
                      className={`w-full text-left p-3 text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-blue-600'
                          : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 truncate">
                          {eml.toName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            eml.verdict === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : eml.verdict === 'TERMINATED_MALPRACTICE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {eml.verdict === 'PASSED'
                            ? 'PASS'
                            : eml.verdict === 'TERMINATED_MALPRACTICE'
                            ? 'TERMINATED'
                            : 'REVIEW'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{eml.toEmail}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(eml.sentAt).toLocaleTimeString()} • {eml.receiptId}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Email Inspector */}
          {emailToDisplay ? (
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-100">
              {/* Envelope Metadata Bar */}
              <div className="p-4 bg-white border-b border-slate-200 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {emailToDisplay.subject}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Delivered
                    </span>
                    <button
                      onClick={() => setViewMode((m) => (m === 'RENDERED' ? 'RAW' : 'RENDERED'))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-[11px]"
                    >
                      {viewMode === 'RENDERED' ? 'View JSON Payload' : 'View Rendered HTML'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400">From:</span>{' '}
                    <strong className="text-slate-800">{emailToDisplay.fromName}</strong> &lt;
                    {emailToDisplay.fromEmail}&gt;
                  </div>
                  <div>
                    <span className="text-slate-400">To:</span>{' '}
                    <strong className="text-slate-800">{emailToDisplay.toName}</strong> &lt;
                    {emailToDisplay.toEmail}&gt;
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Timestamp:</span>{' '}
                    <span>{new Date(emailToDisplay.sentAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">Receipt:</span>{' '}
                    <strong className="text-slate-900">{emailToDisplay.receiptId}</strong>
                    <button
                      onClick={() => handleCopyReceipt(emailToDisplay.receiptId)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy receipt ID"
                    >
                      {copiedReceipt ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* View Mode Content */}
              <div className="p-4 sm:p-6 flex-1 flex justify-center">
                {viewMode === 'RENDERED' ? (
                  <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    {/* Branded Banner */}
                    <div className="p-6 bg-slate-900 text-white">
                      <span className="text-xs uppercase font-bold tracking-wider text-blue-400 block mb-1">
                        Official Assessment Scorecard
                      </span>
                      <h2 className="text-xl font-black">{emailToDisplay.fromName}</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Candidate examination record dispatched automatically
                      </p>
                    </div>

                    <div className="p-6 space-y-5 text-xs text-slate-700">
                      <div>
                        <p className="text-sm text-slate-900">
                          Dear <strong>{emailToDisplay.toName}</strong>,
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Your examination attempt has been officially recorded and evaluated by
                          the TakeMyTest assessment engine. Below is your verified performance
                          summary and institutional confirmation receipt.
                        </p>
                      </div>

                      {/* Score Summary Box */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-semibold">Evaluation Verdict</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              emailToDisplay.verdict === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : emailToDisplay.verdict === 'TERMINATED_MALPRACTICE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {emailToDisplay.verdict === 'PASSED'
                              ? 'PASSED'
                              : emailToDisplay.verdict === 'TERMINATED_MALPRACTICE'
                              ? 'DISQUALIFIED (MALPRACTICE)'
                              : 'NEEDS REVIEW'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Cumulative Score:</span>
                          <strong className="text-base text-slate-900 font-mono">
                            {emailToDisplay.scoreSummary.totalScore} /{' '}
                            {emailToDisplay.scoreSummary.maxScore} pts (
                            {emailToDisplay.scoreSummary.percentage}%)
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Receipt ID:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {emailToDisplay.receiptId}
                          </span>
                        </div>
                      </div>

                      {/* 360 AI Proctoring Room Sweep Badge */}
                      {emailToDisplay.roomSweepStatus?.isVerified && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-xs">
                              360° AI Room Sweep Certified:
                            </span>
                          </div>
                          <span className="font-mono font-bold text-xs">
                            {emailToDisplay.roomSweepStatus.integrityScore}% Score
                          </span>
                        </div>
                      )}

                      {/* Malpractice Notice if any */}
                      {emailToDisplay.infractionsCount > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-900">
                          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                          <span className="text-xs">
                            <strong>Security Audit Notice:</strong> {emailToDisplay.infractionsCount}{' '}
                            proctoring infraction(s) recorded during this attempt.
                          </span>
                        </div>
                      )}

                      {/* Section Breakdown Table */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Sectional Performance Record
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Section Title</th>
                                <th className="p-2.5 text-right">Time</th>
                                <th className="p-2.5 text-right">Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {emailToDisplay.sectionBreakdown.map((s, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-medium text-slate-800">{s.title}</td>
                                  <td className="p-2.5 text-right font-mono text-slate-500">
                                    {Math.round(s.timeSpentSec / 60)}m
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                    {s.score} / {s.total}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Footer notice */}
                      <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1">
                        <p>
                          Generated automatically by the TakeMyTest Enterprise Proctoring Suite.
                        </p>
                        <p className="font-mono">
                          Session Hash: sha256_{emailToDisplay.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                    <pre>{JSON.stringify(emailToDisplay, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
              No emails found in outbox.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <p className="text-slate-500">
            Mock Email Service is active and storing audit receipts locally.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
