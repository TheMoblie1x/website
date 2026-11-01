import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  parseSpreadsheetData,
  parseExcelOrCsvFile,
  parseCsvText,
  generateSampleCsv,
  convertIngestedRowsToSections,
  IngestionResult,
} from '../utils/excelParser';
import { Test } from '../types/testforge';

interface BulkIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTest: Test;
  onCommitQuestions: (testId: string, newSections: any[]) => void;
}

export const BulkIngestionModal: React.FC<BulkIngestionModalProps> = ({
  isOpen,
  onClose,
  targetTest,
  onCommitQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PASTE'>('UPLOAD');
  const [csvText, setCsvText] = useState(generateSampleCsv());
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseExcelOrCsvFile(buffer);
        setIngestionResult(result);
      } catch (err: any) {
        alert('Failed to parse Excel file: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleParseCsvText = () => {
    setIsProcessing(true);
    try {
      const result = parseCsvText(csvText);
      setIngestionResult(result);
    } catch (err: any) {
      alert('Error parsing CSV input: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSample = () => {
    const sample = generateSampleCsv();
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'takemytest_question_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommit = () => {
    if (!ingestionResult || ingestionResult.validRows.length === 0) return;
    const newSections = convertIngestedRowsToSections(
      targetTest.id,
      ingestionResult.groupedSections
    );
    onCommitQuestions(targetTest.id, newSections);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Bulk Question Ingestion & Validation Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Ingest hundreds of questions via Excel (.xlsx) or CSV with strict invariant checking.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ingestion Mode Toggle & Sample Downloader */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'UPLOAD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload Excel / CSV
            </button>
            <button
              onClick={() => setActiveTab('PASTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'PASTE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste CSV / Template
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download Compliant Template (.csv)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'UPLOAD' ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/50 transition">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                Choose an Excel (.xlsx, .xls) or CSV spreadsheet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Enforces formula sanitization, header normalization, and empty option checks automatically.
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                <span>Select Spreadsheet File</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileName && (
                <p className="text-xs font-mono font-semibold text-slate-700 mt-3">
                  Selected: {fileName}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Spreadsheet CSV Input:
                </label>
                <button
                  onClick={() => setCsvText(generateSampleCsv())}
                  className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Load Pre-filled Multi-Type Sample
                </button>
              </div>
              <textarea
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleParseCsvText}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Validate Spreadsheet Data
              </button>
            </div>
          )}

          {/* Validation Report Surface */}
          {ingestionResult && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Validation Results & Section Breakdown
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Total Rows: {ingestionResult.totalRows}
                </span>
              </div>

              {/* Status Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Valid Questions</span>
                  <p className="text-xl font-extrabold text-emerald-800">
                    {ingestionResult.validRows.length}
                  </p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-[10px] font-bold text-red-700 uppercase">Rejected Rows</span>
                  <p className="text-xl font-extrabold text-red-800">
                    {ingestionResult.invalidRows.length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Warnings / Defaults</span>
                  <p className="text-xl font-extrabold text-amber-800">
                    {ingestionResult.allWarnings.length}
                  </p>
                </div>
              </div>

              {/* Errors Log if any */}
              {ingestionResult.allErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-xs text-red-800">
                  <div className="font-bold flex items-center gap-1.5 text-red-950">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Parsing Invariant Violations:</span>
                  </div>
                  {ingestionResult.allErrors.map((err, idx) => (
                    <div key={idx} className="font-mono pl-5">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}

              {/* Grouped Sections Preview */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700">Sections to be Ingested:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(ingestionResult.groupedSections).map(([secName, rows]) => (
                    <div key={secName} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{secName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {rows.length} questions
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Total Marks: {rows.reduce((acc, r) => acc + r.marks, 0)} pts • Types:{' '}
                        {Array.from(new Set(rows.map((r) => r.questionType))).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            disabled={!ingestionResult || ingestionResult.validRows.length === 0}
            onClick={handleCommit}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Commit {ingestionResult?.validRows.length || 0} Questions to Assessment
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
