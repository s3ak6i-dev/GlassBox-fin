"""run / watch — launch your agent with glassbox wired into the environment.

`glassbox run -- python my_agent.py` sets GLASSBOX_KEY / GLASSBOX_API_URL (and
friends) from your config, then execs the command. Your script picks them up via
`AuditSession.from_env(...)`. `watch` additionally renders the resulting trail.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import tempfile

from glassbox.cli import config, ui


def _build_env(args: argparse.Namespace, export: str | None = None) -> dict:
    env = dict(os.environ)
    key = config.resolve("key", cli_value=args.key)
    api = config.resolve("api_url", cli_value=args.api_url)
    juris = config.resolve("jurisdiction")
    if key:
        env["GLASSBOX_KEY"] = key
    env["GLASSBOX_API_URL"] = api
    if juris:
        env["GLASSBOX_JURISDICTION"] = juris
    if export:
        env["GLASSBOX_EXPORT"] = export
    return env, key, api


def _command(args: argparse.Namespace) -> list[str]:
    cmd = list(args.command or [])
    # argparse REMAINDER keeps a leading "--"; drop it.
    if cmd and cmd[0] == "--":
        cmd = cmd[1:]
    return cmd


def cmd_run(args: argparse.Namespace) -> int:
    cmd = _command(args)
    if not cmd:
        ui.fail("Nothing to run. Usage:  glassbox run -- python my_agent.py")
        return 2
    env, key, api = _build_env(args, export=args.export)
    if not key:
        ui.warn("No instrumentation key set — running un-instrumented (offline).")
    else:
        ui.info(f"glassbox wired in · {api} · key {key[:6]}…")
    try:
        return subprocess.run(cmd, env=env).returncode
    except FileNotFoundError:
        ui.fail(f"Command not found: {cmd[0]}")
        return 127


def cmd_watch(args: argparse.Namespace) -> int:
    cmd = _command(args)
    if not cmd:
        ui.fail("Nothing to run. Usage:  glassbox watch -- python my_agent.py")
        return 2
    export = args.export
    tmp = None
    if not export:
        tmp = tempfile.NamedTemporaryFile(prefix="glassbox_", suffix=".json", delete=False)
        tmp.close()
        export = tmp.name
    env, key, api = _build_env(args, export=export)
    ui.info(f"Running {' '.join(cmd)} …")
    rc = subprocess.run(cmd, env=env).returncode

    # Render the trail the run produced.
    from glassbox.cli.commands import trail as trail_cmd
    try:
        data = trail_cmd._load_trail(export)
        ui.out("")
        trail_cmd._render_trail(data)
    except (OSError, ValueError):
        ui.warn("No trail was produced (did your script use AuditSession.from_env(export=...) ?)")
    finally:
        if tmp:
            try:
                os.unlink(export)
            except OSError:
                pass
    return rc
