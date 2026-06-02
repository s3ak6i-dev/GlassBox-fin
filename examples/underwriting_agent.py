"""
underwriting_agent.py — a complete multi-agent loan-underwriting workflow that
exercises EVERY glassbox feature against your running dashboard.

A supervisor delegates to three specialists:
  • fraud-check     → clean trace
  • credit-scoring  → HIGH violations (missing DTI rationale, threshold bypass)
  • decision-notify → tries to email the applicant's national ID → CRITICAL PII
                      → the agent PAUSES and waits for your approval in the
                      Hold Inbox

It runs with a free LLM (Groq / Ollama) for real reasoning, or fully OFFLINE
with canned reasoning if no LLM is configured — either way every step is traced,
hash-chained, and streamed live.

────────────────────────────────────────────────────────────────────────────
SETUP
    pip install glassbox-fin openai        # openai only needed for online mode
    set GLASSBOX_KEY=<supervisor agent key from dashboard ▸ Settings>
    # optional, for real reasoning:
    set GROQ_API_KEY=gsk_...   (or)   set GLASSBOX_PROVIDER=ollama
RUN
    python examples/underwriting_agent.py
    → it pauses partway. Open the dashboard ▸ Holds and click Approve.
────────────────────────────────────────────────────────────────────────────
"""
import os
import sys

try:                                  # Windows consoles default to cp1252
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from glassbox import AuditSession, rules, GuardrailPolicy
from glassbox.guardrails.exceptions import ComplianceHaltError
from glassbox.platform import spawn_subagent

API = os.environ.get("GLASSBOX_API_URL", "http://localhost:8000")

APPLICANT = {
    "id": "A-8821", "name": "M. de Vries", "bsn": "8412.95.302",
    "email": "m.devries@example.com", "income_monthly": 4200,
    "debt_monthly": 1100, "credit_score": 612, "amount": 25000,
}


# ── LLM (free, optional) ──────────────────────────────────────────────────────

def get_llm():
    try:
        from openai import OpenAI
    except ImportError:
        return None, None
    if os.environ.get("GLASSBOX_PROVIDER", "").lower() == "ollama":
        return OpenAI(base_url="http://localhost:11434/v1", api_key="ollama"), "llama3.2"
    key = os.environ.get("GROQ_API_KEY")
    if key:
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=key), "llama-3.1-8b-instant"
    return None, None


CLIENT, REAL_MODEL = get_llm()
ONLINE = CLIENT is not None


def reason(audit, label_model, prompt, canned, tokens=600):
    """One reasoning step — real LLM if available, else canned. Always traced."""
    def fn():
        if ONLINE:
            return CLIENT.chat.completions.create(
                model=REAL_MODEL, messages=[{"role": "user", "content": prompt}],
            ).choices[0].message.content
        return canned
    model = REAL_MODEL if ONLINE else label_model
    return audit.llm_call(model, prompt, fn, token_count=tokens)


def session(name, key, on_critical="pause"):
    return AuditSession(
        name=name, instrumentation_key=key, api_url=API, jurisdiction="EU",
        rules=[rules.PII(), rules.DTIRationale(), rules.ThresholdBypass(),
               rules.DecisionWithoutTrace()],
        guardrails=GuardrailPolicy(on_critical=on_critical, on_high="log"),
    )


