"""Terminal presentation for the glassbox CLI.

Everything visual goes through here so the rest of the CLI doesn't care whether
rich/pyfiglet are present or whether we're in --plain / --json mode. If the
pretty deps are missing we degrade to plain stdout instead of crashing.
"""
from __future__ import annotations

import json as _json
import sys
from typing import Any, Optional

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.text import Text
    _HAS_RICH = True
except Exception:  # pragma: no cover - rich is a declared dep
    _HAS_RICH = False

try:
    from pyfiglet import figlet_format
    _HAS_FIGLET = True
except Exception:  # pragma: no cover
    _HAS_FIGLET = False


# ── module state, set by main() from global flags ───────────────────────────
_plain = False
_json_mode = False

_console = Console() if _HAS_RICH else None
_err_console = Console(stderr=True) if _HAS_RICH else None

SEV_STYLE = {
    "CRITICAL": "bold white on red",
    "HIGH": "bold red",
    "MEDIUM": "yellow",
    "LOW": "cyan",
}
SEV_COLOR = {"CRITICAL": "red", "HIGH": "red", "MEDIUM": "yellow", "LOW": "cyan"}


def configure(*, plain: bool = False, no_color: bool = False, json_mode: bool = False) -> None:
    global _plain, _json_mode, _console, _err_console
    # Make Unicode (✓, banners, box-drawing) safe on Windows consoles.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except Exception:
            pass
    _plain = plain or not _HAS_RICH
    _json_mode = json_mode
    if _HAS_RICH:
        force_terminal = None if not no_color else False
        # legacy_windows=False → emit ANSI instead of the win32 API path that
        # encodes through cp1252 and chokes on non-Latin-1 glyphs.
        _console = Console(no_color=no_color, force_terminal=force_terminal, legacy_windows=False)
        _err_console = Console(stderr=True, no_color=no_color, legacy_windows=False)


def is_json() -> bool:
    return _json_mode


# ── primitives ──────────────────────────────────────────────────────────────

def out(msg: str = "") -> None:
    if _console is not None and not _plain:
        _console.print(msg)
    else:
        print(_strip(msg))


def err(msg: str) -> None:
    if _err_console is not None and not _plain:
        _err_console.print(msg)
    else:
        print(_strip(msg), file=sys.stderr)


def success(msg: str) -> None:
    out(f"[green]✓[/green] {msg}" if not _plain else f"[ok] {msg}")


def warn(msg: str) -> None:
    out(f"[yellow]![/yellow] {msg}" if not _plain else f"[!] {msg}")


def fail(msg: str) -> None:
    err(f"[red]✗[/red] {msg}" if not _plain else f"[x] {msg}")


def info(msg: str) -> None:
    out(f"[dim]{msg}[/dim]" if not _plain else msg)


def print_json(obj: Any) -> None:
    print(_json.dumps(obj, indent=2, default=str))


def _strip(msg: str) -> str:
    """Remove rich markup tags for plain output."""
    import re
    return re.sub(r"\[/?[a-z0-9 _#]+\]", "", msg, flags=re.IGNORECASE)


# ── banner ──────────────────────────────────────────────────────────────────

def banner(subtitle: Optional[str] = None) -> None:
    """Big block-letter GLASSBOX banner. Suppressed in --plain/--json or when
    stdout is piped."""
    if _json_mode or _plain or not sys.stdout.isatty():
        return
    art = None
    if _HAS_FIGLET:
        try:
            art = figlet_format("glassbox", font="ansi_shadow").rstrip("\n")
        except Exception:
            art = None
    if art is None:
        art = "glassbox·fin"
    if _console is not None:
        grad = Text(art, style="bold")
        # amber→coral vertical-ish gradient feel via per-line color
        colors = ["#f0b429", "#f59e42", "#f97362", "#f9617b"]
        lines = art.split("\n")
        grad = Text()
        for i, line in enumerate(lines):
            grad.append(line + "\n", style=f"bold {colors[i % len(colors)]}")
        _console.print(grad)
        if subtitle:
            _console.print(f"  [dim]{subtitle}[/dim]\n")
    else:
        print(art)
        if subtitle:
            print(f"  {subtitle}\n")


# ── tables ──────────────────────────────────────────────────────────────────

def table(columns: list[str], rows: list[list[str]], title: Optional[str] = None) -> None:
    if _console is None or _plain:
        if title:
            print(title)
        widths = [max(len(str(columns[i])), *(len(str(r[i])) for r in rows)) if rows else len(columns[i])
                  for i in range(len(columns))]
        print("  ".join(str(c).ljust(widths[i]) for i, c in enumerate(columns)))
        for r in rows:
            print("  ".join(str(c).ljust(widths[i]) for i, c in enumerate(r)))
        return
    t = Table(title=title, header_style="bold", border_style="grey37", expand=False)
    for c in columns:
        t.add_column(c)
    for r in rows:
        t.add_row(*[str(c) for c in r])
    _console.print(t)


def panel(body: str, title: Optional[str] = None, style: str = "grey37") -> None:
    if _console is None or _plain:
        if title:
            print(f"== {title} ==")
        print(_strip(body))
        return
    _console.print(Panel(body, title=title, border_style=style))


def severity_tag(sev: str) -> str:
    sev = (sev or "").upper()
    if _plain:
        return f"[{sev}]"
    style = SEV_STYLE.get(sev, "white")
    return f"[{style}] {sev} [/]"
