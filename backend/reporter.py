import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b")) # slate-500
        self.setStrokeColor(colors.HexColor("#e2e8f0")) # slate-200
        self.setLineWidth(0.75)
        self.line(40, 38, letter[0] - 40, 38)
        
        self.drawString(40, 24, "AI-Assisted Verification • AuditGuard Regulatory Compliance Suite (AICTE Ready)")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 24, page_str)
        self.restoreState()

def generate_report(extracted_data=None, rules=None, findings=None, output_stream=None, institution_name=None):
    """
    Generates an enterprise-grade AICTE Reviewer Compliance Audit Report PDF.
    """
    if extracted_data is None:
        extracted_data = []
    if rules is None:
        rules = []
    if findings is None:
        findings = []

    # Infer institution name if not provided
    if not institution_name:
        for item in extracted_data:
            if "institution" in str(item.get("field", "")).lower():
                institution_name = item.get("doc1_val")
                break
        if not institution_name:
            institution_name = "Apex Institute of Technology"

    buffer = output_stream if output_stream else io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#475569')
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=5
    )
    
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    
    cell_normal = ParagraphStyle(
        'CellNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#334155')
    )

    cell_white_bold = ParagraphStyle(
        'CellWhiteBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # Header section
    story.append(Paragraph("AuditGuard Compliance Audit Report", title_style))
    story.append(Spacer(1, 4))
    
    audit_date = datetime.now().strftime("%B %d, %Y - %H:%M:%S UTC")
    story.append(Paragraph(f"Institution: <b>{institution_name}</b> | Audit Timestamp: {audit_date}", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=2, spaceAfter=10))

    # 1. Overall Status Banner
    has_issues = len(findings) > 0
    status_color = colors.HexColor('#dc2626') if has_issues else colors.HexColor('#16a34a')
    bg_color = colors.HexColor('#fef2f2') if has_issues else colors.HexColor('#f0fdf4')
    status_text = "STATUS: NEEDS_REVIEW (DISCREPANCIES DETECTED)" if has_issues else "STATUS: PASS (ALL CHECKS CLEAR)"

    summary_data = [
        [
            Paragraph(f"<b>Overall Audit Status:</b> <font color='{status_color.hexval()}'>{status_text}</font>", cell_bold),
            Paragraph(f"<b>Flagged Discrepancies:</b> {len(findings)}", cell_bold),
            Paragraph(f"<b>Rules Evaluated:</b> {len(rules)}", cell_bold)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[270, 135, 135])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('BOX', (0, 0), (-1, -1), 1, status_color),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 2. Extracted Fields Comparison Table
    story.append(Paragraph("1. Extracted Document Fields Comparison", section_heading))
    if extracted_data:
        ext_table_data = [
            [
                Paragraph("Field Name", cell_white_bold),
                Paragraph("Document 1 Value", cell_white_bold),
                Paragraph("Document 2 Value", cell_white_bold),
                Paragraph("Status", cell_white_bold)
            ]
        ]
        for item in extracted_data:
            field_name = item.get("field", "Field")
            v1 = str(item.get("doc1_val", "N/A"))
            v2 = str(item.get("doc2_val", "N/A"))
            m_status = str(item.get("match_status", "MISMATCH")).upper()
            status_c = "#dc2626" if m_status == "MISMATCH" else "#16a34a"
            
            ext_table_data.append([
                Paragraph(f"<b>{field_name}</b>", cell_normal),
                Paragraph(v1, cell_normal),
                Paragraph(v2, cell_normal),
                Paragraph(f"<font color='{status_c}'><b>{m_status}</b></font>", cell_bold)
            ])
        ext_table = Table(ext_table_data, colWidths=[140, 160, 160, 80])
        ext_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e1b4b')), # deep indigo
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(ext_table)
    story.append(Spacer(1, 10))

    # 3. Compliance Rules Checklist
    story.append(Paragraph("2. Compliance Rules Engine Checklist", section_heading))
    if rules:
        rules_table_data = [
            [
                Paragraph("Rule ID", cell_white_bold),
                Paragraph("Description", cell_white_bold),
                Paragraph("Verification Status", cell_white_bold)
            ]
        ]
        for r in rules:
            rid = r.get("rule_id", "R-001")
            desc = r.get("description", "Rule description")
            rstatus = str(r.get("status", "FAILED")).upper()
            rc = "#16a34a" if rstatus == "PASSED" else "#dc2626"
            symbol = "✓ PASSED" if rstatus == "PASSED" else "✗ FAILED"
            
            rules_table_data.append([
                Paragraph(f"<b>{rid}</b>", cell_bold),
                Paragraph(desc, cell_normal),
                Paragraph(f"<font color='{rc}'><b>{symbol}</b></font>", cell_bold)
            ])
        rules_table = Table(rules_table_data, colWidths=[90, 350, 100])
        rules_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#312e81')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(rules_table)
    story.append(Spacer(1, 10))

    # 4. Evidence-Linked Findings
    story.append(Paragraph("3. Evidence-Linked Discrepancy Findings", section_heading))
    if not findings:
        clean_p = Paragraph("<b>All compliance criteria met.</b> No discrepancies or mismatch findings reported.", cell_normal)
        clean_table = Table([[clean_p]], colWidths=[540])
        clean_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#86efac')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(clean_table)
    else:
        findings_table_data = [
            [
                Paragraph("ID / Severity", cell_white_bold),
                Paragraph("Field & Reason", cell_white_bold),
                Paragraph("Observed Discrepancy", cell_white_bold),
                Paragraph("Recommended Action", cell_white_bold)
            ]
        ]
        for f in findings:
            fid = f.get("id") or f.get("finding_id") or "F-001"
            sev = (f.get("severity") or "MEDIUM").upper()
            field_name = f.get("field") or "Field"
            v1 = str(f.get("doc1_value", "N/A"))
            v2 = str(f.get("doc2_value", "N/A"))
            reason = f.get("reason") or "Mismatch detected between documents."
            action = f.get("recommended_action") or "Verify original documents."
            
            scolor = "#dc2626" if sev == "HIGH" else ("#d97706" if sev == "MEDIUM" else "#475569")
            
            c1 = Paragraph(f"<b>{fid}</b><br/><font color='{scolor}'><b>{sev}</b></font>", cell_normal)
            c2 = Paragraph(f"<b>{field_name}</b><br/>{reason}", cell_normal)
            c3 = Paragraph(f"<b>Doc 1:</b> {v1}<br/><b>Doc 2:</b> {v2}", cell_normal)
            c4 = Paragraph(f"<font color='#0369a1'><b>Action:</b></font> {action}", cell_normal)
            
            findings_table_data.append([c1, c2, c3, c4])

        f_table = Table(findings_table_data, colWidths=[70, 170, 150, 150])
        f_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#991b1b')), # red header
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fef2f2')]),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(f_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "<i>Reviewer Note: This report was autonomously generated by AuditGuard's 6-Module Audit Engine. "
        "Any finding marked HIGH severity requires reviewer confirmation before regulatory accreditation issuance.</i>",
        subtitle_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    
    if output_stream is None:
        buffer.seek(0)
        return buffer
    return output_stream

# Backwards compatibility alias
def generate_pdf_report(institution_name="N/A", findings=None, output_stream=None):
    return generate_report(findings=findings, output_stream=output_stream, institution_name=institution_name)