def main():
    sup_key = os.environ.get("GLASSBOX_KEY")
    if not sup_key:
        sys.exit("Set GLASSBOX_KEY to your supervisor agent's instrumentation key "
                 "(dashboard ▸ Settings ▸ API Keys).")

    print(f"Mode: {'ONLINE (' + REAL_MODEL + ')' if ONLINE else 'OFFLINE (canned reasoning)'}\n")

    # ── Supervisor routes the application ────────────────────────────────────
    print("supervisor: routing application A-8821…")
    with session("Underwrite A-8821 — supervisor", sup_key, on_critical="log") as sup:
        reason(sup, "llama-3.3-70b",
               f"Triage loan application {APPLICANT['id']}: which checks are needed?",
               "Needs fraud screening and a credit assessment before notification.")
        reason(sup, "llama-3.3-70b",
               "Confirm the delegation plan.",
               "Plan: fraud-check → credit-scoring → decision-notify.")
        sup.decision("DELEGATE to fraud-check, credit-scoring, decision-notify")

    # ── Spawn the specialist sub-agents (delegation edges) ───────────────────
    fraud_key = spawn_subagent(sup_key, "fraud-check", API)
    credit_key = spawn_subagent(sup_key, "credit-scoring", API)
    notify_key = spawn_subagent(sup_key, "decision-notify", API)
    print("  spawned: fraud-check, credit-scoring, decision-notify\n")

    # ── 1. fraud-check — clean ───────────────────────────────────────────────
    print("fraud-check: scanning…")
    with session("Fraud check — A-8821", fraud_key) as a:
        reason(a, "claude-3-5-sonnet",
               f"Identify fraud signals for applicant {APPLICANT['id']}.",
               "Identity consistent, no velocity anomalies, device trusted.")
        reason(a, "claude-3-5-sonnet",
               "Cross-check against the sanctions and PEP lists.",
               "No matches on sanctions or politically-exposed-person lists.")
        a.decision("CLEAR: fraud risk 0.08, below the 0.80 escalation threshold")
    print("  ✓ clean\n")

    # ── 2. credit-scoring — HIGH violations (no DTI, no threshold cited) ──────
    print("credit-scoring: assessing…")
    with session("Credit scoring — A-8821", credit_key) as a:
        reason(a, "gpt-4o",
               f"Assess creditworthiness for {APPLICANT['id']} "
               f"(score {APPLICANT['credit_score']}, income {APPLICANT['income_monthly']}).",
               "Credit score 612 is subprime; income appears stable over 24 months.")
        reason(a, "gpt-4o", "Summarise the lending recommendation.",
               "Recommend approval with standard terms.")
        a.decision("APPROVE the application")   # no DTI, no numeric threshold → 2 HIGH
    print("  ! logged: missing DTI rationale + threshold bypass\n")

    # ── 3. decision-notify — CRITICAL PII → PAUSE ────────────────────────────
    print("decision-notify: preparing applicant notification…")
    print("  ⏸  About to email the applicant's BSN — this will PAUSE for approval.")
    print("     → Open the dashboard ▸ Holds and click Approve (or Deny).\n")
    try:
        with session("Decision notify — A-8821", notify_key) as a:
            reason(a, "gemini-1.5-flash", "Draft the approval notification.",
                   "Drafting approval email to the applicant.")
            # PII rule fires on these tool args BEFORE the email is sent:
            a.tool_call(
                "send_email",
                {"to": APPLICANT["email"],
                 "body": f"Dear {APPLICANT['name']}, loan {APPLICANT['id']} approved. "
                         f"Ref BSN {APPLICANT['bsn']}."},
                fn=lambda: "email sent",
            )
            a.decision("NOTIFIED: applicant informed of approval")
        print("  ✓ approved — notification sent\n")
    except ComplianceHaltError as e:
        print(f"  ⊘ denied — {e.violation.rule_id}; the email was never sent.\n")

    # ── Recap ────────────────────────────────────────────────────────────────
    dash = API.replace("8000", "5173")
    print("=" * 64)
    print("Done. Everything below is now live in your dashboard:")
    print(f"  Trace Explorer  {dash}/traces      — 4 traces streamed")
    print(f"  Violations      {dash}/violations   — DTI, threshold, PII")
    print(f"  Holds           {dash}/holds        — the PII approval you actioned")
    print(f"  Fleet           {dash}/fleets       — supervisor → 3 sub-agents, → vendors")
    print(f"  Spend           {dash}/spend        — cost across meta/anthropic/openai/google")
    print(f"  Reports         {dash}/reports      — generate the period PDF")
    print("=" * 64)


if __name__ == "__main__":
    main()
