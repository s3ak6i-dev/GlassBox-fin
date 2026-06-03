"""End-to-end smoke tests for the backend API.

Covers the critical paths a real user/SDK hits:
  signup -> login -> change password -> invite
  create agent -> ingest a trace (start/step/end)
  raise a hold via the SDK -> approve it from the dashboard -> SDK sees approval
"""
import uuid
from datetime import datetime, timezone

import pytest

pytestmark = pytest.mark.asyncio


def _email():
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


async def _signup(client, email=None, password="password123"):
    email = email or _email()
    r = await client.post("/api/auth/signup", json={
        "email": email, "password": password,
        "org_name": "Acme Capital", "jurisdiction": "EU",
    })
    assert r.status_code == 201, r.text
    return email, password, r.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


async def _first_workspace(client, token):
    r = await client.get("/api/workspaces", headers=_auth(token))
    assert r.status_code == 200, r.text
    workspaces = r.json()
    assert workspaces, "signup should have seeded a 'production' workspace"
    return workspaces[0]["id"]


async def _make_agent(client, token, workspace_id):
    r = await client.post(
        f"/api/agents?workspace_id={workspace_id}", headers=_auth(token),
        json={"name": "loan_underwriter", "description": "test agent"},
    )
    assert r.status_code == 201, r.text
    return r.json()


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #

async def test_signup_login_me(client):
    email, password, token = await _signup(client)

    r = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    login_token = r.json()["access_token"]

    r = await client.get("/api/auth/me", headers=_auth(login_token))
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["email"] == email
    assert me["role"] == "admin"


async def test_login_rejects_bad_password(client):
    email, _, _ = await _signup(client)
    r = await client.post("/api/auth/login", json={"email": email, "password": "wrong"})
    assert r.status_code == 401


async def test_duplicate_signup_rejected(client):
    email, _, _ = await _signup(client)
    r = await client.post("/api/auth/signup", json={
        "email": email, "password": "password123",
        "org_name": "Other", "jurisdiction": "EU",
    })
    assert r.status_code == 400


async def test_change_password(client):
    email, password, token = await _signup(client)

    # too short -> rejected
    r = await client.post("/api/auth/password", headers=_auth(token), json={"new_password": "short"})
    assert r.status_code == 400

    r = await client.post("/api/auth/password", headers=_auth(token), json={"new_password": "brandNewSecret1"})
    assert r.status_code == 204

    # old password no longer works, new one does
    assert (await client.post("/api/auth/login", json={"email": email, "password": password})).status_code == 401
    assert (await client.post("/api/auth/login", json={"email": email, "password": "brandNewSecret1"})).status_code == 200


async def test_invite_returns_temp_password_that_works(client):
    _, _, token = await _signup(client)
    invitee = _email()

    r = await client.post("/api/org/invite", headers=_auth(token), json={"email": invitee, "role": "developer"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["email"] == invitee
    assert body["temp_password"] and len(body["temp_password"]) >= 12

    # the invitee can actually log in with the generated password
    r = await client.post("/api/auth/login", json={"email": invitee, "password": body["temp_password"]})
    assert r.status_code == 200, r.text


# --------------------------------------------------------------------------- #
# Ingest + holds (the SDK <-> dashboard contract)
# --------------------------------------------------------------------------- #

async def test_ingest_trace_lifecycle(client):
    _, _, token = await _signup(client)
    ws = await _first_workspace(client, token)
    agent = await _make_agent(client, token, ws)
    key = agent["instrumentation_key"]
    kh = {"X-Glassbox-Key": key}

    trace_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    r = await client.post("/api/ingest/trace/start", headers=kh, json={
        "trace_id": trace_id, "session_start": now,
        "task_description": "Underwrite loan #42", "jurisdiction": "EU",
    })
    assert r.status_code == 201, r.text

    step_id = str(uuid.uuid4())
    r = await client.post(f"/api/ingest/trace/{trace_id}/step", headers=kh, json={
        "step_id": step_id, "timestamp": now, "step_type": "llm_call",
        "model": "gpt-4o", "prompt": "assess applicant", "output": "approved",
        "token_count": 200,
    })
    assert r.status_code == 201, r.text

    r = await client.post(f"/api/ingest/trace/{trace_id}/end", headers=kh, json={
        "session_end": now, "halted": False, "step_count": 1, "violations": [],
    })
    assert r.status_code == 200, r.text

    # invalid key is rejected
    r = await client.post("/api/ingest/trace/start", headers={"X-Glassbox-Key": str(uuid.uuid4())}, json={
        "trace_id": str(uuid.uuid4()), "session_start": now,
    })
    assert r.status_code == 401


async def test_hold_raise_then_approve(client):
    _, _, token = await _signup(client)
    ws = await _first_workspace(client, token)
    agent = await _make_agent(client, token, ws)
    key = agent["instrumentation_key"]
    kh = {"X-Glassbox-Key": key}

    trace_id = str(uuid.uuid4())
    step_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    await client.post("/api/ingest/trace/start", headers=kh, json={
        "trace_id": trace_id, "session_start": now, "task_description": "risky payout",
    })

    # SDK pauses on a critical violation -> creates a hold
    r = await client.post("/api/ingest/hold", headers=kh, json={
        "trace_id": trace_id,
        "violation": {
            "violation_id": str(uuid.uuid4()), "rule_id": "LARGE_TRANSFER",
            "severity": "CRITICAL", "step_id": step_id,
            "message": "Transfer above approval threshold",
            "regulatory_reference": "MiFID II",
        },
        "step": {
            "step_id": step_id, "timestamp": now, "step_type": "tool_call",
            "tool_name": "wire_transfer", "tool_arguments": {"amount": 1_000_000},
        },
    })
    assert r.status_code == 201, r.text
    hold_id = r.json()["hold_id"]

    # SDK polling sees it pending
    r = await client.get(f"/api/ingest/hold/{hold_id}", headers=kh)
    assert r.status_code == 200 and r.json()["status"] == "pending"

    # dashboard lists the pending hold
    r = await client.get(f"/api/holds?workspace_id={ws}&status=pending", headers=_auth(token))
    assert r.status_code == 200, r.text
    holds = r.json()
    assert any(h["id"] == hold_id for h in holds)
    assert holds[0]["rule_id"] == "LARGE_TRANSFER"

    # reviewer approves
    r = await client.post(f"/api/holds/{hold_id}/approve", headers=_auth(token), json={"notes": "verified"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "approved"

    # SDK polling now sees approval -> agent resumes
    r = await client.get(f"/api/ingest/hold/{hold_id}", headers=kh)
    assert r.status_code == 200 and r.json()["status"] == "approved"

    # double-approve is rejected
    r = await client.post(f"/api/holds/{hold_id}/approve", headers=_auth(token), json={})
    assert r.status_code == 400
