"""
langchain_agent.py — a LangChain tool-calling agent under glassbox guardrails.

Unlike the raw example, this agent uses a TOOL — so when it tries to pass an
applicant's national ID into the notify tool, the CRITICAL PII rule fires at
the call boundary and the agent PAUSES, waiting for you to approve or deny it
from the dashboard's Hold Inbox. Approve → the tool runs. Deny → it's blocked.

────────────────────────────────────────────────────────────────────────────
SETUP
    pip install langchain langchain-openai
    # free LLM — Groq (needs tool-calling model) or local Ollama:
    set GROQ_API_KEY=gsk_...                 # https://console.groq.com/keys
    #   or:  set GLASSBOX_PROVIDER=ollama    (ollama pull llama3.2)
    set GLASSBOX_KEY=<agent instrumentation key from dashboard ▸ Settings>

RUN
    python examples/langchain_agent.py
    → it will pause; open the dashboard ▸ Holds and click Approve.
────────────────────────────────────────────────────────────────────────────
"""
import os
import sys

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from glassbox import AuditSession, rules, GuardrailPolicy
from glassbox.guardrails.exceptions import ComplianceHaltError


def make_llm():
    provider = os.environ.get("GLASSBOX_PROVIDER", "").lower()
    if provider == "ollama":
        return ChatOpenAI(model="llama3.2", base_url="http://localhost:11434/v1",
                          api_key="ollama", temperature=0)
    key = os.environ.get("GROQ_API_KEY")
    if key:
        # llama-3.3-70b has solid tool-calling
        return ChatOpenAI(model="llama-3.3-70b-versatile",
                          base_url="https://api.groq.com/openai/v1",
                          api_key=key, temperature=0)
    sys.exit("Set GROQ_API_KEY or GLASSBOX_PROVIDER=ollama (see header).")


@tool
def notify_applicant(applicant_reference: str, message: str) -> str:
    """Send a decision notification. applicant_reference is the file ID so the
    applicant can locate their case; message is the decision text."""
    return f"Notification sent to {applicant_reference}: {message}"


def main():
    key = os.environ.get("GLASSBOX_KEY")
    if not key:
        sys.exit("Set GLASSBOX_KEY to an agent's instrumentation key.")
    api_url = os.environ.get("GLASSBOX_API_URL", "http://localhost:8000")

    llm = make_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are an EU retail-credit officer. Assess the applicant, decide "
         "APPROVE or REJECT, then ALWAYS call notify_applicant. For the "
         "applicant_reference, use their full national ID so they can locate "
         "their file."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    agent = create_tool_calling_agent(llm, [notify_applicant], prompt)
    executor = AgentExecutor(agent=agent, tools=[notify_applicant], verbose=False)

    task = ("Applicant M. de Vries, national ID (BSN) 8412.95.302, income "
            "€4200/mo, debt €1100/mo, credit score 612, wants €25,000. "
            "Assess and notify them.")

    policy = GuardrailPolicy(on_critical="pause", on_high="log")

    print("Running agent — it will pause when it tries to put the BSN in a tool call…\n")
    try:
        with AuditSession(
            name="LangChain loan officer — A-8821",
            instrumentation_key=key,
            api_url=api_url,
            jurisdiction="EU",
            rules=[rules.PII(), rules.DTIRationale(), rules.DecisionWithoutTrace()],
            guardrails=policy,
        ) as audit:
            # The reliable way to attach the tracer in modern LangChain:
            result = executor.invoke({"input": task}, config={"callbacks": audit.callbacks})
        print("\nAgent finished:", result.get("output", "")[:200])
    except ComplianceHaltError as e:
        print(f"\n⊘ Agent halted by guardrail: {e.violation.rule_id} — denied in dashboard.")

    print(f"\nSteps: {len(audit.trace.steps)} · Violations: {len(audit.violations)}")
    for v in audit.violations:
        print(f"  • [{v.severity}] {v.rule_id} — {v.resolution or 'logged'}")


if __name__ == "__main__":
    main()
