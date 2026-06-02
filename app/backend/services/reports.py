"""Compliance PDF generation.

- trace_pdf: reuses the glassbox library's PdfReporter by reconstructing
  AgentTrace / TraceStep / Violation objects from stored rows.
- period_pdf: a workspace-level compliance summary over a date range,
  built directly with ReportLab.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone


def trace_pdf(trace_row, steps, violations) -> bytes:
    from glassbox.models import AgentTrace, Severity, TraceStep, Violation
    from glassbox.reporter.pdf_reporter import PdfReporter

    gb_steps = []
    step_by_dbid = {}
    for s in steps:
        gs = TraceStep(
            step_id=s.step_id, timestamp=s.timestamp, step_type=s.step_type,
            model=s.model, tool_name=s.tool_name, prompt=s.prompt, output=s.output,
            tool_arguments=s.tool_arguments, token_count=s.token_count,
            latency_ms=s.latency_ms, step_hash=s.step_hash, prev_hash=s.prev_hash,
        )
        gb_steps.append(gs)
        step_by_dbid[s.id] = gs

    trace = AgentTrace(
        trace_id=trace_row.trace_id,
        session_start=trace_row.session_start,
        session_end=trace_row.session_end,
        task_description=trace_row.task_description,
        jurisdiction=trace_row.jurisdiction,
        steps=gb_steps,
        halted=trace_row.halted,
        halt_reason=trace_row.halt_reason,
    )

    gb_viol = []
    for v in violations:
        step = step_by_dbid.get(v.step_db_id) or (gb_steps[0] if gb_steps else _stub_step())
        gb_viol.append(Violation(
            violation_id=v.violation_id, rule_id=v.rule_id,
            severity=Severity(v.severity), step=step, message=v.message,
            regulatory_reference=v.regulatory_reference, remediation=v.remediation,
            detected_at=v.detected_at, resolution=v.resolution,
        ))

    buf = io.BytesIO()
    # PdfReporter.write takes a path; give it the buffer (ReportLab accepts file-like)
    PdfReporter(trace, gb_viol, narrative=False).write(buf)
    return buf.getvalue()


def _stub_step():
    from glassbox.models import TraceStep
    return TraceStep(step_id="-", timestamp=datetime.now(timezone.utc), step_type="decision")


def period_pdf(*, org_name, workspace_name, days, start, end,
               total_traces, by_severity, agents, violations, halted_count) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title="glassbox Compliance Report")
    styles = getSampleStyleSheet()
    DARK = colors.HexColor("#07090F")
    AMBER = colors.HexColor("#d98324")
    LT = colors.HexColor("#F4F5F7")

    h = ParagraphStyle("h", parent=styles["Heading1"], textColor=DARK, fontSize=18, spaceAfter=4)
    sub = ParagraphStyle("s", parent=styles["Normal"], textColor=colors.gray, fontSize=9, spaceAfter=14)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=DARK, fontSize=13, spaceBefore=10, spaceAfter=6)
    body = ParagraphStyle("b", parent=styles["Normal"], fontSize=10, spaceAfter=8)

    story = []
    story.append(Paragraph("glassbox-fin Compliance Report", h))
    story.append(Paragraph(
        f"{org_name} / {workspace_name} &nbsp;|&nbsp; Period: last {days} days "
        f"({start:%Y-%m-%d} to {end:%Y-%m-%d}) &nbsp;|&nbsp; Generated {end:%Y-%m-%d %H:%M UTC}", sub))

    # Executive summary
    story.append(Paragraph("Executive Summary", h2))
    summ = [["Metric", "Value"],
            ["Total agent sessions", str(total_traces)],
            ["Sessions halted by guardrail", str(halted_count)],
            ["Critical violations", str(by_severity.get("CRITICAL", 0))],
            ["High violations", str(by_severity.get("HIGH", 0))],
            ["Medium violations", str(by_severity.get("MEDIUM", 0))],
            ["Agents under watch", str(len(agents))]]
    t = Table(summ, colWidths=[100 * mm, 60 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LT]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("FONTSIZE", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 6 * mm))

    # Agent inventory
    story.append(Paragraph("Agent Inventory", h2))
    arows = [["Agent", "Traces", "Violations", "Status"]]
    for a in agents:
        arows.append([a["name"], str(a["trace_count"]), str(a["violation_count"]), a["status"]])
    at = Table(arows, colWidths=[70 * mm, 30 * mm, 30 * mm, 30 * mm])
    at.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LT]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("FONTSIZE", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(at)
    story.append(Spacer(1, 6 * mm))

    # Violations
    story.append(Paragraph("Violations in Period", h2))
    if not violations:
        story.append(Paragraph("No violations recorded in this period.", body))
    else:
        vrows = [["Rule", "Severity", "Agent", "Regulation", "Resolution"]]
        for v in violations[:60]:
            vrows.append([v["rule_id"], v["severity"], v["agent_name"] or "-",
                          v["regulatory_reference"] or "-", v["resolution"] or "-"])
        vt = Table(vrows, colWidths=[44 * mm, 22 * mm, 36 * mm, 36 * mm, 22 * mm])
        vt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LT]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(vt)

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "<i>Generated by glassbox-fin. Trace hash chains are individually verifiable "
        "via the dashboard or the glassbox-fin CLI (verify command).</i>", sub))

    doc.build(story)
    return buf.getvalue()
