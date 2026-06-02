"""
llamaindex_agent.py — a LlamaIndex LLM call under glassbox audit.

LlamaIndex integration needs ZERO wiring: the adapter registers itself on the
global Settings.callback_manager, so every LLM/tool event inside an AuditSession
is captured automatically.

────────────────────────────────────────────────────────────────────────────
SETUP
    pip install llama-index-core llama-index-llms-openai-like
    set GROQ_API_KEY=gsk_...                  # or GLASSBOX_PROVIDER=ollama
    set GLASSBOX_KEY=<agent instrumentation key from dashboard ▸ Settings>
RUN
    python examples/llamaindex_agent.py
────────────────────────────────────────────────────────────────────────────
"""
import os
import sys

from llama_index.llms.openai_like import OpenAILike

from glassbox import AuditSession, rules, GuardrailPolicy


def make_llm():
    if os.environ.get("GLASSBOX_PROVIDER", "").lower() == "ollama":
        return OpenAILike(model="llama3.2", api_base="http://localhost:11434/v1",
                          api_key="ollama", is_chat_model=True)
    key = os.environ.get("GROQ_API_KEY")
    if key:
        return OpenAILike(model="llama-3.1-8b-instant", api_base="https://api.groq.com/openai/v1",
                          api_key=key, is_chat_model=True)
    sys.exit("Set GROQ_API_KEY or GLASSBOX_PROVIDER=ollama.")


def main():
    key = os.environ.get("GLASSBOX_KEY")
    if not key:
        sys.exit("Set GLASSBOX_KEY to an agent's instrumentation key.")
    api_url = os.environ.get("GLASSBOX_API_URL", "http://localhost:8000")

    llm = make_llm()
    applicant = "Applicant A-8821, income €4200/mo, debt €1100/mo, score 612, wants €25,000."

    with AuditSession(
        name="LlamaIndex assessment — A-8821",
        instrumentation_key=key,
        api_url=api_url,
        jurisdiction="EU",
        rules=[rules.PII(), rules.DTIRationale(), rules.DecisionWithoutTrace()],
        guardrails=GuardrailPolicy(on_critical="pause", on_high="log"),
    ) as audit:
        # No callbacks to pass — the adapter is registered on Settings.callback_manager
        analysis = llm.complete(f"You are an EU credit analyst. Assess: {applicant}")
        decision = llm.complete(f"Given this analysis, APPROVE or REJECT in one line:\n{analysis}")

    print("\nDECISION:", str(decision).strip()[:160])
    print(f"Steps: {len(audit.trace.steps)} · Violations: {len(audit.violations)}")
    for v in audit.violations:
        print(f"  • [{v.severity}] {v.rule_id}")
    print("\nDashboard ▸ Trace Explorer to view it.")


if __name__ == "__main__":
    main()
