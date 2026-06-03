"""glassbox CLI — install, configure, key-manage, run and inspect from the terminal.

Entry point for the `glassbox`, `gbx` and `glassbox-fin` console scripts.
"""
from __future__ import annotations

import argparse
import sys

from glassbox.cli import ui


def _version() -> str:
    try:
        from importlib.metadata import version
        return version("glassbox-fin")
    except Exception:
        return "0.1.0a1"


def build_parser() -> argparse.ArgumentParser:
    from glassbox.cli.commands import control, keys, runner, setup, trail

    p = argparse.ArgumentParser(
        prog="glassbox",
        description="glassbox-fin - compliance guardrails & audit trails for LLM agents",
    )
    p.add_argument("--plain", action="store_true", help="No colors/banner (plain text)")
    p.add_argument("--no-color", action="store_true", help="Disable ANSI colors")
    p.add_argument("--json", action="store_true", help="Machine-readable JSON output")
    p.add_argument("--version", action="version", version=f"glassbox-fin {_version()}")
    sub = p.add_subparsers(dest="cmd")

    # ── setup ────────────────────────────────────────────────────────────
    pi = sub.add_parser("init", help="Scaffold a project .glassbox.json")
    pi.add_argument("--key", help="Instrumentation key to store")
    pi.add_argument("--api-url", help="Backend API URL")
    pi.add_argument("--jurisdiction", help="Default jurisdiction (EU/UK/US)")
    pi.add_argument("--force", action="store_true", help="Overwrite existing config")
    pi.set_defaults(func=setup.cmd_init)

    pd = sub.add_parser("doctor", help="Environment + connectivity health check")
    pd.set_defaults(func=setup.cmd_doctor)

    pin = sub.add_parser("install", help="pip install an optional extra (openai, langchain, all, ...)")
    pin.add_argument("extra", help="Extra to install")
    pin.set_defaults(func=setup.cmd_install)

    pc = sub.add_parser("completion", help="Print a shell-completion script (bash/zsh/powershell)")
    pc.add_argument("shell", choices=["bash", "zsh", "powershell"])
    pc.set_defaults(func=setup.cmd_completion)

    # ── key ──────────────────────────────────────────────────────────────
    pk = sub.add_parser("key", help="Manage the instrumentation key")
    ksub = pk.add_subparsers(dest="subcommand", required=True)
    ks = ksub.add_parser("set", help="Store the key")
    ks.add_argument("key")
    ks.add_argument("--project", action="store_true", help="Store in project config (not user)")
    ks.set_defaults(func=keys.cmd_set)
    ksh = ksub.add_parser("show", help="Show the current key (masked)")
    ksh.add_argument("--reveal", action="store_true", help="Print the full key")
    ksh.add_argument("--key", help=argparse.SUPPRESS)
    ksh.set_defaults(func=keys.cmd_show)
    kt = ksub.add_parser("test", help="Validate the key against the backend")
    kt.add_argument("--key", help="Key to test (overrides config)")
    kt.add_argument("--api-url", help="Backend API URL")
    kt.set_defaults(func=keys.cmd_test)
    ke = ksub.add_parser("env", help="Print shell export lines for the key")
    ke.add_argument("--shell", choices=["powershell", "bash", "cmd"], help="Shell flavor")
    ke.add_argument("--key", help=argparse.SUPPRESS)
    ke.add_argument("--api-url", help=argparse.SUPPRESS)
    ke.set_defaults(func=keys.cmd_env)
    kr = ksub.add_parser("rotate", help="How to rotate the key")
    kr.set_defaults(func=keys.cmd_rotate)

    # ── run / watch ──────────────────────────────────────────────────────
    pr = sub.add_parser("run", help="Run your agent with glassbox wired into the env")
    pr.add_argument("--key", help="Override key")
    pr.add_argument("--api-url", help="Override API URL")
    pr.add_argument("--export", help="Write the trail JSON to this path")
    pr.add_argument("command", nargs=argparse.REMAINDER, help="-- your command")
    pr.set_defaults(func=runner.cmd_run)

    pw = sub.add_parser("watch", help="Run your agent, then render the resulting trail")
    pw.add_argument("--key", help="Override key")
    pw.add_argument("--api-url", help="Override API URL")
    pw.add_argument("--export", help="Trail path to render (default: temp file)")
    pw.add_argument("command", nargs=argparse.REMAINDER, help="-- your command")
    pw.set_defaults(func=runner.cmd_watch)

    # ── trail tools ──────────────────────────────────────────────────────
    pv = sub.add_parser("verify", help="Verify a trail's hash chain")
    pv.add_argument("trail")
    pv.set_defaults(func=trail.cmd_verify)
    pva = sub.add_parser("validate", help="Validate a trail against the schema")
    pva.add_argument("trail")
    pva.set_defaults(func=trail.cmd_validate)
    pvi = sub.add_parser("violations", help="List violations in a trail")
    pvi.add_argument("trail")
    pvi.add_argument("--severity", help="Filter (CRITICAL|HIGH|MEDIUM|LOW)")
    pvi.set_defaults(func=trail.cmd_violations)
    prp = sub.add_parser("report", help="Generate a report from a trail")
    prp.add_argument("trail")
    prp.add_argument("--format", default="pdf", choices=["pdf", "json"])
    prp.add_argument("--output")
    prp.add_argument("--no-narrative", action="store_true")
    prp.set_defaults(func=trail.cmd_report)
    psh = sub.add_parser("show", help="Pretty-print a trail")
    psh.add_argument("trail")
    psh.set_defaults(func=trail.cmd_show)
    pt = sub.add_parser("tail", help="Follow a trail file as it's written")
    pt.add_argument("trail")
    pt.add_argument("--interval", type=float, default=1.0, help="Poll seconds")
    pt.set_defaults(func=trail.cmd_tail)
    pdf = sub.add_parser("diff", help="Compare two trails")
    pdf.add_argument("a")
    pdf.add_argument("b")
    pdf.set_defaults(func=trail.cmd_diff)

    # ── online ───────────────────────────────────────────────────────────
    pl = sub.add_parser("login", help="Authenticate to the control plane")
    pl.add_argument("--email")
    pl.add_argument("--password", help="(prompted securely if omitted)")
    pl.add_argument("--api-url")
    pl.set_defaults(func=control.cmd_login)
    pst = sub.add_parser("status", help="Workspace summary from the backend")
    pst.add_argument("--api-url")
    pst.set_defaults(func=control.cmd_status)
    ph = sub.add_parser("holds", help="List or resolve pending holds")
    ph.add_argument("action", nargs="?", default="list", choices=["list", "approve", "deny"])
    ph.add_argument("hold_id", nargs="?")
    ph.add_argument("--notes", help="Resolution note")
    ph.add_argument("--api-url")
    ph.set_defaults(func=control.cmd_holds)

    return p


# commands that get the big banner when run interactively
_BANNER_COMMANDS = {"doctor", "status", None}


def main(argv: list[str] | None = None) -> None:
    # Make Unicode safe before argparse can print --help/--version on Windows.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except Exception:
            pass
    parser = build_parser()
    args = parser.parse_args(argv)
    ui.configure(plain=args.plain, no_color=args.no_color, json_mode=args.json)

    if not args.cmd:
        ui.banner(f"compliance CLI · v{_version()}")
        parser.print_help()
        sys.exit(0)

    if args.cmd in _BANNER_COMMANDS:
        ui.banner(f"compliance CLI · v{_version()}")

    try:
        rc = args.func(args)
    except FileNotFoundError as exc:
        ui.fail(str(exc))
        rc = 1
    except KeyboardInterrupt:
        rc = 130
    sys.exit(rc or 0)


if __name__ == "__main__":
    main()
