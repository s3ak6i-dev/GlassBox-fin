"""Offline smoke tests for the glassbox CLI.

Exercise the commands that need no backend: config/key roundtrip, init, and the
trail tools against a freshly generated trail file.
"""
import json

import pytest

from glassbox import AuditSession
from glassbox.cli import config, main


def _run(argv) -> int:
    with pytest.raises(SystemExit) as exc:
        main(argv)
    return exc.value.code or 0


@pytest.fixture
def isolated_config(tmp_path, monkeypatch):
    """Point user + project config at a temp dir so tests don't touch real files."""
    monkeypatch.setattr(config, "USER_CONFIG", tmp_path / "user.json")
    monkeypatch.setattr(config, "PROJECT_CONFIG", tmp_path / "project.json")
    monkeypatch.delenv("GLASSBOX_KEY", raising=False)
    return tmp_path


@pytest.fixture
def trail_file(tmp_path):
    path = tmp_path / "trail.json"
    with AuditSession("test agent", export=str(path)) as audit:
        audit.llm_call("gpt-4o", "hello", lambda: "world", token_count=10)
        audit.decision("approved")
    assert path.exists()
    return str(path)


def test_version(capsys):
    assert _run(["--version"]) == 0
    assert "glassbox-fin" in capsys.readouterr().out


def test_key_set_and_show(isolated_config, capsys):
    assert _run(["key", "set", "supersecretkey12345"]) == 0
    assert config.resolve("key") == "supersecretkey12345"

    assert _run(["key", "show"]) == 0
    out = capsys.readouterr().out
    assert "supersecretkey12345" not in out  # masked by default
    assert "super" in out

    assert _run(["key", "show", "--reveal"]) == 0
    assert "supersecretkey12345" in capsys.readouterr().out


def test_key_env(isolated_config, capsys):
    _run(["key", "set", "k123456789abc"])
    assert _run(["key", "env", "--shell", "bash"]) == 0
    out = capsys.readouterr().out
    assert 'export GLASSBOX_KEY="k123456789abc"' in out


def test_init_writes_project_config(isolated_config, capsys):
    assert _run(["init", "--api-url", "http://localhost:9999"]) == 0
    data = json.loads((isolated_config / "project.json").read_text())
    assert data["api_url"] == "http://localhost:9999"


def test_completion(capsys):
    assert _run(["completion", "bash"]) == 0
    assert "complete -F" in capsys.readouterr().out


def test_verify(trail_file):
    assert _run(["verify", trail_file]) == 0


def test_validate(trail_file):
    assert _run(["validate", trail_file]) == 0


def test_show_json(trail_file, capsys):
    assert _run(["--json", "show", trail_file]) == 0
    parsed = json.loads(capsys.readouterr().out)
    assert parsed["trace_id"]


def test_diff_identical(trail_file):
    assert _run(["diff", trail_file, trail_file]) == 0


def test_verify_detects_tamper(trail_file):
    data = json.loads(open(trail_file).read())
    data["steps"][0]["output"] = "TAMPERED"
    open(trail_file, "w").write(json.dumps(data))
    assert _run(["verify", trail_file]) == 1
