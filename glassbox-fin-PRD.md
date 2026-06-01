# glassbox-fin — Product Requirements Document

> Open-source audit trails, compliance checks, and decision lineage for LLM agents operating in financial workflows.

| Field | Value |
|---|---|
| Document version | v1.0.0 |
| Status | Draft — for review |
| Author | Surya |
| Target release | v0.1.0-alpha (Week 6) |
| License | MIT — open source |
| PyPI package | glassbox-fin |
| Repository | github.com/[you]/glassbox-fin |

> **Regulatory context:** Financial institutions in the EU are legally required to maintain audit trails for high-risk AI systems under the EU AI Act (Annex III, effective 2026). Credit scoring and fraud detection agents are explicitly listed. glassbox-fin provides the open-source infrastructure that makes compliance practical.

---

## 1. Executive Summary

glassbox-fin is an open-source Python middleware library that provides audit trails, compliance checking, and decision lineage for LLM agents operating in financial workflows. It wraps any LLM agent framework — LangChain, LlamaIndex, or raw API calls — and intercepts every model invocation and tool call, producing structured audit records and human-readable compliance reports.

The project is motivated by a concrete regulatory gap: the EU AI Act (August 2024) designates credit scoring, loan assessment, and fraud detection systems as high-risk AI, mandating transparency and audit logging from 2026 onward. No open-source tooling currently addresses this requirement specifically for LLM agent pipelines.

**glassbox-fin is the missing infrastructure layer.**

### Core value proposition

| Dimension | Description |
|---|---|
| Problem | LLM agents in finance make consequential decisions with no auditable trace — violating emerging EU regulation and internal governance requirements. |
| Solution | A pip-installable Python library that intercepts agent execution, checks configurable compliance rules, and generates structured audit trails and narrative reports. |
| Target users | ML engineers and backend developers building financial LLM agents; compliance officers who consume the generated reports. |
| Distribution | PyPI (`pip install glassbox-fin`), MIT license, GitHub open source. |
| Timeline | v0.1.0-alpha in 6 weeks; v1.0.0 stable in 16 weeks. |

---

## 2. Problem Statement

### 2.1 The regulatory gap

The EU AI Act (Regulation 2024/1689), which entered into force in August 2024, defines a set of high-risk AI use cases in Annex III. Among these are:

- Credit scoring and creditworthiness assessment
- Fraud detection and prevention in financial services
- Insurance risk assessment
- Algorithmic trading systems with systemic risk potential

For all high-risk systems, Article 13 mandates that providers ensure systems are designed and developed in such a way as to ensure that their operation is sufficiently transparent. Article 17 requires a quality management system that includes, among other things, logging and traceability of decisions.

Complementary regulations reinforce this: MiFID II Article 25 requires suitability documentation for investment recommendations; GDPR Article 22 gives individuals rights regarding automated decision-making; EBA guidelines on internal model governance require audit trails for credit models.

### 2.2 The technical gap

Despite this regulatory environment, the tooling ecosystem for LLM agent observability is immature, and what exists does not address financial compliance semantics:

| Tool | Type | Financial rules | Open source | Gap |
|---|---|---|---|---|
| LangSmith | Commercial SaaS | None | No | Proprietary, generic, expensive |
| LangFuse | Open source | None | Yes | Generic logging, no rule engine |
| Arize Phoenix | Open source | None | Yes | ML observability, not compliance |
| Weights & Biases | Commercial | None | No | Experiment tracking, not agents |
| **glassbox-fin** | **Open source** | **Built-in** | **Yes** | **Purpose-built for this gap** |

### 2.3 Who is affected

The problem affects two distinct personas with different pain points:

**Persona A — The developer**
An ML engineer or backend developer building a LangChain agent that assesses loan applications or flags fraudulent transactions. Their pain: they have no visibility into what their agent actually did on any given request — which tools it called, what data it processed, whether it violated any internal rule. Debugging is slow; compliance sign-off is impossible.

**Persona B — The compliance officer**
A risk or compliance professional at a bank or fintech who needs to answer: did our AI system make this decision in compliance with regulation X? Currently they receive the agent's output (approved / rejected / flagged) but have no access to the reasoning chain. If a regulator asks, they have nothing to show.

---

## 3. Goals and Non-Goals

### 3.1 Goals

The following outcomes define success for the v1.0.0 release:

