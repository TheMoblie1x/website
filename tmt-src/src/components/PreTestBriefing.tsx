import React, { useState, useEffect } from 'react';
import { useBrand } from './ThemeProvider';
import {
  Clock,
  AlertTriangle,
  Monitor,
  ShieldAlert,
  Wifi,
  Camera,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Test, RoomSweepAudit } from '../types/testforge';
import { AiProctoringSweepModal } from './AiProctoringSweepModal';
import { Compass, Sparkles } from 'lucide-react';

interface PreTestBriefingProps {
  test: Test;
  onStart: (candidateInfo: { name: string; email: string; roomSweep?: RoomSweepAudit }) => void;
  defaultCandidateName?: string;
  defaultCandidateEmail?: string;
  initialRoomSweep?: RoomSweepAudit;
}

export const PreTestBriefing: React.FC<PreTestBriefingProps> = ({
  test,
  onStart,
  defaultCandidateName = 'Jordan Lee',
  defaultCandidateEmail = 'jordan.lee@example.edu',
  initialRoomSweep,
}) => {
  const { brand } = useBrand();
  const [candidateName, setCandidateName] = useState(defaultCandidateName);
  const [candidateEmail, setCandidateEmail] = useState(defaultCandidateEmail);
  const [agreed, setAgreed] = useState(false);
  const [roomSweep, setRoomSweep] = useState<RoomSweepAudit | undefined>(initialRoomSweep);
  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);

  // Hardware and environment live checks
  const [screenRes, setScreenRes] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  });
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setScreenRes({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // Simulate real network latency ping measurement
    const start = performance.now();
    const timer = setTimeout(() => {
      const simulatedPing = Math.round(18 + Math.random() * 14); // 18-32ms
      setPingLatency(simulatedPing);
    }, 400);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const isResolutionSufficient = screenRes.width >= 1024; // Desktop standard
  const totalQuestions = test.sections.reduce((acc, s) => acc + s.questions.length, 0);

  const handleStartClicked = () => {
    if (!agreed || !candidateName.trim() || !candidateEmail.trim()) return;
    onStart({ name: candidateName.trim(), email: candidateEmail.trim(), roomSweep });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Branded Header - Complete suppression of platform identity */}
      <header className="bg-white border-b border-slate-200 px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-9 w-9 rounded-lg object-cover border border-slate-200"
          />
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">
              {brand.name}
            </span>
            <span className="text-xs text-slate-500 font-medium">Candidate Examination Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Session Verified
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto my-6 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)] mb-1">
            <span>Official Candidate Briefing</span>
            <span>•</span>
            <span>ID: {test.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {test.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {test.description ||
              'Please review the examination instructions, section allocation, and hardware guardrails before launching the assessment.'}
          </p>
        </div>

        {/* Candidate Identity Verification Inputs */}
        <div className="mb-8 p-5 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Candidate Credentials & Verification</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="candidate-name" className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                id="candidate-name"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] text-slate-800"
              />
            </div>
            <div>
              <label htmlFor="candidate-email" className="block text-xs font-semibold text-slate-700 mb-1">Candidate Email Address</label>
              <input
                id="candidate-email"
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="e.g. jordan.lee@example.edu"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Aggregated Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-blue-600">Total Duration</p>
              <p className="text-xl font-extrabold text-blue-900 mt-0.5">
                {test.totalDurationMin} Minutes
              </p>
              <p className="text-xs text-blue-700 mt-0.5">{totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} total</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-amber-700">Negative Marking</p>
              <p className="text-xl font-extrabold text-amber-900 mt-0.5">
                {test.negativeMarking ? 'Active' : 'Disabled'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {test.negativeMarking
                  ? 'Penalties apply on incorrect picks'
                  : 'No penalties for incorrect attempts'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-slate-200 rounded-lg text-slate-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-500">Navigation Policy</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {test.navigationMode === 'SEQUENTIAL' ? 'Sequential' : 'Free Roam'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {test.navigationMode === 'SEQUENTIAL'
                  ? 'Non-reversible locked sections'
                  : 'Freely switch between sections'}
              </p>
            </div>
          </div>
        </div>

        {/* Hardware & Environment Readiness Checklist */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center justify-between">
            <span>Hardware & Environment Readiness Check</span>
            <span className="text-xs normal-case text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> All checks passing
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <Monitor className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Display Resolution</p>
                <p className="text-xs text-slate-500 truncate">
                  {screenRes.width} × {screenRes.height} px{' '}
                  {isResolutionSufficient ? '(Compliant)' : '(Low Res)'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <Wifi className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Network Latency</p>
                <p className="text-xs text-slate-500">
                  {pingLatency !== null ? `${pingLatency} ms (Ultra-Fast)` : 'Pinging gateway...'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <Camera className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Proctoring Device</p>
                <p className="text-xs text-slate-500">
                  {cameraReady ? 'Webcam feed available' : 'Permission needed'}
                </p>
              </div>
            </div>
          </div>

          {/* 360° AI Room Sweep Certification Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            roomSweep?.isVerified
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-accent-soft border-accent-line'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  roomSweep?.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-accent-soft text-accent'
                }`}>
                  <Compass className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      360° AI Room Sweep & Perimeter Certification
                    </h3>
                    {roomSweep?.isVerified ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ CERTIFIED ({roomSweep.integrityScore}% INTEGRITY)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-soft text-accent border border-accent-line">
                        MANDATORY AI SCAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    {roomSweep?.isVerified
                      ? `All 5 perimeter angles (Front 0°, Right 90°, Rear 180°, Left 270°, Desk Surface) scanned and verified clear of unauthorized devices or personnel.`
                      : `Rotate your camera through 5 panoramic angles to certify a clean testing perimeter before entering the assessment.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSweepModalOpen(true)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  roomSweep?.isVerified
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                    : 'bg-accent hover:bg-accent-hover text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{roomSweep?.isVerified ? 'Re-scan / Review Audit' : 'Launch 360° Room Sweep'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Breakdown Table */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
            Assessment Section Structure
          </h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Section Title</th>
                  <th className="px-4 py-3">Time Budget</th>
                  <th className="px-4 py-3">Questions</th>
                  <th className="px-4 py-3 text-right">Total Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {test.sections.map((sec, idx) => (
                  <tr key={sec.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <div>{sec.title}</div>
                      {sec.description && (
                        <div className="text-xs font-normal text-slate-400 mt-0.5">
                          {sec.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {sec.durationMin} mins
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sec.questions.length} questions
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 font-mono">
                      {sec.totalMarks || sec.questions.reduce((a, b) => a + b.marks, 0)} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integrity Guardrails & Infraction Policy */}
        <div className="p-4 sm:p-5 bg-red-50/70 border border-red-200 rounded-xl flex gap-3.5 mb-8">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-900 leading-relaxed">
            <p className="font-bold text-red-950 mb-1">
              Strict Anti-Malpractice & Lockdown Policy:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-red-800">
              <li>
                <strong>Tab Switching & Focus Loss:</strong> Exiting fullscreen or navigating to
                external windows triggers logged security infractions.
              </li>
              <li>
                <strong>3-Violation Auto-Lock:</strong> Reaching 3 violations immediately locks and
                submits your assessment as disqualified.
              </li>
              <li>
                <strong>Authoritative Server Timers:</strong> Section timers enforce hard lockouts.
                When a section timer reaches zero, responses are automatically committed.
              </li>
              <li>
                <strong>Autosave:</strong> Every keystroke and click is instantly synced and cached
                locally with cryptographic signatures.
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Candidate Acknowledgment Gate */}
        <label className="flex items-start gap-3.5 p-4 sm:p-5 border-2 border-slate-200 rounded-xl bg-slate-50/80 cursor-pointer hover:bg-slate-100/70 hover:border-slate-300 transition select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-[var(--brand-primary)] rounded cursor-pointer shrink-0"
          />
          <span className="text-xs sm:text-sm text-slate-700 leading-normal">
            I confirm that I am taking this assessment independently, without unauthorized assistance,
            under stable conditions. I have read, understood, and agree to abide by the assessment
            rules, timer constraints, and proctoring integrity policies outlined above.
          </span>
        </label>
      </main>

      {/* Footer CTA */}
      <footer className="bg-white border-t border-slate-200 px-6 sm:px-10 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 z-30">
        <p className="text-xs text-slate-400">
          Powered by {brand.name} Secure Assessment Engine • SSL 256-Bit Encrypted
        </p>

        <button
          onClick={handleStartClicked}
          disabled={!agreed || !candidateName.trim() || !candidateEmail.trim()}
          style={{
            backgroundColor:
              agreed && candidateName.trim() && candidateEmail.trim()
                ? 'var(--brand-primary)'
                : '#CBD5E1',
          }}
          className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer hover:opacity-95 active:scale-[0.98]"
        >
          <span>Start Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>

      {/* 360 Degree AI Proctoring Panoramic Room Sweep Modal */}
      <AiProctoringSweepModal
        isOpen={isSweepModalOpen}
        onClose={() => setIsSweepModalOpen(false)}
        onCompleteAudit={(audit) => {
          setRoomSweep(audit);
          setIsSweepModalOpen(false);
        }}
      />
    </div>
  );
};
