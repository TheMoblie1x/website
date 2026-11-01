import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { CandidateAttempt } from '../types/testforge';
import { useBrand } from '../components/ThemeProvider';

/** What a candidate sees after finishing. No score: marking happens when the organiser opens the submission. */
export const CandidateReceiptScreen: React.FC<{ attempt: CandidateAttempt }> = ({ attempt }) => {
  const { brand } = useBrand();
  const terminated = attempt.status === 'TERMINATED_MALPRACTICE';
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <main className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
        {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover mx-auto mb-4 border border-slate-200" />}
        <p className="text-sm text-slate-500 mb-4">{brand.name}</p>
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${terminated ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}
        >
          {terminated ? <ShieldAlert className="w-8 h-8" aria-hidden="true" /> : <CheckCircle2 className="w-8 h-8" aria-hidden="true" />}
        </div>
        <h1 className="text-2xl font-bold text-ink">{terminated ? 'Your test was ended' : 'Your answers were submitted'}</h1>
        <p className="text-sm text-slate-600 mt-2">
          {terminated
            ? 'The test was ended because the allowed number of violations was reached. Your answers up to that point were sent to the organiser.'
            : `Thank you, ${attempt.candidateName}. The organiser will mark your answers. You will not see a score here.`}
        </p>
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt</p>
          <p className="font-mono text-base font-bold text-ink mt-0.5 break-all">{attempt.confirmationReceipt}</p>
          <p className="text-xs text-slate-500 mt-2">
            Keep this code. The organiser can use it to find your submission. No email is sent automatically.
          </p>
        </div>
      </main>
    </div>
  );
};