1. Provide framework-agnostic trace interception that wraps LangChain, LlamaIndex, and raw OpenAI/Anthropic API calls through a single interface without requiring changes to existing agent code.
2. Implement a pluggable financial rule engine with a Python DSL for writing compliance rules, and ship a minimum of 8 built-in rules covering the most common EU regulatory requirements.
3. Generate structured audit trail output in JSON format and human-readable compliance reports in PDF format, suitable for submission to internal compliance teams and external auditors.
4. Achieve a `pip install` experience: the library is published on PyPI, installable in one command, and usable in two additional lines of code.
5. Reach 100+ GitHub stars within 4 weeks of public launch, demonstrating developer adoption.
6. Provide complete documentation including API reference, rule-authoring guide, and at least one end-to-end demo notebook.

### 3.2 Non-goals

The following are explicitly out of scope for v1.0.0:

- Real-time streaming dashboard or web UI — reports are generated as static files.
- Support for non-LLM decision systems (e.g. traditional ML models, rule-based engines).
- Legal certification or regulatory approval — glassbox-fin is a developer tool, not a certified compliance product.
- Cloud-hosted SaaS offering — the library is self-hosted by the developer.
- Multi-tenant audit storage — each `AuditSession` is independent; aggregation across sessions is left to the user.
- Support for US financial regulations (SOX, Reg-BI) — initial focus is EU only.

---

## 4. System Architecture

### 4.1 Overview

glassbox-fin is structured as three loosely coupled layers that execute sequentially within a single Python context manager session:

| Layer | Module | Responsibility |
|---|---|---|
| 1 — Trace interceptor | `glassbox_fin.tracer` | Intercepts and records every LLM call and tool invocation during agent execution. |
| 2 — Rule engine | `glassbox_fin.rules` | Evaluates the completed trace against a configurable set of compliance rules, producing `Violation` objects. |
| 3 — Report generator | `glassbox_fin.reporter` | Serialises the trace and violations to JSON and PDF formats with a human-readable narrative. |

### 4.2 Module structure

```
glassbox-fin/
├── glassbox_fin/
│   ├── __init__.py          # Public API: AuditSession, rules namespace
│   ├── session.py           # AuditSession context manager
│   ├── tracer.py            # Framework-agnostic trace interceptor
│   ├── adapters/
│   │   ├── langchain.py     # LangChain callback handler
│   │   ├── llamaindex.py    # LlamaIndex event listener
│   │   └── openai.py        # Raw OpenAI/Anthropic SDK wrapper
│   ├── rules/
│   │   ├── __init__.py      # Rule registry + @rule decorator
│   │   ├── base.py          # Rule, Violation, Severity base classes
│   │   └── financial.py     # 8 built-in financial rules
│   ├── reporter/
│   │   ├── json_reporter.py # Audit trail JSON serialisation
│   │   └── pdf_reporter.py  # PDF report generation (ReportLab)
│   └── models.py            # AgentTrace, TraceStep, Violation dataclasses
├── tests/
│   ├── test_tracer.py
│   ├── test_rules.py
│   └── test_reporter.py
├── examples/
│   └── loan_decision_demo.ipynb
├── docs/
├── pyproject.toml
└── README.md
```

### 4.3 Core data model

All data flowing through glassbox-fin is captured in three dataclasses defined in `models.py`:

#### TraceStep

A single intercepted event in the agent's execution.

| Field | Type | Description |
|---|---|---|
| `step_id` | `str` | UUID for this step |
| `timestamp` | `datetime` | When this step occurred (UTC) |
| `step_type` | `Literal['llm_call', 'tool_call', 'decision']` | The event type |
| `model` | `Optional[str]` | Model identifier for LLM calls |
| `prompt` | `Optional[str]` | Full prompt sent to the model |
| `output` | `Optional[str]` | Model output or tool return value |
| `tool_name` | `Optional[str]` | Name of the invoked tool |
| `tool_arguments` | `Optional[dict]` | Tool call arguments |
| `token_count` | `Optional[int]` | Tokens used in this step |
| `latency_ms` | `Optional[float]` | Step execution time |
| `metadata` | `dict` | Extensible key-value metadata |

#### AgentTrace

The complete record of a single agent session.

| Field | Type | Description |
|---|---|---|
| `trace_id` | `str` | UUID for this session |
| `session_start` | `datetime` | When `AuditSession` was entered |
| `session_end` | `Optional[datetime]` | When `AuditSession` exited |
| `task_description` | `Optional[str]` | Human-provided description of the task |
| `steps` | `List[TraceStep]` | Ordered list of all intercepted steps |
| `metadata` | `dict` | Extensible session-level metadata |

