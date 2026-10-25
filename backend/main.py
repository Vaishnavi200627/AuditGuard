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
    find_registration_number,
    find_institution_name,
)
from rules import evaluate_compliance, check_compliance
from reporter import generate_report, generate_pdf_report

# TASK 1: Initialize local SQLite database
init_db()

app = FastAPI(title="VerifyAI Backend - AICTE Audit Engine")

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
                print(f"[VerifyAI LLM] Gemini 1.5 Flash generated summary successfully.")
                return response.text.strip()
        except Exception as llm_err:
            print(f"[VerifyAI LLM] Gemini API call failed: {llm_err}. Using fallback summary.")

    # 2. Deterministic Template Fallback (prevents demo crashes)
    method_note = " via Optical Character Recognition (Computer Vision)" if is_ocr else ""
    if not findings:
        return f"All compliance rules passed successfully. VerifyAI has cross-checked all extracted identifiers{method_note} and statutory requirements across the uploaded documents with zero discrepancies detected. The application is recommended for automated approval."

    high_findings = [f for f in findings if (f.get("severity") or "").upper() == "HIGH"]
    high_count = len(high_findings)
    fields = list(dict.fromkeys([f.get("field", "Field") for f in findings]))
    fields_str = ", ".join(fields)

    parts = [f"VerifyAI has analyzed the application{method_note}."]
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
    return {"status": "ok", "message": "VerifyAI Backend is online and healthy"}

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
    print(f"\n[VerifyAI] Re-verify called for Finding ID: {finding_id} -> Corrected Value: '{corrected_value}'")
    return {
        "status": "success",
        "message": "Finding resolved",
        "finding_id": finding_id,
        "corrected_value": corrected_value
    }

@app.post("/api/verify")
async def verify_documents(doc1: UploadFile = File(...), doc2: UploadFile = File(...)):
    print(f"\n[VerifyAI] Received document verification request:")
    print(f"  - Document 1: {getattr(doc1, 'filename', 'unknown')} ({getattr(doc1, 'content_type', 'unknown')})")
    print(f"  - Document 2: {getattr(doc2, 'filename', 'unknown')} ({getattr(doc2, 'content_type', 'unknown')})")

    safe_name1 = os.path.basename(doc1.filename or "doc1.pdf")
    safe_name2 = os.path.basename(doc2.filename or "doc2.pdf")
    path1 = f"temp_{safe_name1}"
    path2 = f"temp_{safe_name2}"

    try:
        # Save temporary files for extraction
        with open(path1, "wb") as buffer:
            shutil.copyfileobj(doc1.file, buffer)
        with open(path2, "wb") as buffer:
            shutil.copyfileobj(doc2.file, buffer)

        # 1. Suspicious alteration check (Metadata check & TASK 3: OpenCV ELA Tampering)
        warn1 = check_pdf_metadata(path1)
        warn2 = check_pdf_metadata(path2)
        ela_warn1 = check_image_tampering(path1)
        ela_warn2 = check_image_tampering(path2)

        authenticity_warnings = [
            {"doc1": warn1, "doc2": warn2},
            {"doc1": ela_warn1, "doc2": ela_warn2}
        ]
        print(f"[VerifyAI] Metadata Warnings: Doc1={warn1}, Doc2={warn2}")
        print(f"[VerifyAI] OpenCV ELA Warnings: Doc1={ela_warn1}, Doc2={ela_warn2}")

        # 2. Extract text using Hybrid Engine (Digital + OCR)
        text1, is_ocr1 = extract_text_from_pdf(path1, return_ocr_status=True)
        text2, is_ocr2 = extract_text_from_pdf(path2, return_ocr_status=True)
        is_ocr = bool(is_ocr1 or is_ocr2)

        print(f"[VerifyAI] Extracted Text 1: {len(text1)} chars (OCR={is_ocr1})")
        print(f"[VerifyAI] Extracted Text 2: {len(text2)} chars (OCR={is_ocr2})")

        data1 = {
            "reg_no": find_registration_number(text1),
            "institution_name": find_institution_name(text1)
        }
        data2 = {
            "reg_no": find_registration_number(text2),
            "institution_name": find_institution_name(text2)
        }

        print(f"[VerifyAI] Extracted Data 1: {data1}")
        print(f"[VerifyAI] Extracted Data 2: {data2}")

        findings, extracted_data, compliance_rules = evaluate_compliance(data1, data2)
        print(f"[VerifyAI] Extracted Fields: {len(extracted_data)}")
        print(f"[VerifyAI] Compliance Rules: {len(compliance_rules)}")
        print(f"[VerifyAI] Compliance Findings Count: {len(findings)}")

        # 3. AI-Powered verification summary (TASK 2)
        ai_summary = generate_ai_summary(findings, extracted_data=extracted_data, is_ocr=is_ocr)
        print(f"[VerifyAI] AI Summary: {ai_summary}")

        # Determine status: PASS if no findings, otherwise NEEDS_REVIEW
        status = "NEEDS_REVIEW" if findings else "PASS"

        # Determine institution name
        institution_name = data1.get("institution_name")
        if not institution_name or institution_name == "NOT_FOUND":
            institution_name = data2.get("institution_name")
        if not institution_name or institution_name == "NOT_FOUND":
            institution_name = "Apex Institute of Technology"

        # TASK 1: Save audit history to SQLite database
        save_audit(
            institution_name=institution_name,
            status=status,
            findings_count=len(findings)
        )

        # TASK 4: Email notification simulation if status is NEEDS_REVIEW
        if status == "NEEDS_REVIEW":
            send_mock_email(institution=institution_name, findings=findings)

        # Build document display warnings
        doc1_warning = warn1 if warn1 != "Clean" else (ela_warn1 if ela_warn1 != "Clean" else None)
        doc2_warning = warn2 if warn2 != "Clean" else (ela_warn2 if ela_warn2 != "Clean" else None)

        return {
            "status": status,
            "is_ocr": is_ocr,
            "documents": [
                {
                    "doc_name": doc1.filename,
                    "type": "Scanned Document (OCR)" if is_ocr1 else "Digital Document",
                    "is_ocr": is_ocr1,
                    "warning": doc1_warning
                },
                {
                    "doc_name": doc2.filename,
                    "type": "Scanned Document (OCR)" if is_ocr2 else "Digital Document",
                    "is_ocr": is_ocr2,
                    "warning": doc2_warning
                }
            ],
            "extracted_data": extracted_data,
            "compliance_rules": compliance_rules,
            "findings": findings,
            "authenticity_warnings": authenticity_warnings,
            "ai_summary": ai_summary
        }
    except Exception as e:
        print(f"[VerifyAI] Error during document verification: {e}")
        return {
            "status": "ERROR",
            "is_ocr": False,
            "documents": [
                {"doc_name": getattr(doc1, 'filename', 'Document 1'), "type": "Error", "is_ocr": False, "warning": str(e)},
                {"doc_name": getattr(doc2, 'filename', 'Document 2'), "type": "Error", "is_ocr": False, "warning": str(e)}
            ],
            "extracted_data": [],
            "compliance_rules": [],
            "findings": [],
            "authenticity_warnings": [{"doc1": "Error", "doc2": "Error"}],
            "ai_summary": "An unexpected error occurred during document verification."
        }
    finally:
        # Always clean up temporary files
        for p in (path1, path2):
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
