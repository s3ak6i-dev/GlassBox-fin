from __future__ import annotations

from datetime import datetime
from typing import Optional

from glassbox.models import AgentTrace, Severity, Violation


class PdfReporter:
    def __init__(
        self,
        trace: AgentTrace,
        violations: list[Violation],
        narrative: bool = True,
    ) -> None:
        self._trace = trace
        self._violations = violations
        self._narrative = narrative

    def write(self, path: str) -> None:
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
            from reportlab.lib.units import mm
            from reportlab.platypus import (
                Paragraph,
                SimpleDocTemplate,
                Spacer,
                Table,
                TableStyle,
            )
        except ImportError as exc:
            raise ImportError(
                "reportlab is required for PDF reports: pip install reportlab"
            ) from exc

        doc = SimpleDocTemplate(path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # ── Accent palette ───────────────────────────────────────────────────
        DARK  = colors.HexColor("#07090F")
        ACCENT = colors.HexColor("#ffb454")
        RED   = colors.HexColor("#ef4444")
        AMBER = colors.HexColor("#f59e0b")
        GREEN = colors.HexColor("#22c55e")
        LTGRAY = colors.HexColor("#F4F5F7")

        sev_colors = {
            Severity.CRITICAL: (colors.HexColor("#FFF1F1"), RED),
            Severity.HIGH:     (colors.HexColor("#FFFBF0"), AMBER),
            Severity.MEDIUM:   (colors.HexColor("#F0FFF7"), GREEN),
            Severity.LOW:      (LTGRAY, DARK),
        }

        heading = ParagraphStyle("gb_heading", parent=styles["Heading1"],
                                  textColor=DARK, fontSize=18, spaceAfter=6)
        sub = ParagraphStyle("gb_sub", parent=styles["Normal"],
                              textColor=colors.gray, fontSize=9, spaceAfter=12)
        body = ParagraphStyle("gb_body", parent=styles["Normal"], fontSize=10, spaceAfter=8)

        t = self._trace
        vs = self._violations

        # ── 1. Cover ─────────────────────────────────────────────────────────
        story.append(Paragraph("glassbox-fin Compliance Report", heading))
        story.append(Paragraph(
            f"Session: {t.task_description or t.trace_id}  |  "
            f"Start: {t.session_start.strftime('%Y-%m-%d %H:%M UTC')}  |  "
            f"Jurisdiction: {t.jurisdiction or 'N/A'}  |  "
            f"{'⚠ HALTED' if t.halted else '✓ COMPLETED'}",
            sub,
        ))
        story.append(Spacer(1, 8 * mm))

        # ── 2. Executive summary ─────────────────────────────────────────────
        story.append(Paragraph("Executive Summary", heading))
        by_sev: dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for v in vs:
            by_sev[v.severity.value] += 1

        summary_data = [["Severity", "Count"]] + [
            [sev, str(count)] for sev, count in by_sev.items()
        ]
        summary_table = Table(summary_data, colWidths=[80 * mm, 40 * mm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LTGRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 6 * mm))

        # ── 3. Step trace table ───────────────────────────────────────────────
        story.append(Paragraph("Step Trace", heading))
        step_data = [["#", "Type", "Model / Tool", "Latency (ms)", "Tokens"]]
        for i, s in enumerate(t.steps, 1):
            step_data.append([
                str(i),
                s.step_type,
                s.model or s.tool_name or "—",
                f"{s.latency_ms:.0f}" if s.latency_ms is not None else "—",
                str(s.token_count) if s.token_count is not None else "—",
            ])
        step_table = Table(step_data, colWidths=[10 * mm, 30 * mm, 60 * mm, 30 * mm, 20 * mm])
        step_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LTGRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(step_table)
        story.append(Spacer(1, 6 * mm))

        # ── 4. Violations detail ─────────────────────────────────────────────
        if vs:
            story.append(Paragraph("Violations", heading))
            for v in vs:
                bg, fg = sev_colors.get(v.severity, (LTGRAY, DARK))
                vdata = [
                    [f"[{v.severity.value}]  {v.rule_id}", ""],
                    ["Message:", v.message],
                    ["Regulation:", v.regulatory_reference or "—"],
                    ["Remediation:", v.remediation or "—"],
                    ["Detected at:", v.detected_at],
                    ["Resolution:", v.resolution or "—"],
                ]
                vtable = Table(vdata, colWidths=[40 * mm, 120 * mm])
                vtable.setStyle(TableStyle([
                    ("SPAN",       (0, 0), (-1, 0)),
                    ("BACKGROUND", (0, 0), (-1, 0), bg),
                    ("TEXTCOLOR",  (0, 0), (-1, 0), fg),
                    ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE",   (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LTGRAY]),
                ]))
                story.append(vtable)
                story.append(Spacer(1, 3 * mm))

        # ── 5. Decision narrative ─────────────────────────────────────────────
        story.append(Paragraph("Decision Narrative", heading))
        narrative_text = self._generate_narrative()
        story.append(Paragraph(narrative_text, body))
        story.append(Paragraph(
            "<i>AI-GENERATED NARRATIVE — FOR INFORMATIONAL PURPOSES ONLY</i>", sub
        ))

        # ── 6. Integrity ──────────────────────────────────────────────────────
        from glassbox.tracer import verify_chain
        chain_valid = verify_chain(t.steps)
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("Integrity Attestation", heading))
        story.append(Paragraph(
            f"Hash algorithm: SHA-256  |  Chain valid: {'✓ YES' if chain_valid else '✗ NO — POSSIBLE TAMPERING'}",
            body,
        ))

        doc.build(story)

    def _generate_narrative(self) -> str:
        t = self._trace
        step_count = len(t.steps)
        violation_count = len(self._violations)
        critical_count = sum(1 for v in self._violations if v.severity.value == "CRITICAL")

        try:
            narrative = self._llm_narrative()
            if narrative:
                return narrative
        except Exception:
            pass

        # Template fallback
        outcome = "halted due to a compliance violation" if t.halted else "completed"
        return (
            f"The agent session '{t.task_description or t.trace_id}' {outcome} after "
            f"executing {step_count} traced step(s). "
            f"A total of {violation_count} compliance violation(s) were detected"
            + (f", including {critical_count} critical violation(s)" if critical_count else "")
            + f". Session started at {t.session_start.strftime('%Y-%m-%d %H:%M UTC')}"
            + (f" and ended at {t.session_end.strftime('%Y-%m-%d %H:%M UTC')}" if t.session_end else "")
            + "."
        )

    def _llm_narrative(self) -> Optional[str]:
        import os
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            return None
        try:
            import openai
            client = openai.OpenAI(api_key=api_key)
            t = self._trace
            steps_summary = "; ".join(
                f"step {i+1}: {s.step_type} ({s.model or s.tool_name or '—'})"
                for i, s in enumerate(t.steps)
            )
            violations_summary = "; ".join(
                f"{v.rule_id} ({v.severity.value})" for v in self._violations
            ) or "none"
            prompt = (
                f"Agent trace summary — {len(t.steps)} steps: {steps_summary}. "
                f"Violations detected: {violations_summary}. "
                f"Session {'was halted' if t.halted else 'completed normally'}."
            )
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a compliance documentation assistant. Given the following "
                            "agent trace, write a single paragraph (maximum 150 words) describing "
                            "what the agent did, what decisions it made, and what compliance issues "
                            "were detected. Describe only what is in the trace — do not infer or "
                            "speculate. Do not use the word 'I'."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=200,
            )
            return resp.choices[0].message.content
        except Exception:
            return None