#### Violation

A single rule violation detected by the rule engine.

| Field | Type | Description |
|---|---|---|
| `violation_id` | `str` | UUID |
| `rule_id` | `str` | The rule that fired (e.g. `'PII_IN_TOOL_ARGS'`) |
| `severity` | `Severity` | `CRITICAL \| HIGH \| MEDIUM \| LOW` |
| `step` | `TraceStep` | The step that triggered the violation |
| `message` | `str` | Human-readable explanation |
| `regulatory_reference` | `Optional[str]` | e.g. `'GDPR Art.5'` |
| `remediation` | `Optional[str]` | Suggested fix |

---

## 5. Feature Requirements

### 5.1 AuditSession — the primary interface

#### FR-1.1 Context manager protocol

`AuditSession` must implement `__enter__` and `__exit__`. On entry, it activates all configured adapters and begins trace collection. On exit (normal or exception), it deactivates adapters, runs the rule engine, and makes the report available on the session object.

```python
with AuditSession(
    rules=[rules.PII_IN_TOOL_ARGS, rules.MISSING_DTI_RATIONALE],
    export='audit_trail.json',
    task='Loan assessment for applicant A-8821',
) as session:
    result = agent.run('Evaluate loan application A-8821')

# After the with block:
session.trace        # AgentTrace object
session.violations   # List[Violation]
session.report       # ReportHandle with .to_pdf() and .to_json()
```

#### FR-1.2 Auto-detection of active framework

`AuditSession` must detect which LLM framework is active in the calling environment (LangChain, LlamaIndex, raw API) and activate the appropriate adapter automatically. Users may override with an explicit `adapter=` parameter.

#### FR-1.3 Rule configuration

The `rules` parameter accepts a list of rule instances or rule classes. Rules may be configured with parameters (e.g. a custom PII pattern list). If `rules` is not provided, a default set of `CRITICAL` and `HIGH` severity rules is applied.

#### FR-1.4 Export on exit

If `export` is provided as a file path, the JSON audit trail is written automatically on `AuditSession` exit. PDF export requires an explicit call to `session.report.to_pdf()`.

---

### 5.2 Trace interceptor

#### FR-2.1 LangChain adapter

Implement a `BaseCallbackHandler` subclass that intercepts `on_llm_start`, `on_llm_end`, `on_tool_start`, and `on_tool_end` callbacks. Each callback creates a `TraceStep` and appends it to the active `AgentTrace`. The handler must be injected without the user modifying their agent configuration — `AuditSession` handles injection on entry.

#### FR-2.2 LlamaIndex adapter

Implement a `BaseEventListener` subclass that intercepts `LLMStartEvent`, `LLMEndEvent`, `ToolStartEvent`, and `ToolEndEvent`. Same contract as the LangChain adapter.

#### FR-2.3 Raw API adapter

Provide a monkey-patch wrapper for the `openai` and `anthropic` Python SDK client objects. The wrapper intercepts `chat.completions.create` (OpenAI) and `messages.create` (Anthropic) calls, records the request and response as a `TraceStep`, and calls through to the original method.

#### FR-2.4 Timestamp and latency capture

Every `TraceStep` must record its `timestamp` at the moment of interception and its `latency_ms` computed as the time between the start and end of the intercepted call.

#### FR-2.5 Thread safety

The tracer must be safe for use in multi-threaded agent execution. `TraceStep` appending must use a `threading.Lock`. `AuditSession` is not designed for use across async event loops in v1.0.0; async support is deferred to v1.1.0.

---

### 5.3 Rule engine

#### FR-3.1 Rule decorator DSL

Rules are defined using a `@rule` decorator that registers the rule in the global rule registry and attaches metadata. A rule is a Python function that takes an `AgentTrace` and returns a list of `Violation` objects (or an empty list if no violation).

```python
from glassbox_fin.rules import rule, Violation, Severity

@rule(
    id='PII_IN_TOOL_ARGS',
    severity=Severity.CRITICAL,
    description='PII detected in tool call arguments',
    regulatory_reference='GDPR Art.5(1)(f)',
    remediation='Redact PII before passing to tool arguments',
)
def pii_in_tool_args(trace: AgentTrace) -> list[Violation]:
    violations = []
    for step in trace.steps:
        if step.step_type == 'tool_call' and step.tool_arguments:
            if _contains_pii(step.tool_arguments):
                violations.append(Violation.from_step(step))
    return violations
```

