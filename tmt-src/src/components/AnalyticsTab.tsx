import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Award,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Mail,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Compass,
} from 'lucide-react';
import { CandidateAttempt, Test } from '../types/testforge';
import { EmailNotification } from '../types/testforge';

interface AnalyticsTabProps {
  tests: Test[];
  attempts: CandidateAttempt[];
  emails: EmailNotification[];
  onOpenEmailOutbox: () => void;
}

const SCORE_BUCKETS = [
  { range: '0-20%', min: 0, max: 20, label: '0-20%' },
  { range: '21-40%', min: 21, max: 40, label: '21-40%' },
  { range: '41-60%', min: 41, max: 60, label: '41-60%' },
  { range: '61-80%', min: 61, max: 80, label: '61-80%' },
  { range: '81-100%', min: 81, max: 100, label: '81-100%' },
];

const PIE_COLORS = {
  PASSED: '#1558d6', // emerald-500
  FAILED: '#94a3b8', // amber-500
  MALPRACTICE: '#ef4444', // red-500
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  tests,
  attempts,
  emails,
  onOpenEmailOutbox,
}) => {
  const [selectedTestId, setSelectedTestId] = useState<string>('ALL');

  // Filter attempts by selected test
  const filteredAttempts = useMemo(() => {
    if (selectedTestId === 'ALL') return attempts;
    return attempts.filter((a) => a.testId === selectedTestId);
  }, [attempts, selectedTestId]);

  const activeTest = useMemo(() => {
    return tests.find((t) => t.id === selectedTestId) || tests[0];
  }, [tests, selectedTestId]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredAttempts.length;
    if (total === 0) {
      return {
        total: 0,
        avgScore: 0,
        passCount: 0,
        failCount: 0,
        malpracticeCount: 0,
        passRate: 0,
        avgTimeMins: 0,
        roomSweepCount: 0,
        sweepRate: 0,
      };
    }

    let sumPercentage = 0;
    let passCount = 0;
    let failCount = 0;
    let malpracticeCount = 0;
    let totalTimeSec = 0;
    let roomSweepCount = 0;

    filteredAttempts.forEach((att) => {
      sumPercentage += att.percentageScore || 0;
      if (att.status === 'TERMINATED_MALPRACTICE') {
        malpracticeCount++;
      } else if (att.isPassed) {
        passCount++;
      } else {
        failCount++;
      }

      // Calculate time
      if (att.startedAt && att.submittedAt) {
        const diffMs = new Date(att.submittedAt).getTime() - new Date(att.startedAt).getTime();
        totalTimeSec += Math.max(0, diffMs / 1000);
      } else {
        totalTimeSec += 35 * 60; // fallback avg 35 mins
      }

      if (att.roomSweep?.isVerified) {
        roomSweepCount++;
      }
    });

    const avgScore = Math.round((sumPercentage / total) * 10) / 10;
    const passRate = Math.round((passCount / total) * 100);
    const avgTimeMins = Math.round(totalTimeSec / total / 60);
    const sweepRate = Math.round((roomSweepCount / total) * 100);

    return {
      total,
      avgScore,
      passCount,
      failCount,
      malpracticeCount,
      passRate,
      avgTimeMins,
      roomSweepCount,
      sweepRate,
    };
  }, [filteredAttempts]);

  // 1. Performance Distribution Chart Data
  const distributionData = useMemo(() => {
    return SCORE_BUCKETS.map((bucket) => {
      const count = filteredAttempts.filter((a) => {
        const pct = a.percentageScore || 0;
        return pct >= bucket.min && pct <= bucket.max;
      }).length;

      return {
        range: bucket.range,
        candidates: count,
      };
    });
  }, [filteredAttempts]);

  // 2. Individual Candidate Ranking Chart Data
  const candidateScoresData = useMemo(() => {
    return filteredAttempts
      .map((a) => ({
        name: a.candidateName.split(' ')[0], // First name for clean x-axis
        fullName: a.candidateName,
        score: a.percentageScore || 0,
        points: a.totalScore || 0,
        status: a.status === 'TERMINATED_MALPRACTICE' ? 'Disqualified' : a.isPassed ? 'Passed' : 'Needs Review',
      }))
      .sort((a, b) => b.score - a.score);
  }, [filteredAttempts]);

  // 3. Pass / Fail & Integrity Ratio Chart Data
  const passFailRatioData = useMemo(() => {
    return [
      { name: 'Passed', value: metrics.passCount, color: PIE_COLORS.PASSED },
      { name: 'Needs Review', value: metrics.failCount, color: PIE_COLORS.FAILED },
      { name: 'Disqualified', value: metrics.malpracticeCount, color: PIE_COLORS.MALPRACTICE },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // 4. Section Completion Times Data
  const sectionTimesData = useMemo(() => {
    if (!activeTest) return [];

    return activeTest.sections.map((sec) => {
      // Calculate average time spent by candidates who submitted responses in this section
      let totalSpentSec = 0;
      let count = 0;

      filteredAttempts.forEach((att) => {
        let secTime = 0;
        sec.questions.forEach((q) => {
          if (att.responses[q.id]?.timeSpentSec) {
            secTime += att.responses[q.id].timeSpentSec;
          }
        });

        if (secTime > 0) {
          totalSpentSec += secTime;
          count++;
        }
      });

      const avgSpentMins = count > 0 ? Math.round(totalSpentSec / count / 60) : Math.round(sec.durationMin * 0.7);

      return {
        section: sec.title.split(' ')[0] + ' ' + (sec.title.split(' ')[1] || ''),
        fullTitle: sec.title,
        allocatedMins: sec.durationMin,
        actualSpentMins: avgSpentMins,
      };
    });
  }, [activeTest, filteredAttempts]);

  // 5. Section Performance & Accuracy Data
  const sectionPerformanceData = useMemo(() => {
    if (!activeTest) return [];

    return activeTest.sections.map((sec) => {
      let totalAwarded = 0;
      let count = 0;

      filteredAttempts.forEach((att) => {
        let secScore = 0;
        sec.questions.forEach((q) => {
          if (att.responses[q.id]?.scoreAwarded !== undefined) {
            secScore += att.responses[q.id].scoreAwarded || 0;
          }
        });
        totalAwarded += Math.max(0, secScore);
        count++;
      });

      const maxMarks = sec.totalMarks || sec.questions.reduce((a, b) => a + b.marks, 0);
      const avgScore = count > 0 ? Math.round((totalAwarded / count) * 10) / 10 : 0;
      const accuracyPct = maxMarks > 0 ? Math.round((avgScore / maxMarks) * 100) : 0;

      return {
        section: sec.title.split(' ')[0] + ' ' + (sec.title.split(' ')[1] || ''),
        avgScore,
        maxMarks,
        accuracyPct,
      };
    });
  }, [activeTest, filteredAttempts]);

  // Export analytics CSV helper
  const handleExportCSV = () => {
    const headers = ['Candidate Name', 'Candidate Email', 'Score', 'Percentage', 'Status', '360 Sweep', 'Infractions', 'Receipt'];
    const rows = filteredAttempts.map((a) => [
      `"${a.candidateName}"`,
      `"${a.candidateEmail}"`,
      a.totalScore ?? 'N/A',
      `${a.percentageScore ?? 'N/A'}%`,
      `"${a.status}"`,
      a.roomSweep?.isVerified ? `"${a.roomSweep.integrityScore}%"` : '"None"',
      a.infractionCount || 0,
      `"${a.confirmationReceipt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TakeMyTest_Analytics_Cohort_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner and Filter Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Institutional Cohort Analytics & Performance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual distribution of scores, section completion velocity, and pass/fail integrity metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Assessment Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Assessments ({attempts.length} Attempts)</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Outbox Emails Button */}
          <button
            onClick={onOpenEmailOutbox}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Dispatched Outbox ({emails.length})</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Evaluated Candidates
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across active cohort</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cohort Avg Score
            </span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.avgScore}%</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Pass benchmark: {activeTest?.passPercentage || 60}%</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pass / Clear Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{metrics.passRate}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{metrics.passCount} of {metrics.total} passed</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Avg Total Duration
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.avgTimeMins}m</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Budget: {activeTest?.totalDurationMin || 45} mins</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              360° Sweep Certified
            </span>
            <Compass className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-ink">{metrics.sweepRate}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{metrics.roomSweepCount} certified rooms</p>
        </div>
      </div>

      {/* Row 1: Score Distribution Bar Chart & Pass/Fail Ratio Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Candidate Performance Score Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Candidate frequency breakdown across score percentiles
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Cohort: {filteredAttempts.length}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Candidate(s)`, 'Count']}
                  labelFormatter={(lbl) => `Score Bracket: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="candidates" fill="#1558d6" radius={[6, 6, 0, 0]} name="Candidates Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass / Fail & Integrity Ratio Donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="mb-2 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">
              Pass / Fail & Integrity Ratios
            </h3>
            <p className="text-xs text-slate-400">
              Pass threshold compliance and malpractice disqualifications
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFailRatioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {passFailRatioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} candidate(s)`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner center text */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{metrics.passRate}%</span>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Clear Rate</span>
            </div>
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px] text-center">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
              <span className="block font-black text-sm">{metrics.passCount}</span>
              <span className="text-[10px] font-semibold">Passed</span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
              <span className="block font-black text-sm">{metrics.failCount}</span>
              <span className="text-[10px] font-semibold">Needs Review</span>
            </div>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-800">
              <span className="block font-black text-sm">{metrics.malpracticeCount}</span>
              <span className="text-[10px] font-semibold">Terminated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Average Section Completion Velocity & Section Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Completion Times Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Section Completion Velocity vs Time Budget
              </h3>
              <p className="text-xs text-slate-400">
                Comparing allocated time limits against candidate average completion time
              </p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionTimesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis unit="m" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} minutes`, name === 'allocatedMins' ? 'Allocated Budget' : 'Actual Avg Time']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTitle || 'Section'}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'allocatedMins' ? 'Allocated Budget (mins)' : 'Actual Avg Spent (mins)')}
                />
                <Bar dataKey="allocatedMins" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="allocatedMins" />
                <Bar dataKey="actualSpentMins" fill="#5b96f5" radius={[4, 4, 0, 0]} name="actualSpentMins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Accuracy & Marks Yield Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Section Accuracy & Point Yield
              </h3>
              <p className="text-xs text-slate-400">
                Average marks obtained versus maximum points possible per section
              </p>
            </div>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'avgScore' ? `${val} pts avg` : `${val} pts total`,
                    name === 'avgScore' ? 'Avg Scored' : 'Max Marks',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'avgScore' ? 'Avg Scored Marks' : 'Total Section Marks')}
                />
                <Bar dataKey="maxMarks" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="maxMarks" />
                <Bar dataKey="avgScore" fill="#1558d6" radius={[4, 4, 0, 0]} name="avgScore" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Cohort Candidate Performance Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Individual Candidate Performance Ranking
            </h3>
            <p className="text-xs text-slate-400">
              Comparative cohort score ranking with passing threshold reference line (60%)
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {candidateScoresData.length} Candidates
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={candidateScoresData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: any, _, item: any) => [
                  `${val}% (${item.payload.points} pts) • Status: ${item.payload.status}`,
                  'Percentage Score',
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || 'Candidate'}
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <ReferenceLine y={activeTest?.passPercentage || 60} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Pass Threshold: ${activeTest?.passPercentage || 60}%`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {candidateScoresData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.status === 'Disqualified'
                        ? '#ef4444'
                        : entry.score >= (activeTest?.passPercentage || 60)
                        ? '#1558d6'
                        : '#94a3b8'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
