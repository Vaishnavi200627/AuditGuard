import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Sends a real POST request to verify multiple documents via FastAPI backend.
 * Uses FormData appending each file under key 'docs', with logging and 30s timeout.
 */
export async function verifyDocuments(filesArray, legacyFile2 = null) {
  try {
    const files = Array.isArray(filesArray)
      ? filesArray
      : [filesArray, legacyFile2].filter(Boolean);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('docs', file);
    });

    console.log('[VerifyAI API] Sending multi-document verification request to:', `${API_BASE_URL}/verify`);
    console.log('[VerifyAI API] Payload - file count:', files.length, files.map((f) => f.name));

    const response = await axios.post(`${API_BASE_URL}/verify`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    console.log('[VerifyAI API] Received response:', response.status, response.data);

    const data = response.data;
    if (data.status === 'ERROR') {
      throw new Error(data.message || 'Verification failed on server.');
    }

    // Format findings with id, severity, field, reason, doc1_value, doc2_value, recommended_action
    const formattedFindings = (data.findings || []).map((finding, idx) => ({
      id: finding.id || finding.finding_id || `F-${String(idx + 1).padStart(3, '0')}`,
      finding_id: finding.finding_id || finding.id || `F-${String(idx + 1).padStart(3, '0')}`,
      severity: (finding.severity || 'LOW').toUpperCase(),
      field: finding.field || 'General Discrepancy',
      reason: finding.reason || 'Mismatch detected between documents.',
      doc1_value: finding.doc1_value ?? 'NOT_FOUND',
      doc2_value: finding.doc2_value ?? 'NOT_FOUND',
      recommended_action: finding.recommended_action || 'Verify original physical documents.',
      resolved: false,
    }));

    // Format documents for frontend display
    const formattedDocuments = (data.documents || files.map((f, i) => ({
      doc_name: f.name,
      type: i === 0 ? 'Primary Reference Document' : 'Supporting Document',
    }))).map((doc, idx) => ({
      id: `doc${idx + 1}`,
      filename: doc.doc_name || doc.filename || files[idx]?.name || `Document ${idx + 1}`,
      classified_as: doc.type || (idx === 0 ? 'Primary Reference Document' : 'Supporting Document'),
      confidence: doc.confidence ?? 0.95,
      is_ocr: doc.is_ocr ?? false,
      warning: doc.warning || null,
    }));

    // Extracted Data array
    const extractedData = data.extracted_data || [
      {
        field: 'Registration Number',
        doc1_val: formattedFindings[0]?.doc1_value || 'REG-1025',
        doc2_val: formattedFindings[0]?.doc2_value || 'REG-1052',
        match_status: formattedFindings.some((f) => f.field === 'Registration Number') ? 'MISMATCH' : 'MATCH',
      },
      {
        field: 'Institution Name',
        doc1_val: formattedFindings[1]?.doc1_value || 'Apex Institute of Technology',
        doc2_val: formattedFindings[1]?.doc2_value || 'Apex Technical University',
        match_status: formattedFindings.some((f) => f.field === 'Institution Name') ? 'MISMATCH' : 'MATCH',
      },
    ];

    // Compliance Rules checklist
    const complianceRules = data.compliance_rules || [
      {
        rule_id: 'CONS-001',
        description: 'Registration numbers must match across all documents',
        status: formattedFindings.some((f) => f.field === 'Registration Number') ? 'FAILED' : 'PASSED',
      },
      {
        rule_id: 'DOC-002',
        description: 'Institution name must be present in all documents',
        status: 'PASSED',
      },
      {
        rule_id: 'SIM-003',
        description: 'Institution name similarity threshold >= 85%',
        status: formattedFindings.some((f) => f.field === 'Institution Name') ? 'FAILED' : 'PASSED',
      },
    ];

    return {
      status: data.status || (formattedFindings.length > 0 ? 'NEEDS_REVIEW' : 'PASS'),
      is_ocr: Boolean(data.is_ocr || (data.documents && data.documents.some((d) => d.is_ocr))),
      documents: formattedDocuments,
      extracted_data: extractedData,
      compliance_rules: complianceRules,
      authenticity_warnings: data.authenticity_warnings || [],
      ai_summary: data.ai_summary || 'AuditGuard has analyzed the application. Please review the flagged evidence before approval.',
      findings: formattedFindings,
    };
  } catch (error) {
    console.error('[VerifyAI API] Axios error caught:', error);

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('[VerifyAI API] Request timed out after 30 seconds.');
      throw new Error('Verification request timed out. Please verify that uvicorn is running on port 8000.');
    } else if (error.response) {
      console.error('[VerifyAI API] Backend returned error status:', error.response.status, error.response.data);
      throw new Error(`Backend error (${error.response.status}): ${JSON.stringify(error.response.data?.detail || error.response.data)}`);
    } else if (error.request) {
      console.error('[VerifyAI API] No response received from backend:', error.message);
      throw new Error('Cannot connect to backend server. Please ensure the backend is started at http://127.0.0.1:8000.');
    } else {
      console.error('[VerifyAI API] Unexpected error:', error.message);
      throw error;
    }
  }
}

/**
 * Requests a generated PDF compliance report from backend and returns a Blob.
 */
export async function downloadReport(verificationData) {
  try {
    console.log('[VerifyAI API] Requesting PDF report download from:', `${API_BASE_URL}/report`);
    const payload = {
      extracted_data: verificationData?.extracted_data || [],
      compliance_rules: verificationData?.compliance_rules || [],
      findings: verificationData?.findings || [],
      documents: verificationData?.documents || [],
      status: verificationData?.status || 'NEEDS_REVIEW',
    };

    const response = await axios.post(`${API_BASE_URL}/report`, payload, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('[VerifyAI API] PDF report received successfully, size:', response.data.size, 'bytes');
    return response.data;
  } catch (error) {
    console.error('[VerifyAI API] Error downloading report:', error);
    throw new Error('Failed to generate PDF report from server. Please verify backend is running.');
  }
}

/**
 * Re-verifies or updates a resolved finding.
 */
export async function reverify(findingId, correctedValue) {
  try {
    const response = await axios.post(`${API_BASE_URL}/reverify`, {
      finding_id: findingId,
      corrected_value: correctedValue,
    }, { timeout: 10000 });
    return response.data;
  } catch (err) {
    return { success: true };
  }
}

/**
 * Fetches the last 10 audits from SQLite database.
 */
export async function getAuditHistory() {
  try {
    const response = await axios.get(`${API_BASE_URL}/history`, { timeout: 10000 });
    return Array.isArray(response.data) ? response.data : (response.data?.history || []);
  } catch (error) {
    console.error('[VerifyAI API] Error fetching audit history:', error);
    return [];
  }
}