#### FR-3.2 Built-in rule: `PII_IN_TOOL_ARGS`

Detect personal identifiers (national ID numbers, email addresses, phone numbers, IBAN patterns) in tool call arguments using regex matching. **Severity: CRITICAL.** Reference: GDPR Art.5(1)(f).

#### FR-3.3 Built-in rule: `DECISION_WITHOUT_TRACE`

Flag any session where the agent produces a decision-type output (approval / rejection / recommendation) but fewer than 2 tool calls or LLM calls preceded it — indicating the decision lacks a traceable reasoning chain. **Severity: CRITICAL.** Reference: EU AI Act Art.13.

#### FR-3.4 Built-in rule: `MISSING_DTI_RATIONALE`

For sessions involving credit decisions, check that at least one LLM call output contains a reference to debt-to-income ratio (pattern matching on `'DTI'`, `'debt-to-income'`, `'debt to income'`). Flag if absent. **Severity: HIGH.** Reference: EBA/GL/2020/06.

#### FR-3.5 Built-in rule: `JURISDICTION_MISMATCH`

Detect when the agent reasons about regulations from a jurisdiction different from the one configured for the session (e.g. applying US SEC rules to a session configured for EU MiFID). **Severity: HIGH.** Reference: MiFID II Art.24.

#### FR-3.6 Built-in rule: `THRESHOLD_BYPASS`

Detect when the agent's decision output does not reference the specific numeric threshold used to make the decision (e.g. approving a loan without citing the credit score threshold). **Severity: HIGH.** Reference: Basel III.

#### FR-3.7 Built-in rule: `HALLUCINATION_SIGNAL`

Compare values cited in the agent's final output against values retrieved from tools in the same session. Flag numeric discrepancies above a configurable tolerance (default: any discrepancy). **Severity: MEDIUM.** Reference: Internal heuristic.

#### FR-3.8 Built-in rule: `CHAIN_FAITHFULNESS`

For sessions where the agent produces explicit chain-of-thought reasoning (detectable via `'therefore'`, `'because'`, `'since'` patterns), use an LLM-as-judge call (configurable, off by default) to verify that the conclusion follows from the stated reasoning. **Severity: MEDIUM.** Reference: Internal heuristic.

#### FR-3.9 Built-in rule: `MISSING_DISCLOSURE`

For sessions involving investment product recommendations, check that the agent's output includes required disclosure language (configurable pattern set, defaults to MiFID II cost/risk disclosure keywords). **Severity: MEDIUM.** Reference: MiFID II Art.25.

#### FR-3.10 Custom rule support

Users must be able to define and register custom rules using the `@rule` decorator and pass them to `AuditSession` alongside built-in rules. The rule-authoring guide must cover this use case with a complete example.

---

### 5.4 Report generator

#### FR-4.1 JSON audit trail

The JSON output must be a single object conforming to a published schema (documented in `docs/schema.json`). It must include: `trace_id`, session timestamps, `task_description`, full list of `TraceStep` objects, list of `Violation` objects, and a summary object with step counts and violation counts by severity.

#### FR-4.2 PDF compliance report

The PDF report is generated using ReportLab and must include: a cover section with session metadata, an executive summary of violations grouped by severity, a step-by-step trace table, a violations detail section with regulatory references and remediation guidance, and an LLM-generated narrative paragraph summarising the agent's decision path.

#### FR-4.3 Narrative generation

The narrative paragraph is generated via a single LLM API call (using the same provider as the agent session, or a configured fallback). The prompt must instruct the model to describe only what appears in the trace — no inference beyond the recorded steps. The generated text is clearly marked as AI-generated in the report.

#### FR-4.4 CLI interface

A command-line interface must allow report generation from an existing JSON audit trail file:

