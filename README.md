<div align="center">

# 🛡️ AuditGuard

### Explainable AI-Powered Application Validation & Regulatory Compliance

[![Smart India Hackathon](https://img.shields.io/badge/Smart_India_Hackathon-2026-orange?style=for-the-badge&logo=government)](https://sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/PS_ID-SIH26261-blue?style=for-the-badge)](https://sih.gov.in/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)

**AuditGuard** is an enterprise-grade regulatory auditing platform built for AICTE. It automates the manual, time-consuming process of verifying institutional applications by using Computer Vision, NLP, and Generative AI.

</div>

---

## 🚨 The Problem

When institutions submit applications to AICTE, they upload massive volumes of supporting documents. Current manual verification faces critical bottlenecks:

- **The Human Bottleneck:** Reviewers must manually cross-check data, leading to fatigue and missed errors.
- **Cross-Document Fraud:** Mismatched Registration Numbers or names across documents go undetected.
- **Digital Forgery:** Certificates easily forged using tools like Canva bypass basic text validators.
- **Scanned Documents:** Many uploads are image-based (JPEGs) without searchable text, breaking standard digital verification.

## 💡 The Solution: AuditGuard

AuditGuard transforms document verification from manual, file-by-file checking into intelligent, evidence-based application validation. It connects information across documents, validates against regulatory rules, and provides human-readable explanations for every finding.

<div align="center">
  <!-- PASTE YOUR DASHBOARD SCREENSHOT LINK HERE -->
  <img src="[PASTE_SCREENSHOT_LINK_HERE]" alt="AuditGuard Dashboard" width="100%" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <p><i>The AuditGuard Institutional Compliance Dashboard</i></p>
</div>

---

## ✨ Core Innovations

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>👁️ AI Vision Extraction (OCR)</h3>
      <p>Uses a <b>Hybrid OCR Engine</b> (pypdf + Tesseract) to read both digital PDFs and scanned images. It provides exact Bounding Boxes and OCR Confidence Scores, proving exactly where the AI found the data.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🔗 Cross-Document NLP</h3>
      <p>Compares data across up to 10 documents. Uses <b>RapidFuzz</b> to calculate similarity scores for institution names, ignoring minor spelling variations to prevent false positives.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🛡️ Document Authentication</h3>
      <p>Inspects PDF XML metadata to flag suspicious alterations (e.g., created in Canva or Photoshop). Includes simulated <b>QR Code Cryptographic Verification</b> for official digital signatures.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Regulatory Impact Simulator</h3>
      <p>A unique GovTech tool that allows AICTE administrators to adjust policy thresholds (e.g., Name Match 85% to 95%) and instantly project how many historical applications would fail.</p>
    </td>
  </tr>
</table>

---

## 📸 Application Gallery

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <!-- PASTE MULTI-UPLOAD SCREENSHOT LINK HERE -->
        <img src="[PASTE_SCREENSHOT_LINK_HERE]" alt="Multi-Document Upload" />
        <p><b>1. Dynamic Multi-Document Upload (Up to 10 files)</b></p>
      </td>
      <td width="50%">
        <!-- PASTE EXTRACTED DATA TABLE SCREENSHOT LINK HERE -->
        <img src="[PASTE_SCREENSHOT_LINK_HERE]" alt="Extracted Data Comparison" />
        <p><b>2. Cross-Document Comparison Table</b></p>
      </td>
    </tr>
    <tr>
      <td width="50%">
        <!-- PASTE RULES & QR SCREENSHOT LINK HERE -->
        <img src="[PASTE_SCREENSHOT_LINK_HERE]" alt="Rules and QR" />
        <p><b>3. Rules Engine & QR Verification</b></p>
      </td>
      <td width="50%">
        <!-- PASTE IMPACT SIMULATOR SCREENSHOT LINK HERE -->
        <img src="[PASTE_SCREENSHOT_LINK_HERE]" alt="Regulatory Simulator" />
        <p><b>4. Regulatory Impact Simulator</b></p>
      </td>
    </tr>
  </table>
</div>

---

## 🛠️ Tech Stack

| Layer           | Technologies Used                                             |
| :-------------- | :------------------------------------------------------------ |
| **Frontend**    | React 18, Vite, Tailwind CSS, React Flow, Lucide Icons        |
| **Backend**     | Python 3.11, FastAPI, Uvicorn, SQLAlchemy (SQLite)            |
| **AI & Vision** | Tesseract OCR, PyMuPDF (`fitz`), PyPDF, OpenCV, RapidFuzz NLP |
| **Gen AI**      | Google Gemini API (`google-generativeai`)                     |
| **Reporting**   | ReportLab (Dynamic PDF Generation)                            |
| **Deployment**  | Vercel (Frontend), Render (Backend)                           |

---

## 🏗️ Architecture Flow

```text
[ React Frontend (Vercel) ]
       │
       ▼ (REST API / Multi-File FormData)
[ FastAPI Backend (Render) ]
  ├── 1. Metadata Check (PyMuPDF) -> Flags Canva/Photoshop
  ├── 2. Hybrid OCR (pypdf + Tesseract) -> Extracts Text & Bounding Boxes
  ├── 3. NLP Cross-Match (RapidFuzz) -> Compares Primary vs Supporting Docs
  ├── 4. Rule Engine -> Evaluates CONS-001, SIM-003
  ├── 5. SQLAlchemy -> Saves Audit to SQLite History
  ├── 6. Gemini API -> Generates AI Auditor Summary
  └── 7. ReportLab -> Generates PDF Compliance Report

  🚀 Local Development Setup
<details> <summary><b>1. Backend Setup (Python & FastAPI)</b> 👉 <i>Click to expand</i></summary> <br>
Prerequisites: Python 3.11+ and Tesseract OCR installed (C:\Program Files\Tesseract-OCR\tesseract.exe)

cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload

The API will run at http://127.0.0.1:8000

</details><details> <summary><b>2. Frontend Setup (React & Vite)</b> 👉 <i>Click to expand</i></summary> <br>

cd verifyai_frontend
npm install
npm run dev

The UI will run at http://localhost:5173

</details>
<div align="center"> <p>Built with ❤️ for <b>Smart India Hackathon 2026 (SIH26261)</b></p> <p><b>Team Name:</b> AuditGuard</p> </div>
```
