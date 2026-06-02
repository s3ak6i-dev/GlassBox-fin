"""
multi_agent.py — a supervisor orchestrating two specialist sub-agents.

This is the multi-agent topology demo. A supervisor (your registered agent)
spawns two child agents — fraud-check and credit-scoring — runs each as its own
audited session, and the Fleet graph draws real agent → sub-agent delegation
edges plus each child's edges to the LLM vendors it calls.

Framework-agnostic: this plain-Python orchestration is what CrewAI / LangGraph
supervisors do under the hood. Swap the bodies for your real sub-agents.

────────────────────────────────────────────────────────────────────────────
SETUP
    pip install openai
    set GROQ_API_KEY=gsk_...                  # or GLASSBOX_PROVIDER=ollama
    set GLASSBOX_KEY=<supervisor agent key from dashboard ▸ Settings>
RUN
    python examples/multi_agent.py
    → open the dashboard ▸ Fleet to watch the topology assemble.
────────────────────────────────────────────────────────────────────────────
"""
import os
import sys

from openai import OpenAI

from glassbox import AuditSession, rules, GuardrailPolicy
from glassbox.platform import spawn_subagent

API_URL = os.environ.get("GLASSBOX_API_URL", "http://localhost:8000")


def make_client():
    if os.environ.get("GLASSBOX_PROVIDER", "").lower() == "ollama":
        return OpenAI(base_url="http://localhost:11434/v1", api_key="ollama"), "llama3.2"
    key = os.environ.get("GROQ_API_KEY")
    if key:
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=key), "llama-3.1-8b-instant"
    sys.exit("Set GROQ_API_KEY or GLASSBOX_PROVIDER=ollama.")


def run_subagent(name, key, model, client, system, user):
    """Run one specialist sub-agent as its own audited session."""
    with AuditSession(
        name=name, instrumentation_key=key, api_url=API_URL, jurisdiction="EU",
        rules=[rules.PII(), rules.DTIRationale(), rules.DecisionWithoutTrace()],
        guardrails=GuardrailPolicy(on_critical="pause", on_high="log"),
    ) as audit:
        out = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        ).choices[0].message.content
        # a second reasoning step so the chain is traceable
        client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": f"Summarise your finding in one line: {out}"}],
        )
    print(f"  ✓ {name}: {len(audit.trace.steps)} steps, {len(audit.violations)} violations")
    return out


def main():
    supervisor_key = os.environ.get("GLASSBOX_KEY")
    if not supervisor_key:
        sys.exit("Set GLASSBOX_KEY to your supervisor agent's instrumentation key.")
    client, model = make_client()

    print("Supervisor spawning specialist sub-agents…")
    fraud_key = spawn_subagent(supervisor_key, "fraud-check", API_URL)
    credit_key = spawn_subagent(supervisor_key, "credit-scoring", API_URL)
    print("  registered: fraud-check, credit-scoring\n")

    applicant = "Applicant A-8821, income €4200/mo, debt €1100/mo, score 612, wants €25,000"

    print("Delegating…")
    run_subagent("Fraud check — A-8821", fraud_key, model, client,
                 "You are a fraud-detection specialist for EU retail credit.",
                 f"Flag any fraud signals for: {applicant}")
    run_subagent("Credit scoring — A-8821", credit_key, model, client,
                 "You are a credit-risk specialist. Always cite debt-to-income ratio.",
                 f"Score the creditworthiness of: {applicant}")

    print(f"\nDone. Open {API_URL.replace('8000','5173')} ▸ Fleet — the supervisor now")
    print("delegates to fraud-check and credit-scoring (dashed arrows), each wired")
    print("to the vendor it called.")


if __name__ == "__main__":
    main()
