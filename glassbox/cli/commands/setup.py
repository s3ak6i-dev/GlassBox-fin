"""Setup commands: init, doctor, install."""
from __future__ import annotations

import argparse
import importlib.util
import subprocess
import sys

from glassbox.cli import config, http, ui

ADAPTERS = ["openai", "anthropic", "langchain", "llamaindex"]
EXTRAS = ADAPTERS + ["all", "cli", "dev"]


def cmd_init(args: argparse.Namespace) -> int:
    existing = config.PROJECT_CONFIG.exists()
    if existing and not args.force:
        ui.warn(f"{config.PROJECT_CONFIG.name} already exists — use --force to overwrite")
        return 1
    data = {
        "api_url": args.api_url or config.resolve("api_url"),
        "jurisdiction": args.jurisdiction or config.resolve("jurisdiction"),
        "redact_pii": True,
    }
    if args.key:
        data["key"] = args.key
    config.write_project(data)
    ui.success(f"Wrote [bold]{config.PROJECT_CONFIG.name}[/bold]")
    if not args.key:
        ui.info("Set your instrumentation key with:  glassbox key set <KEY>")
    ui.info("Tip: add .glassbox.json to .gitignore if it will hold a key.")
    return 0


def _installed(module: str) -> bool:
    return importlib.util.find_spec(module) is not None


def cmd_doctor(args: argparse.Namespace) -> int:
    rows = []
    ok = True

    # Python
    pyver = ".".join(map(str, sys.version_info[:3]))
    py_ok = sys.version_info >= (3, 10)
    ok &= py_ok
    rows.append(["Python", pyver, _yn(py_ok)])

    # pretty deps
    for mod in ("rich", "pyfiglet", "reportlab"):
        present = _installed(mod)
        rows.append([f"dep: {mod}", "installed" if present else "missing", _yn(present)])

    # adapters
    detected = [a for a in ADAPTERS if _installed(a if a != "llamaindex" else "llama_index")]
    rows.append(["frameworks", ", ".join(detected) or "none detected", _yn(True)])

    # key
    key = config.resolve("key")
    rows.append(["key", ui_mask(key) if key else "not set", _yn(bool(key))])

    # api url
    api = config.resolve("api_url")
    rows.append(["api_url", f"{api} ({config.source_of('api_url')})", "—"])

    # connectivity / key validity
    if key:
        try:
            info = http.ping_key(api, key)
            rows.append(["backend", f"reachable · agent '{info.get('agent','?')}'", _yn(True)])
        except http.ApiError as exc:
            ok = False
            rows.append(["backend", f"{exc} (status {exc.status})" if exc.status else str(exc), _yn(False)])
    else:
        rows.append(["backend", "skipped (no key)", "—"])

    if ui.is_json():
        ui.print_json({"ok": ok, "checks": rows})
        return 0 if ok else 1
    ui.table(["Check", "Value", "OK"], rows, title="glassbox doctor")
    (ui.success if ok else ui.fail)("All good" if ok else "Some checks failed")
    return 0 if ok else 1


def cmd_install(args: argparse.Namespace) -> int:
    extra = args.extra
    if extra not in EXTRAS:
        ui.fail(f"Unknown extra '{extra}'. Choose from: {', '.join(EXTRAS)}")
        return 1
    target = f"glassbox-fin[{extra}]"
    ui.info(f"Running: {sys.executable} -m pip install {target}")
    proc = subprocess.run([sys.executable, "-m", "pip", "install", target])
    if proc.returncode == 0:
        ui.success(f"Installed {target}")
    else:
        ui.fail(f"pip exited with {proc.returncode}")
    return proc.returncode


COMMANDS = (
    "init doctor install completion key run watch verify validate violations "
    "report show tail diff login status holds"
)


def cmd_completion(args: argparse.Namespace) -> int:
    """Print a shell-completion script to stdout (source/eval it)."""
    shell = args.shell
    if shell == "bash":
        script = f"""# glassbox bash completion — add to ~/.bashrc:
#   eval "$(glassbox completion bash)"
_glassbox_complete() {{
    local cur="${{COMP_WORDS[COMP_CWORD]}}"
    COMPREPLY=( $(compgen -W "{COMMANDS}" -- "$cur") )
}}
complete -F _glassbox_complete glassbox gbx glassbox-fin
"""
    elif shell == "zsh":
        script = """# glassbox zsh completion — add to ~/.zshrc:
#   eval "$(glassbox completion zsh)"
autoload -Uz compinit && compinit
compdef _gnu_generic glassbox gbx glassbox-fin
"""
    elif shell == "powershell":
        cmds = ", ".join(f"'{c}'" for c in COMMANDS.split())
        script = f"""# glassbox PowerShell completion — add to $PROFILE:
#   glassbox completion powershell | Out-String | Invoke-Expression
Register-ArgumentCompleter -Native -CommandName glassbox,gbx,glassbox-fin -ScriptBlock {{
    param($wordToComplete, $commandAst, $cursorPosition)
    @({cmds}) | Where-Object {{ $_ -like "$wordToComplete*" }} | ForEach-Object {{
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }}
}}
"""
    else:
        ui.fail(f"Unsupported shell '{shell}'")
        return 1
    print(script)
    return 0


def _yn(b: bool) -> str:
    if ui.is_json():
        return "ok" if b else "fail"
    return "[green]✓[/green]" if b else "[red]✗[/red]"


def ui_mask(key: str) -> str:
    from glassbox.cli.commands.keys import mask
    return mask(key)
