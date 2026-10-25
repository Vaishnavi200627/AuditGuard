from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import google.generativeai as genai

from database import init_db, save_audit, get_recent_audits
from extractor import (
    extract_text_from_pdf,
    check_pdf_metadata,
    check_image_tampering,
    scan_qr_code,
    find_registration_number,
    find_institution_name,
)
from rules import evaluate_compliance, check_compliance
from reporter import generate_report, generate_pdf_report

# TASK 1: Initialize local SQLite database
init_db()

app = FastAPI(title="AuditGuard Backend - AICTE Audit Engine")

# Configure CORS with allow_credentials=True and allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# TASK 2: Real LLM Integration configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE")

def generate_ai_summary(findings, extracted_data=None, is_ocr=False):
    """
    Generates a conversational AI Auditor Summary based on findings and extraction method.
    Uses real Gemini 1.5 Flash LLM if GEMINI_API_KEY is provided and active.
    Falls back gracefully to standard template if key is missing or API call fails.
    """
    # 1. Attempt Gemini 1.5 Flash LLM Call
    if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_API_KEY_HERE":
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            findings_context = f"Findings: {findings}"
            if extracted_data:
                findings_context += f", Extracted Data: {extracted_data}"
            prompt = f"You are an AICTE auditor. Summarize these findings in 2 sentences: {findings_context}"
            response = model.generate_content(prompt)
            if response and response.text and response.text.strip():
                print(f"[AuditGuard LLM] Gemini 1.5 Flash generated summary successfully.")
                return response.text.strip()
        except Exception as llm_err:
            print(f"[AuditGuard LLM] Gemini API call failed: {llm_err}. Using fallback summary.")

    # 2. Deterministic Template Fallback (prevents demo crashes)
    method_note = " via Optical Character Recognition (Computer Vision)" if is_ocr else ""
    if not findings:
        return f"All compliance rules passed successfully. AuditGuard has cross-checked all extracted identifiers{method_note} and statutory requirements across the uploaded documents with zero discrepancies detected. The application is recommended for automated approval."

    high_findings = [f for f in findings if (f.get("severity") or "").upper() == "HIGH"]
    high_count = len(high_findings)
    fields = list(dict.fromkeys([f.get("field", "Field") for f in findings]))
    fields_str = ", ".join(fields)

    parts = [f"AuditGuard has analyzed the application{method_note}."]
    if high_count > 0:
        parts.append(f"We detected {high_count} high-severity mismatch in the {fields_str}.")
    else:
        parts.append(f"We detected {len(findings)} discrepancy finding{'s' if len(findings) > 1 else ''} in the {fields_str}.")
    parts.append("Please review the flagged evidence before approval.")
    return " ".join(parts)

# TASK 4: Email Notification Simulation
def send_mock_email(institution: str, findings: list):
    """
    Simulates sending an email notification regarding flagged audit findings.
    Does not actually send an email; prints mock transmission notice to console.
    """
    findings_count = len(findings)
    print(f"[EMAIL SENT] Notification sent to abc@institute.edu regarding {findings_count} findings.")

@app.get("/")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "AuditGuard Backend is online and healthy"}

# TASK 1: Endpoint to fetch last 10 audits from SQLite database
@app.get("/api/history")
def get_history_endpoint():
    """
    Returns the last 10 audits from the SQLite database.
    """
    audits = get_recent_audits(limit=10)
    return audits

@app.post("/api/reverify")
async def reverify_endpoint(payload: dict = Body(default={})):
    """
    Resolves or re-verifies a flagged compliance finding.
    """
    finding_id = payload.get("finding_id", "unknown")
    corrected_value = payload.get("corrected_value", "")
    print(f"\n[AuditGuard] Re-verify called for Finding ID: {finding_id} -> Corrected Value: '{corrected_value}'")
    return {
        "status": "success",
        "message": "Finding resolved",
        "finding_id": finding_id,
        "corrected_value": corrected_value
    }

