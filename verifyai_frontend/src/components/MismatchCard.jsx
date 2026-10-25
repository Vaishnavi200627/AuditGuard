import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  X,
  Loader2,
  FileText,
  ShieldAlert,
  ArrowRightCircle,
  Scan,
  Eye,
  Sparkles,
} from 'lucide-react';
import Badge from './Badge';

export default function MismatchCard({ finding, onResolve }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(finding.doc2_value);
  const [isSaving, setIsSaving] = useState(false);

  // Sync editValue if finding props update
  useEffect(() => {
    setEditValue(finding.doc2_value);
  }, [finding.doc2_value]);

  const severity = (finding.severity || 'HIGH').toLowerCase();

  // Severity config
  const severityConfig = {
    high: {
      badgeVariant: 'red',
      badgeText: 'HIGH SEVERITY',
      borderColor: finding.resolved ? 'border-l-emerald-500' : 'border-l-red-500',
    },
    medium: {
      badgeVariant: 'amber',
      badgeText: 'MEDIUM SEVERITY',
      borderColor: finding.resolved ? 'border-l-emerald-500' : 'border-l-amber-500',
    },
    low: {
      badgeVariant: 'slate',
      badgeText: 'LOW SEVERITY',
      borderColor: finding.resolved ? 'border-l-emerald-500' : 'border-l-slate-400',
    },
  }[severity] || {
    badgeVariant: 'red',
    badgeText: 'HIGH SEVERITY',
    borderColor: finding.resolved ? 'border-l-emerald-500' : 'border-l-red-500',
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onResolve(finding.id, editValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to resolve finding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(finding.doc2_value);
    setIsEditing(false);
  };

  const isResolved = Boolean(finding.resolved);

  return (
    <div
      className={`bg-white rounded-xl shadow-xs hover:shadow-md border border-slate-200 border-l-4 ${severityConfig.borderColor} p-6 transition-all duration-200`}
    >
      {/* Top Row: Severity badge, Field name & Finding ID */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Badge variant={isResolved ? 'green' : severityConfig.badgeVariant}>
            {isResolved ? 'RESOLVED' : severityConfig.badgeText}
          </Badge>
          <h4 className="text-base font-bold text-slate-900 tracking-tight">
            {finding.field}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Finding: {finding.id || finding.finding_id}
          </span>
        </div>
      </div>

      {/* Discrepancy Reason */}
      {finding.reason && (
        <div className="pt-3 pb-1 text-xs text-slate-600 font-medium">
          <span className="text-red-600 font-bold">Observation: </span>
          {finding.reason}
        </div>
      )}

      {/* Middle: Two-column grid with comparison */}
      <div className="py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative items-stretch">
          {/* Doc 1 Value */}
          <div
            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
              isResolved
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-red-50/70 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Document 1 Value
              </span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono break-all">
              {finding.doc1_value}
            </div>
          </div>

          {/* Center icon indicator */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center">
            {isResolved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          {/* Doc 2 Value */}
          <div
            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
              isResolved
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-red-50/70 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Document 2 Value
              </span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="mt-1">
                <input
                  type="text"
                  autoFocus
                  disabled={isSaving}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter corrected value..."
                  className="w-full px-3 py-2 text-base font-semibold bg-white text-slate-900 border-2 border-indigo-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all duration-200 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Re-verifying...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save & Re-verify
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-base sm:text-lg font-bold font-mono break-all">
                {finding.doc2_value}
              </div>
            )}
          </div>
        </div>

        {/* TASK 1: THE EVIDENCE BOUNDING BOX (Visual mockup of PDF document) */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-indigo-600" />
              AI Vision Extraction: {finding.field}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              <Eye className="w-3 h-3 text-indigo-500" />
              Vision B-Box: [X:142 Y:318 W:280 H:45] • Page 1
            </span>
          </div>

          {/* Grey box container representing the PDF document viewer frame */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-200/80 border border-slate-300 shadow-inner">
            {/* White inner area representing the physical document sheet */}
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-xs border border-slate-200 relative overflow-hidden font-serif">
              {/* Document header bar */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 text-[11px] text-slate-400 font-sans">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">
                    {finding.doc_name || 'Statutory_Compliance_Form.pdf'}
                  </span>
                </div>
                <span className="text-[10px] font-mono">DPI: 300 • Spatial Coordinate Mapping</span>
              </div>

              {/* Simulated document paragraphs */}
              <div className="space-y-2 text-xs text-slate-500 select-none">
                <div className="h-2 w-3/4 bg-slate-100 rounded" />
                <div className="h-2 w-2/3 bg-slate-100 rounded" />

                {/* Targeted text inside red dashed bounding box */}
                <div className="py-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-700 font-sans font-medium">
                    Clause Extract:
                  </span>
                  <div className="inline-block relative">
                    <span className="inline-flex items-center px-3 py-1.5 rounded border-2 border-dashed border-red-500 bg-red-50 text-red-950 font-mono font-bold text-sm shadow-xs">
                      {finding.doc2_value || finding.doc1_value || 'Value Extracted'}
                    </span>
                    <span className="absolute -top-2.5 -right-1 text-[9px] font-sans font-extrabold uppercase px-1.5 py-0.2 rounded bg-red-600 text-white tracking-wider shadow-2xs">
                      Mismatch Region
                    </span>
                  </div>
                </div>

                <div className="h-2 w-5/6 bg-slate-100 rounded" />
                <div className="h-2 w-1/2 bg-slate-100 rounded" />
              </div>

              {/* Document footer notice */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                <span>AICTE Statutory Verification Bureau</span>
                <span className="font-mono text-emerald-600 font-semibold">OCR Confidence: 98.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Action Box */}
        {finding.recommended_action && (
          <div className="mt-3.5 flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-950">
            <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block mb-0.5">
                Recommended Action
              </span>
              <p className="text-xs font-semibold leading-relaxed">
                {finding.recommended_action}
              </p>
            </div>
          </div>
        )}

        {/* Resolved chip */}
        {isResolved && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Resolved by AICTE Reviewer
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action: Edit & Re-verify (when unresolved and not currently editing) */}
      {!isResolved && !isEditing && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Click edit to resolve discrepancy before final report sign-off.
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-semibold transition-all duration-200 group"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            Edit & Re-verify
          </button>
        </div>
      )}
    </div>
  );
}
