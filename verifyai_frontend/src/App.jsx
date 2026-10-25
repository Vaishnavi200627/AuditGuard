import React, { useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import UploadScreen from './components/UploadScreen';
import DashboardScreen from './components/DashboardScreen';
import Loader from './components/Loader';
import { verifyDocuments, reverify, downloadReport } from './api/realApi';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('upload'); // 'upload' | 'dashboard'
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [verificationData, setVerificationData] = useState(null);

  const handleStartVerification = async (selectedFiles) => {
    const filesToVerify = Array.isArray(selectedFiles) && selectedFiles.length > 0
      ? selectedFiles
      : files;

    if (!filesToVerify || filesToVerify.length < 2) {
      alert('Please select at least 2 documents to verify.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await verifyDocuments(filesToVerify);
      setVerificationData(result);
      setCurrentScreen('dashboard');
    } catch (err) {
      console.error('Error verifying documents:', err);
      alert(err.message || 'An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveFinding = async (findingId, correctedValue) => {
    try {
      await reverify(findingId, correctedValue);

      // Update finding in state
      setVerificationData((prev) => {
        if (!prev) return prev;
        let resolvedField = '';
        const updatedFindings = prev.findings.map((f) => {
          if (f.id === findingId || f.finding_id === findingId) {
            resolvedField = f.field;
            return {
              ...f,
              doc2_value: correctedValue,
              resolved: true,
            };
          }
          return f;
        });

        const allResolved = updatedFindings.every((f) => f.resolved);

        // Synchronize extracted_data table
        const updatedExtractedData = (prev.extracted_data || []).map((row) => {
          if (row.field === resolvedField) {
            return {
              ...row,
              doc2_val: correctedValue,
              match_status: 'MATCH',
            };
          }
          return row;
        });

        // Synchronize compliance_rules checklist
        const updatedRules = (prev.compliance_rules || []).map((rule) => {
          if (resolvedField === 'Registration Number' && rule.rule_id === 'CONS-001') {
            return { ...rule, status: 'PASSED' };
          }
          if (resolvedField === 'Institution Name' && rule.rule_id === 'SIM-003') {
            return { ...rule, status: 'PASSED' };
          }
          return rule;
        });

        return {
          ...prev,
          status: allResolved ? 'PASS' : prev.status,
          extracted_data: updatedExtractedData,
          compliance_rules: updatedRules,
          findings: updatedFindings,
        };
      });
    } catch (err) {
      console.error('Failed to re-verify finding:', err);
      alert('Re-verification failed. Please try again.');
      throw err;
    }
  };

  const handleStartOver = () => {
    setFiles([]);
    setFile1(null);
    setFile2(null);
    setVerificationData(null);
    setCurrentScreen('upload');
  };

  const handleDownloadReport = async () => {
    if (!verificationData) return;

    try {
      const blob = await downloadReport(verificationData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AuditGuard_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download report error:', err);
      alert(err.message || 'Failed to download report.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  AuditGuard
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  GovTech Audit Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Regulatory Compliance & Document Authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-700">Audit Engine Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-8">
        {currentScreen === 'upload' && (
          <UploadScreen
            onVerify={handleStartVerification}
            files={files}
            setFiles={setFiles}
            file1={file1}
            setFile1={setFile1}
            file2={file2}
            setFile2={setFile2}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            data={verificationData}
            onResolveFinding={handleResolveFinding}
            onStartOver={handleStartOver}
            onDownloadReport={handleDownloadReport}
          />
        )}
      </main>

      {/* Full-screen Loader Overlay */}
      {isLoading && <Loader />}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© 2026 AuditGuard Systems. Built for regulatory compliance & document integrity.</p>
          <p className="text-slate-400">Strict Enterprise Standards • ISO/IEC 27001 Ready</p>
        </div>
      </footer>
    </div>
  );
}
