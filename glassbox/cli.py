from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _load_trail(path: str) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def cmd_verify(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    steps_raw = trail.get("steps", [])

    from glassbox.models import TraceStep
    from glassbox.tracer import verify_chain
    from datetime import datetime

    steps = []
    for s in steps_raw:
        s["timestamp"] = datetime.fromisoformat(s["timestamp"])
        steps.append(TraceStep(**{k: v for k, v in s.items() if k in TraceStep.__dataclass_fields__}))

    if verify_chain(steps):
        print(f"✓ Hash chain valid ({len(steps)} steps)")
        return 0
    else:
        print("✗ Hash chain INVALID — possible tampering detected", file=sys.stderr)
        return 1


def cmd_violations(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    violations = trail.get("violations", [])
    severity_filter = (args.severity or "").upper() or None

    found = 0
    for v in violations:
        if severity_filter and v.get("severity") != severity_filter:
            continue
        print(
            f"[{v['severity']}] {v['rule_id']}  "
            f"step:{v.get('step', {}).get('step_id', '?')[:8]}  "
            f"{v['message']}"
        )
        found += 1

    if found == 0:
        print("No violations found.")
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    required_keys = {"schema_version", "trace_id", "session", "steps", "violations", "integrity"}
    missing = required_keys - set(trail.keys())
    if missing:
        print(f"✗ Invalid trail — missing keys: {', '.join(sorted(missing))}", file=sys.stderr)
        return 1
    print(f"✓ Trail valid  schema_version={trail['schema_version']}  "
          f"steps={len(trail['steps'])}  violations={len(trail['violations'])}")
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    output = args.output or Path(args.trail).stem + f".{args.format}"
    fmt = (args.format or "pdf").lower()

    if fmt == "json":
        import shutil
        shutil.copy(args.trail, output)
        print(f"✓ JSON trail written to {output}")
        return 0

    if fmt == "pdf":
        # Reconstruct AgentTrace + violations from the JSON trail
        from datetime import datetime

        from glassbox.models import (AgentTrace, Severity, TraceStep, Trigger,
                                      Violation)
        from glassbox.reporter.pdf_reporter import PdfReporter

        raw_steps = trail.get("steps", [])
        steps = []
        for s in raw_steps:
            s["timestamp"] = datetime.fromisoformat(s["timestamp"])
            steps.append(TraceStep(**{k: v for k, v in s.items()
                                      if k in TraceStep.__dataclass_fields__}))

        sess = trail.get("session", {})
        trace = AgentTrace(
            trace_id=trail["trace_id"],
            session_start=datetime.fromisoformat(sess.get("start", datetime.utcnow().isoformat())),
            task_description=sess.get("name"),
            jurisdiction=sess.get("jurisdiction"),
            steps=steps,
            halted=sess.get("halted", False),
            halt_reason=sess.get("halt_reason"),
        )

        violations: list[Violation] = []
        for v_raw in trail.get("violations", []):
            step_raw = v_raw.pop("step", {})
            step_raw["timestamp"] = datetime.fromisoformat(step_raw.get("timestamp", datetime.utcnow().isoformat()))
            step = TraceStep(**{k: v for k, v in step_raw.items()
                                if k in TraceStep.__dataclass_fields__})
            v_raw["step"] = step
            v_raw["severity"] = Severity(v_raw["severity"])
            violations.append(Violation(**{k: v for k, v in v_raw.items()
                                           if k in Violation.__dataclass_fields__}))

        PdfReporter(trace, violations, narrative=not args.no_narrative).write(output)
        print(f"✓ PDF report written to {output}")
        return 0

    print(f"Unknown format: {fmt}", file=sys.stderr)
    return 1


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="glassbox-fin",
        description="glassbox-fin — compliance audit trail CLI",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # verify
    p_verify = sub.add_parser("verify", help="Re-compute and verify the hash chain")
    p_verify.add_argument("trail", help="Path to JSON audit trail")

    # validate
    p_validate = sub.add_parser("validate", help="Validate trail against schema")
    p_validate.add_argument("trail", help="Path to JSON audit trail")

    # violations
    p_vio = sub.add_parser("violations", help="List violations in a trail")
    p_vio.add_argument("trail", help="Path to JSON audit trail")
    p_vio.add_argument("--severity", help="Filter by severity (CRITICAL|HIGH|MEDIUM|LOW)")

    # report
    p_report = sub.add_parser("report", help="Generate a report from an existing trail")
    p_report.add_argument("trail", help="Path to JSON audit trail")
    p_report.add_argument("--format", default="pdf", choices=["pdf", "json"], help="Output format")
    p_report.add_argument("--output", help="Output file path")
    p_report.add_argument("--no-narrative", action="store_true",
                          help="Skip LLM narrative generation")

    args = parser.parse_args()
    handlers = {
        "verify":     cmd_verify,
        "validate":   cmd_validate,
        "violations": cmd_violations,
        "report":     cmd_report,
    }
    sys.exit(handlers[args.command](args))


if __name__ == "__main__":
    main()
