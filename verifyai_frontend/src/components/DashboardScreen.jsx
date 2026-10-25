import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  RotateCcw,
  FileText,
  ShieldAlert,
  Sparkles,
  Layers,
  Table as TableIcon,
  CheckSquare,
  Building2,
  Loader2,
  Database,
  Calendar,
  Clock,
} from 'lucide-react';
import MismatchCard from './MismatchCard';
import Badge from './Badge';
import { getAuditHistory } from '../api/realApi';

export default function DashboardScreen({
  data,
  onResolveFinding,
  onStartOver,
  onDownloadReport,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);
        const records = await getAuditHistory();
        if (isMounted) {
          setHistory(records);
        }
      } catch (err) {
        console.error('Failed to load audit history:', err);
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [data]);


  if (!data) return null;

  const {
    status = 'NEEDS_REVIEW',
    documents = [],
    extracted_data = [],
    compliance_rules = [],
    findings = [],
    authenticity_warnings = [],
    ai_summary = 'VerifyAI has analyzed the submitted application. Review the evidence below for compliance verification.',
  } = data;

  const unresolvedFindings = findings.filter((f) => !f.resolved);
  const unresolvedCount = unresolvedFindings.length;
  const isAllResolved = unresolvedCount === 0;

  // Extract any suspicious alteration warnings from metadata check
  const detectedAlterationWarnings = [];
  authenticity_warnings.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      if (item.doc1 && item.doc1 !== 'Clean' && item.doc1 !== 'Error') {
        detectedAlterationWarnings.push(`Document 1: ${item.doc1}`);
      }
      if (item.doc2 && item.doc2 !== 'Clean' && item.doc2 !== 'Error') {
        detectedAlterationWarnings.push(`Document 2: ${item.doc2}`);
      }
      if (item.message) {
        detectedAlterationWarnings.push(item.message);
      }
    } else if (typeof item === 'string' && item !== 'Clean' && item !== 'Error') {
      detectedAlterationWarnings.push(item);
    }
  });

  // Determine current display status
  let effectiveStatus = isAllResolved ? 'PASS' : status.toUpperCase();
  if (!isAllResolved && effectiveStatus === 'PASS') {
    effectiveStatus = 'NEEDS_REVIEW';
  }

  // Status banner styling & config
  const statusConfig = {
    PASS: {
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      badgeVariant: 'green',
      icon: CheckCircle2,
      title: 'Audit Status: PASS',
      subtitle: 'All cross-document consistency checks and AICTE compliance rules satisfied without conflict.',
    },
    FAIL: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-900',
      iconColor: 'text-red-600',
      badgeVariant: 'red',
      icon: AlertTriangle,
      title: 'Audit Status: FAIL',
      subtitle: `${unresolvedCount} critical discrepancy found. Documents do not comply with regulatory mandates.`,
    },
    NEEDS_REVIEW: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-900',
      iconColor: 'text-amber-600',
      badgeVariant: 'amber',
      icon: AlertCircle,
      title: 'Audit Status: NEEDS_REVIEW',
      subtitle: `${unresolvedCount} discrepancy requiring reviewer inspection before final accreditation sign-off.`,
    },
  }[effectiveStatus] || {
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-600',
    badgeVariant: 'amber',
    icon: AlertCircle,
    title: `Audit Status: ${effectiveStatus}`,
    subtitle: `${unresolvedCount} item(s) require manual review.`,
  };

  const StatusIcon = statusConfig.icon;

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);
      await onDownloadReport();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-7 animate-fadeIn">
      {/* Top Header & AICTE Reviewer Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              AICTE Reviewer Portal • 6-Module Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Audit ID: VER-2026-X89
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Institutional Compliance Audit Dashboard
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadClick}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-xs hover:border-slate-400 transition-all duration-200 disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <Download className="w-4 h-4 text-slate-600" />
            )}
            <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>

          <button
            type="button"
            onClick={onStartOver}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* 1. ✨ AI AUDITOR SUMMARY CARD (Purple/Blue Generative AI Card) */}
      <section aria-label="AI Auditor Summary">
        <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-lg border border-indigo-700/60 relative overflow-hidden">
          {/* Decorative ambient gradient circles */}
          <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-amber-300 shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  ✨ AI Auditor Summary
                </h3>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/10 text-indigo-100 border border-white/15 backdrop-blur-xs">
                Generative Intelligence
              </span>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-indigo-50 font-medium">
              {ai_summary}
            </p>
          </div>
        </div>
      </section>

      {/* 2. OVERALL STATUS BANNER */}
      <section aria-label="Audit Status Banner">
        <div
          className={`w-full rounded-2xl border-l-8 p-6 shadow-sm transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor}`}
        >
          <div className="shrink-0 p-2.5 rounded-xl bg-white/80 shadow-xs">
            <StatusIcon className={`w-8 h-8 ${statusConfig.iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">
                {statusConfig.title}
              </h2>
              <Badge variant={statusConfig.badgeVariant}>
                {effectiveStatus}
              </Badge>
            </div>
            <p className="text-sm mt-1 opacity-90 font-medium">
              {statusConfig.subtitle}
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200/60 shadow-2xs">
            AICTE Regulatory Standard v4.2
          </div>
        </div>
      </section>

      {/* Quick KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Fields Extracted
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {extracted_data.length}
          </span>
          <span className="text-xs text-slate-500 block mt-1">Autonomous OCR</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Rules Evaluated
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {compliance_rules.length}
          </span>
          <span className="text-xs text-emerald-600 font-medium block mt-1">
            {compliance_rules.filter((r) => r.status === 'PASSED').length} Passed
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Flagged Mismatches
          </span>
          <span className={`text-2xl font-bold ${unresolvedCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {unresolvedCount}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            {isAllResolved ? 'All Resolved' : 'Requires Action'}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Source Documents
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {documents.length || 2}
          </span>
          <span className="text-xs text-indigo-600 font-medium block mt-1">Cross-Validated</span>
        </div>
      </div>

      {/* 3. EXTRACTED DATA TABLE */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Extracted Data Comparison Table
              </h3>
              <p className="text-xs text-slate-500">
                Direct side-by-side values extracted from Document 1 and Document 2
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {extracted_data.length} Fields Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th scope="col" className="px-6 py-3.5">
                  Field
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Document 1 Value
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Document 2 Value
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {extracted_data.map((row, idx) => {
                const isMismatch = row.match_status?.toUpperCase() === 'MISMATCH';
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isMismatch ? 'bg-red-50/30' : 'bg-white'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {row.field}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700 break-all">
                      {row.doc1_val || 'NOT_FOUND'}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700 break-all">
                      {row.doc2_val || 'NOT_FOUND'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isMismatch ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          MISMATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          MATCH
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. COMPLIANCE RULES CHECKLIST (With Metadata Alteration Alert Box) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Compliance Rules Engine Checklist
              </h3>
              <p className="text-xs text-slate-500">
                Automated statutory and regulatory rules evaluated by VerifyAI
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Rules Module Active
          </span>
        </div>

        {/* Suspicious Alteration / Metadata Warning Box (Red/Orange Alert Box) */}
        {detectedAlterationWarnings.length > 0 && (
          <div className="m-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 border-l-4 border-l-orange-500 shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
                    Suspicious Alteration Detected in Document Metadata
                  </span>
                  <Badge variant="amber">High Risk Flag</Badge>
                </div>
                <div className="space-y-1 my-1.5">
                  {detectedAlterationWarnings.map((warn, wIdx) => (
                    <p key={wIdx} className="text-sm font-semibold text-orange-950">
                      • {warn}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Document metadata indicates creation or editing in third-party graphic editing software (e.g., Canva, Photoshop). Regulatory accreditation requires verification against physical records.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {compliance_rules.map((rule, idx) => {
            const isPassed = rule.status?.toUpperCase() === 'PASSED';
            return (
              <div
                key={rule.rule_id || idx}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {rule.rule_id}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {rule.description}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-auto">
                  <Badge variant={isPassed ? 'green' : 'red'}>
                    {isPassed ? '✓ PASSED' : '✗ FAILED'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. EVIDENCE-LINKED FINDINGS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Evidence-Linked Discrepancy Findings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review flagged evidence, inspect differences, and apply recommended auditor actions
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 self-start sm:self-auto">
            {findings.length} Finding{findings.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        {findings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900">
              Zero Discrepancies Detected
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All document identifiers, institution titles, and regulatory criteria match perfectly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map((finding) => (
              <MismatchCard
                key={finding.id || finding.finding_id}
                finding={finding}
                onResolve={onResolveFinding}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. RECENT AUDITS TABLE (TASK 1: Enterprise Database Layer - SQLite verifyai.db) */}
      <section aria-label="Recent Audits" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Recent Audits
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records persisted to SQLite database (<span className="font-mono text-indigo-700">verifyai.db</span>)
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live DB Synchronized
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {isLoadingHistory ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading audit history from database...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No recent audits found in the database.</p>
              <p className="text-xs text-slate-400 mt-0.5">Completed document verifications will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-6">Institution</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {history.map((audit, index) => {
                    const isPass = (audit.status || '').toUpperCase() === 'PASS';
                    return (
                      <tr
                        key={audit.id || index}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <span className="truncate max-w-xs sm:max-w-md">
                              {audit.institution_name || 'Unknown Institution'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <Badge variant={isPass ? 'green' : 'amber'}>
                            {isPass ? '✓ PASS' : '⚠ NEEDS_REVIEW'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6 text-xs text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{audit.timestamp || 'Just now'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

