"""
free_agent.py — a free, runnable loan-assessment agent wired to glassbox-fin.

It calls a free, OpenAI-compatible LLM (Groq or a local Ollama model), wraps the
whole run in an AuditSession, and streams the trace + any violations to your
glassbox dashboard in real time.

────────────────────────────────────────────────────────────────────────────
SETUP (pick ONE free provider)

  Option A · Groq  (free cloud, fastest)
    1. Get a free key at https://console.groq.com/keys
    2. set GROQ_API_KEY=gsk_...        (PowerShell: $env:GROQ_API_KEY="gsk_...")

  Option B · Ollama  (free, fully local — no key, no data leaves your machine)
    1. Install from https://ollama.com  then:  ollama pull llama3.2
    2. set GLASSBOX_PROVIDER=ollama

THEN, from your glassbox dashboard:
    Settings ▸ API Keys  (or the onboarding wizard) → copy an agent's
    instrumentation key, and:
        set GLASSBOX_KEY=<that-key>

Run it:
    pip install openai
    python examples/free_agent.py
────────────────────────────────────────────────────────────────────────────
"""
import os
import sys

from openai import OpenAI

from glassbox import AuditSession, rules, GuardrailPolicy


# ── provider selection ────────────────────────────────────────────────────────

def make_client():
    provider = os.environ.get("GLASSBOX_PROVIDER", "").lower()
    groq_key = os.environ.get("GROQ_API_KEY")

    if provider == "ollama":
        return OpenAI(base_url="http://localhost:11434/v1", api_key="ollama"), "llama3.2"
    if groq_key:
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_key), "llama-3.1-8b-instant"

    sys.exit(
        "No free LLM configured.\n"
        "  • Groq:   set GROQ_API_KEY (free key at https://console.groq.com/keys), or\n"
        "  • Ollama: install https://ollama.com, run `ollama pull llama3.2`, "
        "then set GLASSBOX_PROVIDER=ollama"
    )


def main():
    key = os.environ.get("GLASSBOX_KEY")
    if not key:
        sys.exit("Set GLASSBOX_KEY to an agent's instrumentation key "
                 "(dashboard ▸ Settings ▸ API Keys).")

    api_url = os.environ.get("GLASSBOX_API_URL", "http://localhost:8000")
    client, model = make_client()

    applicant = {
        "id": "A-8821",
        "name": "M. de Vries",
        "income_monthly": 4200,
        "existing_debt_monthly": 1100,
        "requested_amount": 25000,
        "credit_score": 612,
    }

    # The whole run is audited. Critical violations would pause for approval in
    # your Hold Inbox; everything else is logged to the trace.
    with AuditSession(
        name=f"Loan assessment — applicant {applicant['id']}",
        instrumentation_key=key,
        api_url=api_url,
        jurisdiction="EU",
        rules=[
            rules.PII(),
            rules.DTIRationale(),
            rules.DecisionWithoutTrace(),
            rules.ThresholdBypass(),
            rules.Jurisdiction("EU"),
        ],
        guardrails=GuardrailPolicy(on_critical="pause", on_high="log"),
    ) as audit:

        # Step 1 — gather the risk picture
        analysis = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a concise EU retail-credit risk analyst."},
                {"role": "user", "content":
                    f"Summarise the credit risk for this applicant in 3 short bullet points: {applicant}"},
            ],
        ).choices[0].message.content

        # Step 2 — make the call
        decision = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an EU retail-credit underwriter. "
                    "Reply with APPROVE or REJECT and one sentence of justification."},
                {"role": "user", "content": f"Risk summary:\n{analysis}\n\nDecide."},
            ],
        ).choices[0].message.content

    # ── results ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 64)
    print("DECISION:", decision.strip())
    print("=" * 64)
    print(f"\nTrace streamed to {api_url}")
    print(f"Steps recorded : {len(audit.trace.steps)}")
    print(f"Violations     : {len(audit.violations)}")
    for v in audit.violations:
        print(f"  • [{v.severity}] {v.rule_id} — {v.message}")
    print("\nOpen your dashboard ▸ Trace Explorer to see it live.")


if __name__ == "__main__":
    main()
