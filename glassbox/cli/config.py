"""Configuration + key resolution for the glassbox CLI.

Values resolve with this precedence (first wins):

    explicit --flag  →  environment variable  →  project ./.glassbox.json
    →  user ~/.glassbox/config.json  →  built-in default

Config is plain JSON so there are no extra dependencies on Python 3.10.
Secrets (the control-plane token) are only ever written to the *user* file,
never the project file that might be committed.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

USER_DIR = Path.home() / ".glassbox"
USER_CONFIG = USER_DIR / "config.json"
PROJECT_CONFIG = Path.cwd() / ".glassbox.json"

# field name -> environment variable
ENV_MAP = {
    "key": "GLASSBOX_KEY",
    "api_url": "GLASSBOX_API_URL",
    "jurisdiction": "GLASSBOX_JURISDICTION",
    "token": "GLASSBOX_TOKEN",
    "workspace_id": "GLASSBOX_WORKSPACE",
}

DEFAULTS: dict[str, Any] = {
    "api_url": "http://localhost:8000",
    "jurisdiction": "EU",
    "redact_pii": True,
}

# Fields that must never be written to a project file (likely committed).
USER_ONLY_FIELDS = {"token", "email", "workspace_id"}


def _read(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _write(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    # Best-effort tighten perms on the user secrets file (POSIX only).
    if path == USER_CONFIG:
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass


def load_merged() -> dict:
    """User config overlaid by project config."""
    merged = dict(DEFAULTS)
    merged.update(_read(USER_CONFIG))
    merged.update(_read(PROJECT_CONFIG))
    return merged


def resolve(field: str, cli_value: Optional[Any] = None) -> Optional[Any]:
    """Resolve a single field across the precedence chain."""
    if cli_value is not None:
        return cli_value
    env_name = ENV_MAP.get(field)
    if env_name and os.environ.get(env_name):
        return os.environ[env_name]
    project = _read(PROJECT_CONFIG)
    if field in project:
        return project[field]
    user = _read(USER_CONFIG)
    if field in user:
        return user[field]
    return DEFAULTS.get(field)


def source_of(field: str) -> str:
    """Where a value is currently coming from (for `config`/`doctor`)."""
    env_name = ENV_MAP.get(field)
    if env_name and os.environ.get(env_name):
        return f"env:{env_name}"
    if field in _read(PROJECT_CONFIG):
        return "project"
    if field in _read(USER_CONFIG):
        return "user"
    if field in DEFAULTS:
        return "default"
    return "unset"


def set_value(field: str, value: Any, scope: str = "user") -> Path:
    if scope == "project" and field in USER_ONLY_FIELDS:
        raise ValueError(f"'{field}' is a secret and is only stored in the user config")
    path = PROJECT_CONFIG if scope == "project" else USER_CONFIG
    data = _read(path)
    data[field] = value
    _write(path, data)
    return path


def unset_value(field: str, scope: str = "user") -> Path:
    path = PROJECT_CONFIG if scope == "project" else USER_CONFIG
    data = _read(path)
    data.pop(field, None)
    _write(path, data)
    return path


def write_project(data: dict) -> Path:
    """Used by `init` to scaffold a fresh project config."""
    _write(PROJECT_CONFIG, data)
    return PROJECT_CONFIG