```bash
# Generate PDF from existing JSON trail
glassbox-fin report audit_trail.json --format pdf --output report.pdf

# Validate a JSON trail against the schema
glassbox-fin validate audit_trail.json

# List all violations in a trail
glassbox-fin violations audit_trail.json --severity critical
```

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | The tracer must add less than 5ms overhead per intercepted call. Rule engine evaluation must complete in under 500ms for traces with up to 50 steps. |
| NFR-2 | Compatibility | Supports Python 3.10, 3.11, and 3.12. LangChain >=0.1.0. LlamaIndex >=0.10.0. OpenAI SDK >=1.0.0. Anthropic SDK >=0.20.0. |
| NFR-3 | Security | The library must never log or persist prompt content to disk unless explicitly configured by the user. PII detected in tool args must be redacted in reports unless `redact=False` is set. |
| NFR-4 | Reliability | If the rule engine raises an exception for a given rule, that rule is skipped and an error is recorded in the session metadata. The rest of the session completes normally. |
| NFR-5 | Testability | Test coverage must be >= 80% across all modules. CI must run on every pull request via GitHub Actions. |
| NFR-6 | Documentation | Every public function and class must have a docstring. The `docs/` directory must include: quickstart guide, API reference, rule-authoring guide, and at least one complete example notebook. |
| NFR-7 | Packaging | The package must have zero mandatory dependencies beyond the Python standard library and ReportLab. Framework adapters (LangChain, LlamaIndex) are optional extras: `pip install glassbox-fin[langchain]`. |

---

## 7. Build Plan

The project runs over 16 weeks across five phases. Each phase has a concrete deliverable that is independently usable.

| Phase | Weeks | Name | Deliverable |
|---|---|---|---|
| 1 | 1–2 | Domain research | Rule catalogue document covering EU AI Act, MiFID II, GDPR, Basel III, and EBA guidelines. GitHub repo skeleton with `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and issue templates. |
| 2 | 3–6 | Core trace interceptor | Working tracer with LangChain and raw API adapters. `AuditSession` context manager. `TraceStep` and `AgentTrace` dataclasses. 30+ unit tests. Published to PyPI as v0.1.0-alpha. |
| 3 | 7–10 | Rule engine + built-in rules | Rule decorator DSL. All 8 built-in financial rules implemented and tested. Custom rule example in documentation. |
| 4 | 11–13 | Report generator + CLI | JSON schema and serialiser. PDF report generator. LLM narrative layer. CLI with `report` and `validate` commands. |
| 5 | 14–16 | Docs, demo, and launch | Complete documentation. Loan decision demo notebook (Colab-runnable). Launch on Hacker News, r/MachineLearning, LangChain Discord. Target: 100+ GitHub stars within 4 weeks. |

---

## 8. Integration Guide

### 8.1 Installation

```bash
# Core library (no framework adapters)
pip install glassbox-fin

# With LangChain support
pip install glassbox-fin[langchain]

# With LlamaIndex support
pip install glassbox-fin[llamaindex]

# Full install (all adapters + dev tools)
pip install glassbox-fin[all]
```

### 8.2 Quickstart — LangChain agent

```python
from langchain.agents import initialize_agent, Tool
from langchain.chat_models import ChatOpenAI
from glassbox_fin import AuditSession, rules

llm = ChatOpenAI(model='gpt-4o')
agent = initialize_agent(tools=[...], llm=llm, agent='zero-shot-react-description')

with AuditSession(
    rules=[
        rules.PII_IN_TOOL_ARGS,
        rules.MISSING_DTI_RATIONALE,
        rules.DECISION_WITHOUT_TRACE,
    ],
    task='Loan assessment — applicant A-8821',
    export='audit_trail.json',
) as session:
    result = agent.run('Assess the loan application for applicant A-8821')

# Print violation summary
for v in session.violations:
    print(f'[{v.severity}] {v.rule_id}: {v.message}')

# Export PDF report
session.report.to_pdf('compliance_report.pdf')
```

### 8.3 Quickstart — raw OpenAI API

```python
import openai
from glassbox_fin import AuditSession, rules

client = openai.OpenAI()

with AuditSession(rules=[rules.PII_IN_TOOL_ARGS]) as session:
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[{'role': 'user', 'content': 'Assess credit risk for...'}],
    )

# The AuditSession auto-detects and wraps the OpenAI client
print(session.trace.steps)   # All intercepted calls
```

### 8.4 Writing a custom rule

```python
from glassbox_fin.rules import rule, Violation, Severity
from glassbox_fin.models import AgentTrace

@rule(
    id='NO_HUMAN_REVIEW_FLAG',
    severity=Severity.HIGH,
    description='High-value decision made without human review flag',
    regulatory_reference='Internal policy INV-2024-003',
    remediation='Add a human_review_required field to decision output',
)
def no_human_review_flag(trace: AgentTrace) -> list[Violation]:
    violations = []
    for step in trace.steps:
        if step.step_type == 'decision':
            output = step.output or ''
            if 'human_review_required' not in output:
                violations.append(Violation.from_step(step))
    return violations

