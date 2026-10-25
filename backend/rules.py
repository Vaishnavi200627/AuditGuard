from rapidfuzz import fuzz

def evaluate_compliance(doc1_data, doc2_data):
    """
    Evaluates extracted document data against compliance rules.
    Returns: (findings, extracted_data, compliance_rules)
    """
    reg1 = doc1_data.get("reg_no", "NOT_FOUND")
    reg2 = doc2_data.get("reg_no", "NOT_FOUND")
    name1 = doc1_data.get("institution_name", "NOT_FOUND")
    name2 = doc2_data.get("institution_name", "NOT_FOUND")

    # 1. Extracted Data Table
    reg_match = (reg1 != "NOT_FOUND" and reg2 != "NOT_FOUND" and reg1 == reg2)
    name_similarity = fuzz.token_set_ratio(name1.lower(), name2.lower()) if (name1 != "NOT_FOUND" and name2 != "NOT_FOUND") else 0
    name_match = name_similarity >= 85 and name1 != "NOT_FOUND" and name2 != "NOT_FOUND"

    extracted_data = [
        {
            "field": "Registration Number",
            "doc1_val": reg1,
            "doc2_val": reg2,
            "match_status": "MATCH" if reg_match else "MISMATCH"
        },
        {
            "field": "Institution Name",
            "doc1_val": name1,
            "doc2_val": name2,
            "match_status": "MATCH" if name_match else "MISMATCH"
        }
    ]

    # 2. Compliance Rules Engine
    rules_passed = []
    
    # Rule 1: Registration consistency
    r1_pass = reg_match
    rules_passed.append({
        "rule_id": "CONS-001",
        "description": "Registration numbers must match across all documents",
        "status": "PASSED" if r1_pass else "FAILED"
    })

    # Rule 2: Institution name presence
    r2_pass = (name1 != "NOT_FOUND" and name2 != "NOT_FOUND" and len(name1.strip()) > 0 and len(name2.strip()) > 0)
    rules_passed.append({
        "rule_id": "DOC-002",
        "description": "Institution name must be present in all documents",
        "status": "PASSED" if r2_pass else "FAILED"
    })

    # Rule 3: Institution name fuzzy similarity
    r3_pass = name_match
    rules_passed.append({
        "rule_id": "SIM-003",
        "description": "Institution name similarity threshold >= 85%",
        "status": "PASSED" if r3_pass else "FAILED"
    })

    # 3. Evidence-Linked Findings
    findings = []

    if not reg_match:
        findings.append({
            "finding_id": "F-001",
            "id": "F-001",
            "severity": "HIGH",
            "field": "Registration Number",
            "reason": "Mismatch detected between documents." if (reg1 != "NOT_FOUND" and reg2 != "NOT_FOUND") else "Registration number not found in one or both documents.",
            "doc1_value": reg1,
            "doc2_value": reg2,
            "recommended_action": "Verify original documents and cross-check AICTE registration database."
        })

    if not name_match:
        findings.append({
            "finding_id": "F-002",
            "id": "F-002",
            "severity": "MEDIUM",
            "field": "Institution Name",
            "reason": f"Name variation detected (Similarity: {round(name_similarity, 1)}%)." if (name1 != "NOT_FOUND" and name2 != "NOT_FOUND") else "Institution name missing in one or both documents.",
            "doc1_value": name1,
            "doc2_value": name2,
            "recommended_action": "Verify institution legal name against official Gazette / Affiliation Order."
        })

    return findings, extracted_data, rules_passed

def check_compliance(doc1_data, doc2_data):
    """
    Backwards-compatible wrapper returning only findings list.
    """
    findings, _, _ = evaluate_compliance(doc1_data, doc2_data)
    return findings
