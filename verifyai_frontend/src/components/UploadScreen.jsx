import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';

export default function UploadScreen({ onVerify, file1, setFile1, file2, setFile2 }) {
  const file1InputRef = useRef(null);
  const file2InputRef = useRef(null);

  const [dragOver1, setDragOver1] = useState(false);
  const [dragOver2, setDragOver2] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (file, docNumber) => {
    setErrorMsg('');
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const isValid = validTypes.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);

    if (!isValid) {
      setErrorMsg(`"${file.name}" is not a supported file type. Please upload PDF, JPG, or PNG.`);
      return;
    }

    if (docNumber === 1) {
      setFile1(file);
    } else {
      setFile2(file);
    }
  };

  const handleDrop = (e, docNumber) => {
    e.preventDefault();
    if (docNumber === 1) setDragOver1(false);
    if (docNumber === 2) setDragOver2(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0], docNumber);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Quick Demo mock file loader for instant zero-friction testing
  const loadDemoFiles = () => {
    setErrorMsg('');
    const mockFile1 = new File(['%PDF-1.4 demo affiliation'], 'affiliation_certificate.pdf', {
      type: 'application/pdf',
    });
    const mockFile2 = new File(['%PDF-1.4 demo faculty'], 'faculty_form.pdf', {
      type: 'application/pdf',
    });
    setFile1(mockFile1);
    setFile2(mockFile2);
  };

  const isReady = Boolean(file1 && file2);

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-md border border-slate-200">
      {/* Header section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Automated Cross-Document Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Documents for Verification
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
          Upload two documents. Our AI will extract fields, classify document types, and detect discrepancies.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Two file drop zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {/* Document 1 Dropzone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Document 1
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver1(true);
            }}
            onDragLeave={() => setDragOver1(false)}
            onDrop={(e) => handleDrop(e, 1)}
            onClick={() => file1InputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 min-h-[190px] flex flex-col justify-center items-center ${
              dragOver1
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : file1
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
            }`}
          >
            <input
              type="file"
              ref={file1InputRef}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => handleFileChange(e.target.files?.[0], 1)}
              className="hidden"
            />

            {file1 ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                  <FileCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900 truncate max-w-full px-2" title={file1.name}>
                  {file1.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(file1.size) || 'PDF Document'}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile1(null);
                  }}
                  className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Select Document 1
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click to browse or drag & drop
                </p>
                <span className="mt-3 inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-200 text-slate-700">
                  PDF, JPG, PNG
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Document 2 Dropzone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Document 2
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver2(true);
            }}
            onDragLeave={() => setDragOver2(false)}
            onDrop={(e) => handleDrop(e, 2)}
            onClick={() => file2InputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 min-h-[190px] flex flex-col justify-center items-center ${
              dragOver2
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : file2
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
            }`}
          >
            <input
              type="file"
              ref={file2InputRef}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => handleFileChange(e.target.files?.[0], 2)}
              className="hidden"
            />

            {file2 ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                  <FileCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900 truncate max-w-full px-2" title={file2.name}>
                  {file2.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(file2.size) || 'PDF Document'}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile2(null);
                  }}
                  className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Select Document 2
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click to browse or drag & drop
                </p>
                <span className="mt-3 inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-200 text-slate-700">
                  PDF, JPG, PNG
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        disabled={!isReady}
        onClick={onVerify}
        className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:shadow-none flex items-center justify-center gap-2 group"
      >
        <span>Run AI Verification</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />
      </button>

      {/* Helper text and demo quick-loader */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs text-slate-500">
          Demo mode: try any two PDFs — mock data will be returned.
        </p>

        <button
          type="button"
          onClick={loadDemoFiles}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
        >
          Auto-fill Sample PDFs
        </button>
      </div>
    </div>
  );
}
