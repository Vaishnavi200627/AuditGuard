from typing import List, Dict, Any, Union
from rapidfuzz import fuzz

def evaluate_compliance(all_docs_data: Union[List[Dict[str, Any]], Dict[str, Any]], doc2_data: Dict[str, Any] = None):
    """
    Evaluates extracted document data across multiple documents.
    all_docs_data: List of dicts, each containing:
       {"doc_name": str, "reg_no": str, "institution_name": str, ...}
    The FIRST document acts as the Primary Reference document.
    All supporting documents (Doc 2, Doc 3, ...) are validated against it.
    Returns: (findings, extracted_data, compliance_rules)
    """
    # Backward compatibility if called with two individual dicts
    if doc2_data is not None:
        all_docs_data = [all_docs_data, doc2_data]

    if not isinstance(all_docs_data, list) or len(all_docs_data) == 0:
        return [], [], []

    primary_doc = all_docs_data[0]
    primary_name = primary_doc.get("doc_name") or "Document 1 (Primary Reference)"
    primary_reg = primary_doc.get("reg_no", "NOT_FOUND")
    primary_inst = primary_doc.get("institution_name", "NOT_FOUND")

    supporting_docs = all_docs_data[1:]

    findings = []
    extracted_data = []

    all_reg_matches = True
    all_names_present = bool(primary_inst != "NOT_FOUND" and str(primary_inst).strip())
    all_names_match = True

    finding_counter = 1

    for idx, doc in enumerate(supporting_docs, start=2):
        doc_filename = doc.get("doc_name") or f"Document {idx}"
        doc_reg = doc.get("reg_no", "NOT_FOUND")
        doc_inst = doc.get("institution_name", "NOT_FOUND")

        # 1. Compare Registration Numbers
        reg_match = (primary_reg != "NOT_FOUND" and doc_reg != "NOT_FOUND" and primary_reg == doc_reg)
        if not reg_match:
            all_reg_matches = False
            if primary_reg != "NOT_FOUND" and doc_reg != "NOT_FOUND":
                reason = f"Document {idx} ({doc_filename}) has a different Registration Number ('{doc_reg}') than the Primary Document ('{primary_reg}')."
            else:
                reason = f"Document {idx} ({doc_filename}) Registration Number not found or missing from Primary Document."

            findings.append({
                "finding_id": f"F-{finding_counter:03d}",
                "id": f"F-{finding_counter:03d}",
                "severity": "HIGH",
                "field": f"Registration Number (Doc {idx})" if len(all_docs_data) > 2 else "Registration Number",
                "reason": reason,
                "doc1_value": primary_reg,
                "doc2_value": doc_reg,
                "recommended_action": f"Verify Document {idx} ({doc_filename}) against {primary_name} and cross-check AICTE registry database."
            })
            finding_counter += 1

        # 2. Compare Institution Names
        if doc_inst == "NOT_FOUND" or not str(doc_inst).strip():
            all_names_present = False

        name_similarity = fuzz.token_set_ratio(str(primary_inst).lower(), str(doc_inst).lower()) if (primary_inst != "NOT_FOUND" and doc_inst != "NOT_FOUND") else 0
        name_match = (name_similarity >= 85 and primary_inst != "NOT_FOUND" and doc_inst != "NOT_FOUND")

        if not name_match:
            all_names_match = False
            if primary_inst != "NOT_FOUND" and doc_inst != "NOT_FOUND":
                reason = f"Document {idx} ({doc_filename}) has a different Institution Name ('{doc_inst}') than the Primary Document ('{primary_inst}') (Similarity: {round(name_similarity, 1)}%)."
            else:
                reason = f"Institution name missing in Document {idx} ({doc_filename}) or Primary Document."

            findings.append({
                "finding_id": f"F-{finding_counter:03d}",
                "id": f"F-{finding_counter:03d}",
                "severity": "MEDIUM",
                "field": f"Institution Name (Doc {idx})" if len(all_docs_data) > 2 else "Institution Name",
                "reason": reason,
                "doc1_value": primary_inst,
                "doc2_value": doc_inst,
                "recommended_action": f"Verify official gazette or affiliation order for Document {idx} ({doc_filename})."
            })
            finding_counter += 1

        # Build comparison rows for extracted data table
        reg_field = f"Registration Number (Doc {idx} vs Primary)" if len(all_docs_data) > 2 else "Registration Number"
        inst_field = f"Institution Name (Doc {idx} vs Primary)" if len(all_docs_data) > 2 else "Institution Name"

        extracted_data.append({
            "field": reg_field,
            "doc1_val": primary_reg,
            "doc2_val": doc_reg,
            "match_status": "MATCH" if reg_match else "MISMATCH"
        })
        extracted_data.append({
            "field": inst_field,
            "doc1_val": primary_inst,
            "doc2_val": doc_inst,
            "match_status": "MATCH" if name_match else "MISMATCH"
        })

    # If only 1 document passed
    if len(supporting_docs) == 0:
        extracted_data.append({
            "field": "Registration Number",
            "doc1_val": primary_reg,
            "doc2_val": "N/A (Single Document)",
            "match_status": "MATCH" if primary_reg != "NOT_FOUND" else "MISMATCH"
        })
        extracted_data.append({
            "field": "Institution Name",
            "doc1_val": primary_inst,
            "doc2_val": "N/A (Single Document)",
            "match_status": "MATCH" if primary_inst != "NOT_FOUND" else "MISMATCH"
        })

    # 3. Compliance Rules evaluated across all documents
    compliance_rules = [
        {
            "rule_id": "CONS-001",
            "description": "Registration numbers must match across all documents",
            "status": "PASSED" if (all_reg_matches and primary_reg != "NOT_FOUND") else "FAILED"
        },
        {
            "rule_id": "DOC-002",
            "description": "Institution name must be present in all documents",
            "status": "PASSED" if all_names_present else "FAILED"
        },
        {
            "rule_id": "SIM-003",
            "description": "Institution name similarity threshold >= 85%",
            "status": "PASSED" if all_names_match else "FAILED"
        }
    ]

    return findings, extracted_data, compliance_rules

def check_compliance(all_docs_data, doc2_data=None):
    """
    Backwards-compatible wrapper returning only findings list.
    """
    findings, _, _ = evaluate_compliance(all_docs_data, doc2_data)
    return findings