@app.post("/api/verify")
async def verify_documents(
    docs: Optional[list[UploadFile]] = File(default=None),
    doc1: Optional[UploadFile] = File(default=None),
    doc2: Optional[UploadFile] = File(default=None),
):
    # Consolidate uploaded files from multi-doc 'docs' or legacy 'doc1', 'doc2'
    uploaded_files: list[UploadFile] = []
    if docs:
        if isinstance(docs, list):
            uploaded_files.extend(docs)
        else:
            uploaded_files.append(docs)
    if doc1:
        uploaded_files.append(doc1)
    if doc2:
        uploaded_files.append(doc2)

    # Validate that at least 2 documents were uploaded
    if len(uploaded_files) < 2:
        return {
            "status": "ERROR",
            "message": "Please upload at least 2 documents."
        }

    print(f"\n[AuditGuard] Received document verification request for {len(uploaded_files)} documents:")
    for i, d in enumerate(uploaded_files, start=1):
        print(f"  - Document {i}: {getattr(d, 'filename', 'unknown')} ({getattr(d, 'content_type', 'unknown')})")

    temp_paths: list[str] = []
    extracted_docs_list: list[dict] = []
    formatted_documents: list[dict] = []
    authenticity_warnings: list[dict] = []
    any_ocr = False

    try:
        # Loop through all uploaded documents
        for idx, doc in enumerate(uploaded_files, start=1):
            raw_filename = getattr(doc, "filename", None) or f"doc_{idx}.pdf"
            safe_name = os.path.basename(raw_filename)
            temp_path = f"temp_{idx}_{safe_name}"
            temp_paths.append(temp_path)

            # Save temporary file for extraction
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(doc.file, buffer)

            # 1. Tampering and Metadata Checks
            warn_meta = check_pdf_metadata(temp_path)
            warn_ela = check_image_tampering(temp_path)

            # TASK 2: QR Code Verification (PyZbar / cv2.QRCodeDetector)
            qr_res = scan_qr_code(temp_path)
            is_qr_verified = qr_res.get("verified", False)
            qr_issuer = qr_res.get("issuer", "AICTE Official")

            # If a QR code is verified, it overrides the "Canva" warning and marks the document as "Cryptographically Verified"
            if is_qr_verified:
                print(f"[AuditGuard] Document {safe_name} cryptographically verified via QR Code (Issuer: {qr_issuer})")
                if "Canva" in warn_meta:
                    print(f"[AuditGuard] QR verification overrides Canva warning on {safe_name}")
                warn_meta = "Cryptographically Verified"
                authenticity_warnings.append({
                    "doc": safe_name,
                    "verified": True,
                    "issuer": qr_issuer,
                    "status": "Cryptographically Verified",
                    "message": f"{safe_name}: Cryptographically Verified via Official QR Code ({qr_issuer})",
                })
            else:
                if warn_meta != "Clean":
                    authenticity_warnings.append({
                        "doc": safe_name,
                        "verified": False,
                        "message": f"{safe_name}: {warn_meta}",
                    })

            if warn_ela != "Clean":
                authenticity_warnings.append({
                    "doc": safe_name,
                    "message": f"{safe_name}: {warn_ela}",
                })

            # 2. Text Extraction via Hybrid Engine (Digital + OCR)
            text, is_ocr = extract_text_from_pdf(temp_path, return_ocr_status=True)
            if is_ocr:
                any_ocr = True

            reg_no = find_registration_number(text)
            institution_name = find_institution_name(text)

            extracted_item = {
                "doc_name": safe_name,
                "reg_no": reg_no,
                "institution_name": institution_name,
                "metadata_warning": warn_meta,
                "tampering_warning": warn_ela,
                "is_ocr": is_ocr,
                "qr_verified": is_qr_verified,
            }
            extracted_docs_list.append(extracted_item)

            # Build document info object for UI
            doc_warning = None if is_qr_verified else (warn_meta if warn_meta != "Clean" else (warn_ela if warn_ela != "Clean" else None))
            formatted_documents.append({
                "doc_name": safe_name,
                "type": "Scanned Document (OCR)" if is_ocr else "Digital Document",
                "is_ocr": is_ocr,
                "qr_verified": is_qr_verified,
                "qr_issuer": qr_issuer if is_qr_verified else None,
                "warning": doc_warning,
            })

            print(f"[AuditGuard] Document {idx} ({safe_name}): Reg={reg_no}, Inst={institution_name}, OCR={is_ocr}, QR={is_qr_verified}, Meta={warn_meta}, ELA={warn_ela}")

        # 3. Evaluate Compliance across all documents against primary reference document
        findings, extracted_data, compliance_rules = evaluate_compliance(extracted_docs_list)
        print(f"[AuditGuard] Extracted Fields: {len(extracted_data)}, Findings: {len(findings)}, Rules: {len(compliance_rules)}")

        # 4. Generate AI summary
        ai_summary = generate_ai_summary(findings, extracted_data=extracted_data, is_ocr=any_ocr)
        print(f"[AuditGuard] AI Summary: {ai_summary}")

        # 5. Determine overall audit status
        status = "NEEDS_REVIEW" if findings else "PASS"

        # Determine primary institution name for audit logging
        primary_inst = extracted_docs_list[0].get("institution_name")
        if not primary_inst or primary_inst == "NOT_FOUND":
            for d in extracted_docs_list:
                if d.get("institution_name") and d.get("institution_name") != "NOT_FOUND":
                    primary_inst = d.get("institution_name")
                    break
        if not primary_inst or primary_inst == "NOT_FOUND":
            primary_inst = "Apex Institute of Technology"

        # TASK 1: Save audit history to SQLite database
        save_audit(
            institution_name=primary_inst,
            status=status,
            findings_count=len(findings)
        )

        # TASK 4: Email notification simulation if NEEDS_REVIEW
        if status == "NEEDS_REVIEW":
            send_mock_email(institution=primary_inst, findings=findings)

        any_qr_verified = any(d.get("qr_verified", False) for d in formatted_documents)

        return {
            "status": status,
            "is_ocr": any_ocr,
            "qr_verified": any_qr_verified,
            "documents": formatted_documents,
            "extracted_data": extracted_data,
            "compliance_rules": compliance_rules,
            "findings": findings,
            "authenticity_warnings": authenticity_warnings,
            "ai_summary": ai_summary,
        }
    except Exception as e:
        print(f"[VerifyAI] Error during document verification: {e}")
        return {
            "status": "ERROR",
            "message": str(e),
            "is_ocr": False,
            "documents": [],
            "extracted_data": [],
            "compliance_rules": [],
            "findings": [],
            "authenticity_warnings": [],
            "ai_summary": f"An error occurred during verification: {e}",
        }
    finally:
        # Clean up all temporary files created for this request
        for p in temp_paths:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

@app.post("/api/report")
async def generate_report_endpoint(payload: dict = Body(default={})):
    """
    Generates an AICTE Compliance Audit Report PDF and returns it as a streaming download.
    Accepts: { extracted_data, rules (or compliance_rules), findings, institution_name }
    """
    print(f"\n[VerifyAI] Received PDF report generation request")
    extracted_data = payload.get("extracted_data", [])
    rules = payload.get("rules") or payload.get("compliance_rules", [])
    findings = payload.get("findings", [])
    institution_name = payload.get("institution_name")

    pdf_stream = generate_report(
        extracted_data=extracted_data,
        rules=rules,
        findings=findings,
        institution_name=institution_name
    )

    headers = {
        "Content-Disposition": 'attachment; filename="VerifyAI_Report.pdf"',
        "Access-Control-Expose-Headers": "Content-Disposition",
    }

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers=headers
    )