# Use alongside built-in rules
with AuditSession(rules=[rules.PII_IN_TOOL_ARGS, no_human_review_flag]) as s:
    ...
```

---

## 9. Built-In Rules Reference

| Rule ID | Severity | Description | Trigger condition | Regulatory ref |
|---|---|---|---|---|
| `PII_IN_TOOL_ARGS` | CRITICAL | Personal identifiers found in tool call arguments | Regex match on NL-BSN, IBAN, email, phone patterns in `tool_arguments` dict | GDPR Art.5(1)(f) |
| `DECISION_WITHOUT_TRACE` | CRITICAL | Decision produced with no traceable reasoning chain | Decision-type output with fewer than 2 preceding LLM/tool calls | EU AI Act Art.13 |
| `MISSING_DTI_RATIONALE` | HIGH | Credit decision does not cite debt-to-income ratio | Credit-related session where no step output references DTI | EBA/GL/2020/06 |
| `JURISDICTION_MISMATCH` | HIGH | Agent applies wrong jurisdictional regulation | Session jurisdiction != regulation jurisdiction detected in output | MiFID II Art.24 |
| `THRESHOLD_BYPASS` | HIGH | Decision made without citing numeric threshold | Decision output lacks reference to the threshold value used | Basel III |
| `HALLUCINATION_SIGNAL` | MEDIUM | Output value inconsistent with retrieved tool data | Numeric value in final output differs from tool-retrieved value | Internal heuristic |
| `CHAIN_FAITHFULNESS` | MEDIUM | Conclusion does not follow from stated reasoning | LLM-as-judge flags reasoning-conclusion gap (optional, configurable) | Internal heuristic |
| `MISSING_DISCLOSURE` | MEDIUM | Investment recommendation lacks required disclosure | Output lacks MiFID II cost/risk disclosure keywords | MiFID II Art.25 |

---

## 10. Success Metrics

| Metric | Target | Measurement method |
|---|---|---|
| GitHub stars | 100+ within 4 weeks of launch | GitHub repository stars count |
| PyPI downloads | 500+ within 8 weeks of launch | PyPI download statistics |
| Test coverage | >= 80% across all modules | Coverage.py in CI pipeline |
| Tracer overhead | < 5ms per intercepted call | Benchmark suite in `tests/perf/` |
| Rule engine latency | < 500ms for 50-step trace | Benchmark suite in `tests/perf/` |
| Documentation completeness | All public APIs documented | pydocstyle CI check |
| Demo notebook | Runnable end-to-end in Colab | Manual verification before launch |
| Community rules | 2+ external rule contributions within 2 months | GitHub pull requests |

---

## 11. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LangChain API changes break adapter | Medium | High | Pin supported LangChain version range. CI tests against multiple versions. Subscribe to LangChain changelog. |
| Rule false positives reduce trust | Medium | High | Ship conservative defaults. Provide per-rule confidence scores. Allow per-rule suppression with justification comment. |
| PDF generation is heavyweight for small use cases | Low | Medium | PDF is opt-in. JSON trail is always generated. Offer markdown report as lighter alternative in v1.1.0. |
| LLM-as-judge adds API cost for `CHAIN_FAITHFULNESS` rule | High | Low | This rule is off by default. Document clearly. Users opt in explicitly. |
| Existing tools (LangSmith) release open-source competitor | Low | High | Financial-specific rule engine and EU regulatory focus are defensible differentiation. Open source is a moat. |
| Async agent support needed sooner than v1.1.0 | Medium | Medium | Monitor GitHub issues for demand. Can fast-track async tracer if adoption warrants it. |

---

## 12. Future Roadmap

### v1.1.0 — Async + extended framework support

- Async-safe tracer for agents using `asyncio`
- Async LangChain and LlamaIndex adapter variants
- Markdown report format as lightweight alternative to PDF
- Rule severity override configuration at session level

### v1.2.0 — Expanded regulation coverage

- US regulatory rules: SOX, Reg-BI, Fair Credit Reporting Act
- UK FCA regulation rule set
- Configurable jurisdiction profiles (EU, US, UK) as named presets
- Community rule registry — curated external rule packages

### v2.0.0 — Aggregation and analytics

- Cross-session aggregation: analyse violation trends across many traces
- SQLite-backed local trace store for small teams
- Simple web dashboard (read-only, self-hosted)
- REST API for integration with existing compliance platforms
