<!-- Header Banner -->
<div align="center">
  <img src="https://img.shields.io/badge/Smart_India_Hackathon-2026-orange?style=for-the-badge&logo=government&logoColor=white" alt="SIH 2026" />
  <img src="https://img.shields.io/badge/Problem_Statement-SIH26261-blue?style=for-the-badge" alt="PS 26261" />
  
  <br />
  <br />

  <h1>🛡️ AuditGuard</h1>
  <p><b>AI-Powered Application Validation & Document Authentication System</b></p>

  <p>
    <a href="#features"><b>Features</b></a> •
    <a href="#tech-stack"><b>Tech Stack</b></a> •
    <a href="#how-it-works"><b>Architecture</b></a> •
    <a href="#quick-start"><b>Quick Start</b></a>
  </p>
</div>

---

## 💡 The Problem

AICTE processes thousands of institutional applications containing multiple supporting documents. Manually verifying these documents is time-consuming, prone to human error, and makes it difficult to identify missing evidence, cross-document inconsistencies, or suspicious alterations. 

## 🚀 Our Solution

**AuditGuard** transforms document verification from manual, file-by-file checking into intelligent, evidence-based application validation. It connects information across documents, validates against regulatory rules, and provides human-readable explanations for every finding.

<div align="center">
 <img width="1485" height="956" alt="image" src="https://github.com/user-attachments/assets/d6efae7e-059a-4922-a975-e5ef3cfeb2f9" />

<img width="1686" height="1041" alt="image" src="https://github.com/user-attachments/assets/0499f739-71d5-4798-87e2-62095f9e2bfa" />

---

## ✨ Core Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🔍 Cross-Document Intelligence</h3>
      <p>Goes beyond basic OCR. Uses <b>RapidFuzz NLP</b> to compare names and exact matching for Registration IDs across multiple documents, catching subtle inconsistencies human eyes miss.</p>
    </td>
    <td width="50%" valign="top">
      <h3>👁️ Hybrid Extraction Engine</h3>
      <p>Combines <code>pypdf</code> for digital text and <b>Tesseract OCR (Computer Vision)</b> to extract data from scanned images, JPEGs, and flattened PDFs.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🛡️ Document Authentication</h3>
      <p>Uses <b>PyMuPDF</b> metadata analysis and <b>OpenCV</b> to flag suspicious alterations (e.g., certificates edited in Canva or Photoshop) before they bypass compliance.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Explainable Compliance Engine</h3>
      <p>Checks data against configurable rules (e.g., <code>CONS-001</code>). Features a <b>React Flow</b> dependency graph proving how one mismatch cascades into a regulatory block.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🧠 Generative AI Summaries</h3>
      <p>Integrates <b>Google Gemini</b> to generate plain-English audit summaries for reviewers, making complex findings instantly readable.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📄 Automated PDF Reports</h3>
      <p>Generates an enterprise-grade, downloadable compliance audit PDF using <b>ReportLab</b>, complete with evidence, rule IDs, and recommended actions.</p>
    </td>
  </tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| **Frontend** | **Backend** | **AI & Data** |
| :---: | :---: | :---: |
| React 18 | Python 3.11 | Tesseract OCR |
| Vite | FastAPI | PyMuPDF |
| Tailwind CSS | Uvicorn | OpenCV |
| React Flow | SQLite / SQLAlchemy | RapidFuzz NLP |
| Lucide Icons | ReportLab | Google Gemini API |

</div>

---

## 🏗️ System Architecture

```text
[ React + Vite + Tailwind Frontend (Vercel) ]
       │
       ▼ (REST API / FormData)
[ Python + FastAPI Backend (Render) ]
  ├── 1. Ingestion (SQLite + SQLAlchemy Audit History)
  ├── 2. Extraction (PyPDF + PyMuPDF + Tesseract OCR)
  ├── 3. Authentication (Metadata + OpenCV Analysis)
  ├── 4. Rules Engine (RapidFuzz NLP Comparison)
  └── 5. Report Gen (ReportLab PDF)

 Quick Start (Local Development)
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

cd verifyai_frontend
npm install
npm run dev

The UI will run at http://localhost:5173

</details>


🧪 Demo Test Cases
To verify the system works during evaluation:

Test OCR: Upload a .png screenshot of a certificate containing REG-1025. The backend terminal will log Running Tesseract OCR....

Test Authentication: Upload a PDF created in Canva. The dashboard will show an orange "Suspicious Alteration" warning.

Test Mismatch Logic: Upload Doc 1 with REG-1025 and Doc 2 with REG-1052. The dashboard will flag a High Severity Mismatch and fail Rule CONS-001.

Test Human-in-the-Loop: Click "Edit & Re-verify" on the mismatch, change the number, and watch the entire dashboard turn green and the PDF report update.

<div align="center"> <p>Built with ❤️ for <b>Smart India Hackathon 2026 (SIH26261)</b></p> <p> <b>Team:</b> Vaishnavi (Backend/AI) & Durga (Frontend/UI) </p> </div>
