"""Online control-plane commands: login / status / holds.

These talk to the dashboard API with a JWT obtained via `glassbox login`.
The token + workspace are stored in the USER config only.
"""
from __future__ import annotations

import argparse
import getpass

from glassbox.cli import config, http, ui


def _client(args: argparse.Namespace) -> tuple[http.ControlPlane, str]:
    api = config.resolve("api_url", cli_value=getattr(args, "api_url", None))
    token = config.resolve("token")
    return http.ControlPlane(api, token), api


def _require_login(args) -> tuple[http.ControlPlane, str, str] | None:
    cp, api = _client(args)
    if not cp.token:
        ui.fail("Not logged in. Run:  glassbox login")
        return None
    ws = config.resolve("workspace_id")
    if not ws:
        ui.fail("No workspace selected. Run:  glassbox login")
        return None
    return cp, api, ws


def cmd_login(args: argparse.Namespace) -> int:
    cp, api = _client(args)
    email = args.email or input("Email: ").strip()
    password = args.password or getpass.getpass("Password: ")
    try:
        res = cp.post("/api/auth/login", {"email": email, "password": password})
        token = res["access_token"]
    except http.ApiError as exc:
        ui.fail(f"Login failed: {exc}")
        return 1

    config.set_value("token", token, scope="user")
    config.set_value("email", email, scope="user")

    # Pick a workspace (first one) so status/holds work out of the box.
    cp.token = token
    try:
        workspaces = cp.get("/api/workspaces") or []
        if workspaces:
            config.set_value("workspace_id", workspaces[0]["id"], scope="user")
    except http.ApiError:
        pass

    ui.success(f"Logged in as [bold]{email}[/bold] · {api}")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    got = _require_login(args)
    if not got:
        return 1
    cp, api, ws = got
    try:
        o = cp.get(f"/api/stats/overview?workspace_id={ws}")
    except http.ApiError as exc:
        ui.fail(f"Could not fetch status: {exc}")
        return 1
    if ui.is_json():
        ui.print_json(o)
        return 0
    ui.table(
        ["Metric", "Value"],
        [
            ["Traces today", str(o["traces_today"])],
            ["Traces (7d)", str(o["traces_week"])],
            ["Active violations", str(o["active_violations"])],
            ["Critical", str(o["critical_violations"])],
            ["Pending holds", str(o["holds_pending"])],
            ["Spend (month)", f"${o['spend_month']:.2f}"],
            ["Agents", str(o["agents_total"])],
        ],
        title=f"glassbox status · {api}",
    )
    return 0


def cmd_holds(args: argparse.Namespace) -> int:
    got = _require_login(args)
    if not got:
        return 1
    cp, api, ws = got

    # approve / deny
    if args.action in ("approve", "deny"):
        if not args.hold_id:
            ui.fail(f"Usage:  glassbox holds {args.action} <HOLD_ID>")
            return 2
        try:
            res = cp.post(f"/api/holds/{args.hold_id}/{args.action}", {"notes": args.notes})
        except http.ApiError as exc:
            ui.fail(f"Could not {args.action} hold: {exc}")
            return 1
        ui.success(f"Hold {args.hold_id[:8]} → [bold]{res['status']}[/bold]")
        return 0

    # default: list pending
    try:
        holds = cp.get(f"/api/holds?workspace_id={ws}&status=pending") or []
    except http.ApiError as exc:
        ui.fail(f"Could not fetch holds: {exc}")
        return 1
    if ui.is_json():
        ui.print_json(holds)
        return 0
    if not holds:
        ui.info("No pending holds. ✓")
        return 0
    rows = [
        [h["id"][:8], ui.severity_tag(h["severity"]), h["rule_id"],
         h.get("agent_name") or "?", (h.get("message") or "")[:48]]
        for h in holds
    ]
    ui.table(["ID", "Severity", "Rule", "Agent", "Message"], rows, title="Pending holds")
    ui.info("Approve with:  glassbox holds approve <ID>")
    return 0
