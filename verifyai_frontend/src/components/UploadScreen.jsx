import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Trash2,
  Files,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export default function UploadScreen({
  onVerify,
  files = [],
  setFiles,
  // Backwards compatibility props in case App passes file1/file2
  file1,
  setFile1,
  file2,
  setFile2,
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize files array from props or local state
  const currentFiles = Array.isArray(files) && files.length > 0
    ? files
    : [file1, file2].filter(Boolean);

  const updateFiles = (newFilesList) => {
    if (typeof setFiles === 'function') {
      setFiles(newFilesList);
    }
    // Also sync legacy file1 & file2 if available
    if (typeof setFile1 === 'function') setFile1(newFilesList[0] || null);
    if (typeof setFile2 === 'function') setFile2(newFilesList[1] || null);
  };

  const validateAndAddFiles = (incomingFileList) => {
    setErrorMsg('');
    if (!incomingFileList || incomingFileList.length === 0) return;

    const incomingArray = Array.from(incomingFileList);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const validNewFiles = [];

    for (const file of incomingArray) {
      const isValid = validTypes.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
      if (!isValid) {
        setErrorMsg(`"${file.name}" is not a supported file type. Supported types: PDF, JPG, PNG.`);
        return;
      }
      // Avoid duplicate by name if already in list
      if (!currentFiles.some((f) => f.name === file.name)) {
        validNewFiles.push(file);
      }
    }

    const merged = [...currentFiles, ...validNewFiles];

    if (merged.length > 10) {
      setErrorMsg(`Maximum 10 documents allowed at once. You selected ${merged.length} files.`);
      updateFiles(merged.slice(0, 10));
      return;
    }

    updateFiles(merged);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset input value so same files can be re-selected if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setErrorMsg('');
    const updated = currentFiles.filter((_, idx) => idx !== indexToRemove);
    updateFiles(updated);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Quick Demo mock file loader: adds 3 demo documents (1 Primary + 2 Supporting)
  const loadDemoFiles = () => {
    setErrorMsg('');
    const mock1 = new File(['%PDF-1.4 demo primary affiliation'], 'affiliation_certificate.pdf', {
      type: 'application/pdf',
    });
    const mock2 = new File(['%PDF-1.4 demo supporting faculty'], 'faculty_form.pdf', {
      type: 'application/pdf',
    });
    const mock3 = new File(['%PDF-1.4 demo land deed'], 'land_deed_document.pdf', {
      type: 'application/pdf',
    });
    updateFiles([mock1, mock2, mock3]);
  };

  const isReady = currentFiles.length >= 2 && currentFiles.length <= 10;

  const handleVerifyClick = () => {
    if (!isReady) {
      if (currentFiles.length < 2) {
        setErrorMsg('Please upload at least 2 documents to begin cross-verification.');
      } else if (currentFiles.length > 10) {
        setErrorMsg('Please select a maximum of 10 documents.');
      }
      return;
    }
    onVerify(currentFiles);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 sm:p-8 bg-white rounded-2xl shadow-md border border-slate-200 animate-fadeIn">
      {/* Header section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Multi-Document AICTE Audit Suite
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Documents for Verification
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Upload 2 to 10 documents. The <span className="font-semibold text-slate-700">First Document</span> acts as the{' '}
          <span className="font-semibold text-indigo-600">Primary Reference</span>, and all supporting documents will be cross-validated against it.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Single Large Drag-and-Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 min-h-[220px] flex flex-col justify-center items-center ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-2xs border border-indigo-100">
          <UploadCloud className="w-7 h-7" />
        </div>

        <p className="text-base font-bold text-slate-900">
          Drag & drop documents here, or <span className="text-indigo-600 underline">browse files</span>
        </p>
        <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
          Select multiple files simultaneously. Supports PDF, JPG, and PNG documents (up to 10 files).
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200/80 text-slate-700">
            PDF, JPG, PNG
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
            Min 2 • Max 10 Files
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
            {currentFiles.length} / 10 Selected
          </span>
        </div>
      </div>

      {/* Uploaded File List Display */}
      {currentFiles.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Files className="w-4 h-4 text-indigo-600" />
              Uploaded Document Queue ({currentFiles.length}/10)
            </h3>
            <span className="text-xs text-slate-500">
              #1 is Primary Reference
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden shadow-2xs">
            {currentFiles.map((file, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="px-4 py-3 sm:px-5 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {isPrimary ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          #1 Primary Reference
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                          #{idx + 1} Supporting
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size) || 'Document'} • {file.type || 'Binary file'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(idx);
                    }}
                    title={`Remove ${file.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Verification Action Button */}
      <div className="mt-8">
        <button
          type="button"
          disabled={!isReady}
          onClick={handleVerifyClick}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:shadow-none flex items-center justify-center gap-2 group"
        >
          <span>
            {currentFiles.length < 2
              ? `Select at least 2 documents (${currentFiles.length}/2)`
              : `Run AI Verification (${currentFiles.length} Documents)`}
          </span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />
        </button>
      </div>

      {/* Helper text and demo quick-loader */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs text-slate-500">
          Upload up to 10 files. All supporting files will be audited against Document #1.
        </p>

        <button
          type="button"
          onClick={loadDemoFiles}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
        >
          Auto-fill 3 Sample Documents
        </button>
      </div>
    </div>
  );
}
