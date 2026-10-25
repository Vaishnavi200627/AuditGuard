import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

const MESSAGES = [
  'Extracting text from documents...',
  'Classifying document types...',
  'Cross-checking fields...',
  'Analyzing authenticity metadata...',
  'Generating verification report...',
];

export default function Loader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-4 transition-all duration-300"
    >
      <div className="flex flex-col items-center max-w-md w-full text-center px-6 py-8 rounded-2xl bg-white shadow-xl border border-slate-100">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          AI Verification in Progress
        </h3>

        <div className="h-8 flex items-center justify-center">
          <p
            key={messageIndex}
            className="text-sm font-medium text-slate-600 transition-opacity duration-200 animate-pulse"
          >
            {MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Dynamic progress bar visual */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((messageIndex + 1) / MESSAGES.length) * 100}%` }}
          />
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Regulatory cross-validation engine active
        </p>
      </div>
    </div>
  );
}
