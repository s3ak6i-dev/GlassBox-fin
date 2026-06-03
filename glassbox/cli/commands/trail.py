"""Local audit-trail commands — all offline, operate on JSON trail files.

verify / validate / violations / report are the originals; show / tail / diff
are the new viewers.
"""
from __future__ import annotations

import argparse
import json
import shutil
import time
from datetime import datetime
from pathlib import Path

from glassbox.cli import ui


def _load_trail(path: str) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def cmd_verify(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    from glassbox.models import TraceStep
    from glassbox.tracer import verify_chain

    steps = []
    for s in trail.get("steps", []):
        s = dict(s)
        s["timestamp"] = datetime.fromisoformat(s["timestamp"])
        steps.append(TraceStep(**{k: v for k, v in s.items() if k in TraceStep.__dataclass_fields__}))

    ok = verify_chain(steps)
    if ui.is_json():
        ui.print_json({"valid": ok, "steps": len(steps)})
        return 0 if ok else 1
    if ok:
        ui.success(f"Hash chain valid ([bold]{len(steps)}[/bold] steps)")
        return 0
    ui.fail("Hash chain INVALID — possible tampering detected")
    return 1


def cmd_validate(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    required = {"schema_version", "trace_id", "session", "steps", "violations", "integrity"}
    missing = required - set(trail.keys())
    if ui.is_json():
        ui.print_json({"valid": not missing, "missing": sorted(missing)})
        return 1 if missing else 0
    if missing:
        ui.fail(f"Invalid trail — missing keys: {', '.join(sorted(missing))}")
        return 1
    ui.success(
        f"Trail valid  schema_version={trail['schema_version']}  "
        f"steps={len(trail['steps'])}  violations={len(trail['violations'])}"
    )
    return 0


def cmd_violations(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    sev_filter = (args.severity or "").upper() or None
    vios = [v for v in trail.get("violations", []) if not sev_filter or v.get("severity") == sev_filter]

    if ui.is_json():
        ui.print_json(vios)
        return 0
    if not vios:
        ui.info("No violations found.")
        return 0
    rows = [
        [ui.severity_tag(v["severity"]), v["rule_id"],
         (v.get("step", {}).get("step_id", "?") or "?")[:8], v["message"]]
        for v in vios
    ]
    ui.table(["Severity", "Rule", "Step", "Message"], rows, title="Violations")
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    output = args.output or Path(args.trail).stem + f".{args.format}"
    fmt = (args.format or "pdf").lower()

    if fmt == "json":
        shutil.copy(args.trail, output)
        ui.success(f"JSON trail written to [bold]{output}[/bold]")
        return 0

    from glassbox.models import AgentTrace, Severity, TraceStep, Violation
    from glassbox.reporter.pdf_reporter import PdfReporter

    steps = []
    for s in trail.get("steps", []):
        s = dict(s)
        s["timestamp"] = datetime.fromisoformat(s["timestamp"])
        steps.append(TraceStep(**{k: v for k, v in s.items() if k in TraceStep.__dataclass_fields__}))

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
        v_raw = dict(v_raw)
        step_raw = dict(v_raw.pop("step", {}))
        step_raw["timestamp"] = datetime.fromisoformat(step_raw.get("timestamp", datetime.utcnow().isoformat()))
        step = TraceStep(**{k: v for k, v in step_raw.items() if k in TraceStep.__dataclass_fields__})
        v_raw["step"] = step
        v_raw["severity"] = Severity(v_raw["severity"])
        violations.append(Violation(**{k: v for k, v in v_raw.items() if k in Violation.__dataclass_fields__}))

    PdfReporter(trace, violations, narrative=not args.no_narrative).write(output)
    ui.success(f"PDF report written to [bold]{output}[/bold]")
    return 0


def _render_trail(trail: dict) -> None:
    sess = trail.get("session", {})
    steps = trail.get("steps", [])
    vios = trail.get("violations", [])
    halted = sess.get("halted", False)
    head = (
        f"trace [bold]{trail.get('trace_id', '?')[:8]}[/bold]   "
        f"task: {sess.get('name') or '—'}   "
        f"steps: {len(steps)}   "
        f"violations: {len(vios)}   "
        + ("[red]HALTED[/red]" if halted else "[green]completed[/green]")
    )
    ui.panel(head, title="glassbox trail")
    rows = []
    vio_by_step = {}
    for v in vios:
        vio_by_step.setdefault(v.get("step", {}).get("step_id"), []).append(v)
    for s in steps:
        kind = s.get("step_type", "?")
        what = s.get("tool_name") or s.get("model") or ""
        ts = (s.get("timestamp", "") or "")[11:19]
        flag = "⚠" if s.get("step_id") in vio_by_step else ""
        rows.append([ts, kind, what, (s.get("step_hash", "") or "")[:10], flag])
    ui.table(["Time", "Type", "Model/Tool", "Hash", ""], rows, title="Steps")
    if vios:
        vrows = [[ui.severity_tag(v["severity"]), v["rule_id"], v["message"]] for v in vios]
        ui.table(["Severity", "Rule", "Message"], vrows, title="Violations")


def cmd_show(args: argparse.Namespace) -> int:
    trail = _load_trail(args.trail)
    if ui.is_json():
        ui.print_json(trail)
        return 0
    _render_trail(trail)
    return 0


def cmd_tail(args: argparse.Namespace) -> int:
    """Follow a trail file as it is written (re-render on change)."""
    path = Path(args.trail)
    ui.info(f"Following {path} — Ctrl-C to stop")
    last_mtime = None
    try:
        while True:
            if path.exists():
                mtime = path.stat().st_mtime
                if mtime != last_mtime:
                    last_mtime = mtime
                    try:
                        trail = _load_trail(str(path))
                    except (json.JSONDecodeError, OSError):
                        time.sleep(args.interval)
                        continue
                    if ui.is_json():
                        ui.print_json(trail)
                    else:
                        _render_trail(trail)
                        ui.info(f"— refreshed {datetime.now().strftime('%H:%M:%S')} —")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        ui.info("stopped")
        return 0


def cmd_diff(args: argparse.Namespace) -> int:
    a, b = _load_trail(args.a), _load_trail(args.b)

    def summary(t: dict) -> dict:
        return {
            "trace_id": t.get("trace_id"),
            "steps": len(t.get("steps", [])),
            "violations": len(t.get("violations", [])),
            "halted": t.get("session", {}).get("halted", False),
        }

    sa, sb = summary(a), summary(b)
    if ui.is_json():
        ui.print_json({"a": sa, "b": sb})
        return 0
    rows = [[k, str(sa[k]), str(sb[k]), "" if sa[k] == sb[k] else "≠"] for k in sa]
    ui.table(["Field", Path(args.a).name, Path(args.b).name, ""], rows, title="Trail diff")
    return 0
