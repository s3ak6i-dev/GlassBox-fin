"""Instrumentation-key commands: set / show / test / env / rotate."""
from __future__ import annotations

import argparse
import os

from glassbox.cli import config, http, ui


def mask(key: str) -> str:
    if not key:
        return "(none)"
    if len(key) <= 12:
        return key[:2] + "…" + key[-2:]
    return f"{key[:6]}…{key[-4:]}"


def cmd_set(args: argparse.Namespace) -> int:
    scope = "project" if args.project else "user"
    path = config.set_value("key", args.key, scope=scope)
    ui.success(f"Key saved to [bold]{path}[/bold] ({scope})")
    if scope == "project":
        ui.info("Heads up: project config may be committed — add it to .gitignore.")
    return 0


def cmd_show(args: argparse.Namespace) -> int:
    key = config.resolve("key", cli_value=args.key)
    if not key:
        if ui.is_json():
            ui.print_json({"key": None})
        else:
            ui.warn("No key set. Use:  glassbox key set <KEY>")
        return 1
    shown = key if args.reveal else mask(key)
    if ui.is_json():
        ui.print_json({"key": shown, "source": config.source_of("key")})
        return 0
    ui.out(f"key: [cyan]{shown}[/cyan]  [dim]({config.source_of('key')})[/dim]")
    if not args.reveal:
        ui.info("Pass --reveal to print the full key.")
    return 0


def cmd_test(args: argparse.Namespace) -> int:
    key = config.resolve("key", cli_value=args.key)
    api = config.resolve("api_url", cli_value=args.api_url)
    if not key:
        ui.fail("No key set. Use:  glassbox key set <KEY>")
        return 1
    try:
        info = http.ping_key(api, key)
    except http.ApiError as exc:
        if ui.is_json():
            ui.print_json({"valid": False, "error": str(exc), "status": exc.status})
        else:
            ui.fail(f"Key rejected: {exc}")
        return 1
    if ui.is_json():
        ui.print_json({"valid": True, **info})
        return 0
    ui.success(
        f"Key valid · agent [bold]{info.get('agent','?')}[/bold] · "
        f"workspace {info.get('workspace_id','?')}"
    )
    return 0


def cmd_env(args: argparse.Namespace) -> int:
    key = config.resolve("key", cli_value=args.key)
    api = config.resolve("api_url", cli_value=args.api_url)
    if not key:
        ui.fail("No key set. Use:  glassbox key set <KEY>")
        return 1
    shell = args.shell or ("powershell" if os.name == "nt" else "bash")
    lines = []
    if shell == "powershell":
        lines = [f'$env:GLASSBOX_KEY = "{key}"', f'$env:GLASSBOX_API_URL = "{api}"']
    elif shell == "cmd":
        lines = [f"set GLASSBOX_KEY={key}", f"set GLASSBOX_API_URL={api}"]
    else:  # bash/zsh
        lines = [f'export GLASSBOX_KEY="{key}"', f'export GLASSBOX_API_URL="{api}"']
    # Raw print (no markup) so it's copy/paste- and eval-friendly.
    print("\n".join(lines))
    return 0


def cmd_rotate(args: argparse.Namespace) -> int:
    # Per-agent key rotation is an authenticated dashboard action; the
    # key-scoped ingest API can't mint a replacement for itself.
    ui.warn("Key rotation is done from the dashboard (Settings → API Keys → reveal/rotate).")
    ui.info("After rotating there, run:  glassbox key set <NEW_KEY>")
    return 0
