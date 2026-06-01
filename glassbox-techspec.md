# glassbox — Technical Specification

> Version 1.0 · Status: Draft · Author: Surya

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Package & Module Structure](#3-package--module-structure)
4. [Core Data Models](#4-core-data-models)
5. [Public API](#5-public-api)
6. [Module Specifications](#6-module-specifications)
   - 6.1 [session.py — AuditSession](#61-sessionpy--auditsession)
   - 6.2 [tracer.py — Trace Interceptor](#62-tracerpy--trace-interceptor)
   - 6.3 [adapters/ — Framework Adapters](#63-adapters--framework-adapters)
   - 6.4 [rules/ — Rule Engine](#64-rules--rule-engine)
   - 6.5 [guardrails/ — Real-Time Enforcement](#65-guardrails--real-time-enforcement)
   - 6.6 [reporter/ — Output Generation](#66-reporter--output-generation)
   - 6.7 [cli.py — Command-Line Interface](#67-clipy--command-line-interface)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Build Plan](#8-build-plan)
9. [Integration Examples](#9-integration-examples)

---

## 1. Project Overview

**glassbox** is an open-source Python middleware library that provides real-time compliance guardrails, audit trails, and decision lineage for LLM agents operating in financial workflows.

It wraps any LLM agent framework — LangChain, LlamaIndex, or raw API calls — and intercepts every model invocation and tool call. At each interception point it evaluates configurable compliance rules, optionally pauses execution for human approval, and produces structured audit records and reports.

### Positioning

| | glassbox | LangSmith | LangFuse |
|---|---|---|---|
| Open source | Yes | No | Yes |
| Financial rules | Built-in | None | None |
| Real-time guardrails | Yes | No | No |
| EU AI Act coverage | Yes | No | No |
| Self-hosted | Yes | No | Yes |

### Package identity

| Property | Value |
|---|---|
| PyPI distribution name | `glassbox-fin` |
| Python import name | `glassbox` |
| License | Apache 2.0 |
| Python support | 3.10, 3.11, 3.12 |
| Installation | `pip install glassbox-fin` |

---

## 2. Architecture Overview

glassbox executes across three sequential layers inside a single Python context manager:

```
┌─────────────────────────────────────────────────────────────┐
│  AuditSession  (context manager — user-facing entry point)  │
├──────────────────────┬──────────────────────────────────────┤
│  Layer 1             │  Layer 2             │  Layer 3      │
│  TRACE               │  GUARDRAILS          │  REPORT       │
│  Intercept every     │  Evaluate rules at   │  Serialise    │
│  LLM + tool call     │  call boundaries,    │  trace +      │
│  in real time        │  pause/block/log     │  violations   │
│                      │  on violation        │  → JSON, PDF  │
└──────────────────────┴──────────────────────────────────────┘
         ↑ adapters plug in here
    LangChain · LlamaIndex · OpenAI · Anthropic
```

### Execution flow

```
with AuditSession(...) as audit:          # __enter__: activate adapters
    agent.run(task)                        # agent runs normally
    #   ↳ on_tool_start fires
    #       → TraceStep created (partial)
    #       → PRE_CALL rules evaluated
    #       → if CRITICAL + policy='pause' → approver() called, blocks thread
    #       → approved → continue / rejected → ComplianceHaltError
    #   ↳ tool executes
    #   ↳ on_tool_end fires
    #       → TraceStep completed
    #       → POST_CALL rules evaluated
    #   ↳ on_llm_end fires
    #       → POST_CALL rules evaluated
                                           # __exit__: POST_SESSION rules
audit.to_json("trace.json")               # write JSON audit trail
audit.report("compliance.pdf")            # write PDF compliance report
```

---

## 3. Package & Module Structure

```
glassbox-fin/
├── glassbox/
│   ├── __init__.py              # public surface: AuditSession, rules, GuardrailPolicy
│   ├── session.py               # AuditSession context manager
│   ├── tracer.py                # TraceCollector, framework-agnostic core
│   ├── models.py                # AgentTrace, TraceStep, Violation, GuardrailEvent
│   ├── adapters/
│   │   ├── __init__.py          # auto-detect active framework
│   │   ├── langchain.py         # BaseCallbackHandler subclass
│   │   ├── llamaindex.py        # BaseEventListener subclass
│   │   ├── openai.py            # openai SDK monkey-patch
│   │   └── anthropic.py         # anthropic SDK monkey-patch
│   ├── rules/
│   │   ├── __init__.py          # rule registry, @rule decorator, Severity, Trigger
│   │   ├── base.py              # Rule, Violation, Severity, Trigger base classes
│   │   └── financial.py         # 8 built-in financial rule implementations
│   ├── guardrails/
│   │   ├── __init__.py
│   │   ├── engine.py            # GuardrailEngine — evaluates rules in real time
│   │   ├── policy.py            # GuardrailPolicy — action config per severity
│   │   └── exceptions.py        # ComplianceHaltError, ComplianceWarning
│   ├── reporter/
│   │   ├── __init__.py          # ReportHandle
│   │   ├── json_reporter.py     # JSON serialisation + schema validation
│   │   └── pdf_reporter.py      # PDF generation via ReportLab
│   └── cli.py                   # glassbox-fin CLI entry point
│
├── tests/
│   ├── unit/
│   │   ├── test_models.py
│   │   ├── test_rules.py
│   │   ├── test_guardrails.py
│   │   └── test_reporter.py
│   ├── integration/
│   │   ├── test_langchain_adapter.py
│   │   ├── test_llamaindex_adapter.py
│   │   └── test_raw_api_adapter.py
│   └── perf/
│       └── bench_tracer_overhead.py
│
├── examples/
│   └── loan_decision_demo.ipynb
├── docs/
│   ├── quickstart.md
│   ├── api-reference.md
│   ├── rule-authoring.md
│   └── schema.json
├── pyproject.toml
└── README.md
```

---

## 4. Core Data Models

All defined in `glassbox/models.py`. Every field that can be absent at interception time is `Optional`.

---

### 4.1 `TraceStep`

A single intercepted event. Created at interception entry (partial) and completed at interception exit.

```python
@dataclass
class TraceStep:
    step_id:          str                                          # uuid4
    timestamp:        datetime                                     # UTC, at interception entry
    step_type:        Literal['llm_call', 'tool_call', 'decision']
    model:            Optional[str]   = None                       # e.g. 'gpt-4o'
    prompt:           Optional[str]   = None                       # full prompt text
    output:           Optional[str]   = None                       # absent until POST_CALL
    tool_name:        Optional[str]   = None
    tool_arguments:   Optional[dict]  = None
    token_count:      Optional[int]   = None
    latency_ms:       Optional[float] = None                       # filled at POST_CALL
    metadata:         dict            = field(default_factory=dict)
    step_hash:        Optional[str]   = None                       # SHA-256 of canonical fields
    prev_hash:        Optional[str]   = None                       # hash of preceding step
```

`step_hash` and `prev_hash` together form the integrity chain — each step is linked to the previous, making the trail tamper-evident. See §6.2 for the hashing contract.

---

### 4.2 `AgentTrace`

The complete record of one `AuditSession`.

```python
@dataclass
class AgentTrace:
    trace_id:         str
    session_start:    datetime
    session_end:      Optional[datetime]    = None
    task_description: Optional[str]         = None
    jurisdiction:     Optional[str]         = None           # e.g. 'EU', 'UK'
    steps:            List[TraceStep]       = field(default_factory=list)
    metadata:         dict                  = field(default_factory=dict)
    halted:           bool                  = False
    halt_reason:      Optional[str]         = None
```

---

### 4.3 `Violation`

One rule violation, detected either at guardrail time (pre/post call) or post-session.

```python
@dataclass
class Violation:
    violation_id:        str
    rule_id:             str
    severity:            Severity
    step:                TraceStep
    message:             str
    regulatory_reference: Optional[str]  = None   # e.g. 'GDPR Art.9'
    remediation:         Optional[str]   = None

    # Guardrail resolution fields — populated when violation caught in real time
    detected_at:         str             = 'post_session'   # 'pre_call'|'post_call'|'post_session'
    resolution:          Optional[str]   = None             # 'approved'|'rejected'|'auto_halted'|'logged'
    approver_id:         Optional[str]   = None
    approval_timestamp:  Optional[datetime] = None
    approval_latency_ms: Optional[float]   = None

    @classmethod
    def from_step(cls, step: TraceStep, rule: 'Rule') -> 'Violation':
        return cls(
            violation_id=str(uuid4()),
            rule_id=rule.id,
            severity=rule.severity,
            step=step,
            message=rule.description,
            regulatory_reference=rule.regulatory_reference,
            remediation=rule.remediation,
        )
```

---

### 4.4 `Severity` and `Trigger`

```python
class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"

class Trigger(str, Enum):
    PRE_CALL     = "pre_call"      # fires before a tool executes or before LLM call is sent
    POST_CALL    = "post_call"     # fires after a tool returns or after LLM responds
    PRE_DECISION = "pre_decision"  # fires before the agent's final output is returned
    POST_SESSION = "post_session"  # fires after the session ends (original post-hoc behaviour)
```

---

## 5. Public API

The entire user-facing surface exported from `glassbox/__init__.py`.

---

### 5.1 `AuditSession`

```python
class AuditSession:
    def __init__(
        self,
        name:        Optional[str]          = None,
        rules:       List[Rule]             = DEFAULT_RULES,
        jurisdiction: Optional[str]         = None,      # 'EU' | 'UK' | 'US'
        guardrails:  Optional[GuardrailPolicy] = None,   # None = post-hoc only
        adapter:     Optional[BaseAdapter]  = None,      # None = auto-detect
        export:      Optional[str]          = None,      # auto-write JSON on exit
        redact_pii:  bool                   = True,      # redact PII from stored prompts
        metadata:    dict                   = {},
    ): ...

    def __enter__(self) -> 'AuditSession': ...
    def __exit__(self, exc_type, exc_val, exc_tb) -> bool: ...

    # Available after __exit__
    @property
    def trace(self) -> AgentTrace: ...
    @property
    def violations(self) -> List[Violation]: ...

    def to_json(self, path: str) -> None: ...
    def report(self, path: str, *, narrative: bool = True) -> None: ...
```

#### Parameter contract

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `name` | `str` | `None` | Human label for this session, stored in trace |
| `rules` | `List[Rule]` | `DEFAULT_RULES` | Default = all CRITICAL + HIGH built-in rules |
| `jurisdiction` | `str` | `None` | Passed to jurisdiction-aware rules |
| `guardrails` | `GuardrailPolicy` | `None` | `None` = rules fire post-session only |
| `adapter` | `BaseAdapter` | `None` | Auto-detected if not provided |
| `export` | `str` | `None` | If set, `to_json(export)` is called on exit |
| `redact_pii` | `bool` | `True` | Replaces detected PII in stored prompts with `[REDACTED]` |

#### Exit behaviour

On `__exit__`:
1. Deactivates all adapters
2. Runs all `POST_SESSION` rules against the complete trace
3. If `export` is set, writes JSON to that path
4. If the session was halted by `ComplianceHaltError`, marks `trace.halted = True`, writes the trail, then re-raises so the caller is aware the agent did not complete

---

### 5.2 Rules API

Rules are importable from `glassbox.rules` and instantiated as classes (enabling per-instance config):

```python
from glassbox import AuditSession, rules

AuditSession(
    rules=[
        rules.PII(),
        rules.DTIRationale(),
        rules.Jurisdiction("EU"),
        rules.ThresholdBypass(tolerance=0.0),
        rules.DecisionWithoutTrace(min_steps=2),
    ]
)
```

All built-in rule classes inherit from `Rule` and accept keyword config in `__init__`. Each exposes:

```python
class Rule:
    id:                   str
    severity:             Severity
    trigger:              Trigger
    description:          str
    regulatory_reference: Optional[str]
    remediation:          Optional[str]

    def evaluate(self, step: TraceStep, trace: AgentTrace) -> List[Violation]: ...
```

---

### 5.3 `GuardrailPolicy`

```python
@dataclass
class GuardrailPolicy:
    on_critical: Literal['pause', 'raise', 'log'] = 'pause'
    on_high:     Literal['pause', 'raise', 'log'] = 'log'
    on_medium:   Literal['pause', 'raise', 'log'] = 'log'
    on_low:      Literal['log']                   = 'log'
    approver:    Optional[Callable[[Violation], bool]] = None

    def action_for(self, severity: Severity) -> str:
        return getattr(self, f'on_{severity.value.lower()}')
```

#### Action semantics

| Action | Behaviour |
|---|---|
| `'pause'` | Calls `approver(violation)` synchronously. Blocks the execution thread. Returns `True` → continue, `False` → raise `ComplianceHaltError`. Requires `approver` to be set. |
| `'raise'` | Immediately raises `ComplianceHaltError` without calling `approver`. |
| `'log'` | Records the violation in the trace, issues a `ComplianceWarning`, continues execution. |

---

## 6. Module Specifications

---

### 6.1 `session.py` — AuditSession

**Responsibilities:** Owns the session lifecycle. Wires together the adapter, tracer, guardrail engine, and reporter.

**Key implementation details:**

- `__enter__` calls `AdapterRegistry.detect_and_activate(self._tracer)`, which inspects `sys.modules` to determine which framework is loaded and activates the matching adapter.
- Stores the active `AgentTrace` on a thread-local so nested sessions (future feature) are isolated.
- `__exit__` catches `ComplianceHaltError` internally, marks `trace.halted`, finalises the trace, then re-raises.
- `to_json` delegates to `JsonReporter`.
- `report` delegates to `PdfReporter`. Generates a narrative via LLM call if `narrative=True` and an API key is available; falls back to a template string if not.

---

### 6.2 `tracer.py` — Trace Interceptor

**Responsibilities:** Maintains the active `AgentTrace`. Creates and completes `TraceStep` objects. Computes the integrity hash chain. Provides the `_check_guardrails` hook called by all adapters.

```python
class TraceCollector:
    def __init__(self, trace: AgentTrace, engine: Optional[GuardrailEngine]):
        self._trace  = trace
        self._engine = engine
        self._lock   = threading.Lock()

    def begin_step(self, step_type, **kwargs) -> TraceStep:
        step = TraceStep(step_id=str(uuid4()), timestamp=datetime.utcnow(),
                         step_type=step_type, **kwargs)
        if self._engine:
            self._engine.evaluate(step, self._trace, Trigger.PRE_CALL)
        return step

    def complete_step(self, step: TraceStep, output: str, latency_ms: float) -> None:
        step.output     = output
        step.latency_ms = latency_ms
        step.step_hash  = self._hash(step)
        step.prev_hash  = self._trace.steps[-1].step_hash if self._trace.steps else None
        with self._lock:
            self._trace.steps.append(step)
        if self._engine:
            self._engine.evaluate(step, self._trace, Trigger.POST_CALL)

    @staticmethod
    def _hash(step: TraceStep) -> str:
        canonical = f"{step.step_id}|{step.timestamp}|{step.step_type}|{step.output}"
        return hashlib.sha256(canonical.encode()).hexdigest()
```

**Thread safety:** `complete_step` holds `self._lock` only while appending to `steps`. Rule evaluation happens outside the lock to avoid deadlocks if an approver blocks.

---

### 6.3 `adapters/` — Framework Adapters

Each adapter translates framework-specific callback events into `TraceCollector.begin_step` / `complete_step` calls.

#### Auto-detection (`adapters/__init__.py`)

```python
FRAMEWORK_CHECKS = [
    ("langchain",   "langchain",   LangChainAdapter),
    ("llamaindex",  "llama_index", LlamaIndexAdapter),
    ("openai",      "openai",      OpenAIAdapter),
    ("anthropic",   "anthropic",   AnthropicAdapter),
]

def detect_and_activate(collector: TraceCollector) -> List[BaseAdapter]:
    active = []
    for name, module, cls in FRAMEWORK_CHECKS:
        if module in sys.modules:
            adapter = cls(collector)
            adapter.activate()
            active.append(adapter)
    return active
```

Multiple adapters can be active simultaneously (e.g. a LangChain agent that also makes raw OpenAI calls).

---

#### `adapters/langchain.py`

Implements `langchain.callbacks.BaseCallbackHandler`.

| Callback | Action |
|---|---|
| `on_llm_start` | `collector.begin_step('llm_call', model=..., prompt=...)` |
| `on_llm_end` | `collector.complete_step(step, output=..., latency_ms=...)` |
| `on_tool_start` | `collector.begin_step('tool_call', tool_name=..., tool_arguments=...)` |
| `on_tool_end` | `collector.complete_step(step, output=..., latency_ms=...)` |

Injection: `activate()` inserts the handler into `langchain.callbacks.manager._callback_manager` at the global level so the user does not need to modify their agent. `deactivate()` removes it.

---

#### `adapters/llamaindex.py`

Implements `llama_index.core.callbacks.BaseEventHandler`.

| Event | Action |
|---|---|
| `LLMStartEvent` | `begin_step('llm_call', ...)` |
| `LLMEndEvent` | `complete_step(...)` |
| `ToolStartEvent` | `begin_step('tool_call', ...)` |
| `ToolEndEvent` | `complete_step(...)` |

---

#### `adapters/openai.py` and `adapters/anthropic.py`

Monkey-patch the SDK client. Both follow the same pattern:

```python
class OpenAIAdapter(BaseAdapter):
    def activate(self):
        import openai
        self._orig = openai.chat.completions.create
        openai.chat.completions.create = self._wrapped

    def _wrapped(self, *args, **kwargs):
        step = self._collector.begin_step('llm_call',
            model=kwargs.get('model'),
            prompt=str(kwargs.get('messages', '')))
        t0 = time.perf_counter()
        result = self._orig(*args, **kwargs)
        self._collector.complete_step(step,
            output=result.choices[0].message.content,
            latency_ms=(time.perf_counter() - t0) * 1000)
        return result

    def deactivate(self):
        import openai
        openai.chat.completions.create = self._orig
```

---

### 6.4 `rules/` — Rule Engine

#### `@rule` decorator (`rules/__init__.py`)

Replaced by class inheritance in the public API, but the decorator is kept for advanced/custom rule authors who prefer a functional style:

```python
def rule(
    id: str,
    severity: Severity,
    trigger: Trigger = Trigger.POST_SESSION,
    description: str = '',
    regulatory_reference: Optional[str] = None,
    remediation: Optional[str] = None,
):
    def decorator(fn: Callable) -> Rule:
        class _Rule(Rule):
            pass
        _Rule.id                   = id
        _Rule.severity             = severity
        _Rule.trigger              = trigger
        _Rule.description          = description
        _Rule.regulatory_reference = regulatory_reference
        _Rule.remediation          = remediation
        _Rule.evaluate             = staticmethod(fn)
        RULE_REGISTRY[id]          = _Rule
        return _Rule()
    return decorator
```

---

#### Built-in rules (`rules/financial.py`)

Eight rules shipped with the library. Each is a class with an `__init__` accepting config kwargs and an `evaluate(step, trace)` method.

| Class | Rule ID | Trigger | Severity | Description | Regulation |
|---|---|---|---|---|---|
| `rules.PII()` | `PII_IN_TOOL_ARGS` | `PRE_CALL` | CRITICAL | Personal identifiers (IBAN, BSN, email, phone) detected in tool arguments before the tool executes | GDPR Art.9, EU AI Act Art.10 |
| `rules.DecisionWithoutTrace()` | `DECISION_WITHOUT_TRACE` | `PRE_DECISION` | CRITICAL | Decision-type output with fewer than `min_steps` (default: 2) preceding calls — no traceable reasoning chain | EU AI Act Art.13 |
| `rules.DTIRationale()` | `MISSING_DTI_RATIONALE` | `POST_CALL` | HIGH | Credit-related session where no LLM output references DTI / debt-to-income | EBA GL/2020/06 |
| `rules.Jurisdiction(code)` | `JURISDICTION_MISMATCH` | `POST_CALL` | HIGH | Agent output references regulations from a jurisdiction other than `code` | MiFID II Art.24 |
| `rules.ThresholdBypass()` | `THRESHOLD_BYPASS` | `POST_CALL` | HIGH | Decision output lacks citation of the numeric threshold used | Basel III |
| `rules.UnverifiedDataSource()` | `UNVERIFIED_DATA_SOURCE` | `POST_CALL` | MEDIUM | Tool output consumed by the agent without a source provenance marker | EU AI Act Art.10 |
| `rules.StaleMarketContext()` | `STALE_MARKET_CONTEXT` | `POST_CALL` | MEDIUM | Market data retrieved more than `max_age_minutes` (default: 60) before session start | MiFID II Art.25 |
| `rules.RetentionWindowExceeded()` | `RETENTION_WINDOW_EXCEEDED` | `POST_SESSION` | MEDIUM | Trace contains data older than the configured retention window | GDPR Art.5(1)(e) |

---

##### PII detection implementation

`PII_IN_TOOL_ARGS` must catch the following identifier types. Regex is used as a fast filter; an optional spaCy NER pass (enabled with `rules.PII(use_ner=True)`) catches non-pattern PII:

| PII type | Pattern |
|---|---|
| Dutch BSN | `\b\d{3}[\s.]?\d{2}[\s.]?\d{3}\b` (8–9 digit with delimiters) |
| IBAN | `\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b` |
| Email | RFC 5322 simplified |
| Phone (EU) | `\+?[0-9\s\-().]{7,15}` |
| Credit card | Luhn-validated 13–19 digit sequence |

When PII is detected and `redact_pii=True` on the session, the matched substring is replaced with `[REDACTED·<type>]` in the stored `TraceStep.tool_arguments` before the step is appended to the trace. The original value is never persisted.

---

### 6.5 `guardrails/` — Real-Time Enforcement

This is the core architectural differentiator. The guardrail layer intercepts agent execution mid-flight, not after the fact.

#### `guardrails/engine.py` — GuardrailEngine

```python
class GuardrailEngine:
    def __init__(self, rules: List[Rule], policy: GuardrailPolicy):
        self._rules_by_trigger: dict[Trigger, List[Rule]] = defaultdict(list)
        for r in rules:
            self._rules_by_trigger[r.trigger].append(r)
        self._policy = policy

    def evaluate(self, step: TraceStep, trace: AgentTrace, trigger: Trigger) -> None:
        for rule in self._rules_by_trigger.get(trigger, []):
            violations = rule.evaluate(step, trace)
            for v in violations:
                v.detected_at = trigger.value
                self._dispatch(v, trace)

    def _dispatch(self, v: Violation, trace: AgentTrace) -> None:
        action = self._policy.action_for(v.severity)

        if action == 'log':
            v.resolution = 'logged'
            trace.metadata.setdefault('guardrail_violations', []).append(v)
            warnings.warn(str(v), ComplianceWarning, stacklevel=4)

        elif action == 'raise':
            v.resolution = 'auto_halted'
            raise ComplianceHaltError(v)

        elif action == 'pause':
            if self._policy.approver is None:
                raise ValueError("GuardrailPolicy.on_critical='pause' requires approver to be set")
            t0 = time.perf_counter()
            approved = self._policy.approver(v)       # blocks execution thread
            v.approval_latency_ms = (time.perf_counter() - t0) * 1000
            v.approval_timestamp  = datetime.utcnow()
            if approved:
                v.resolution = 'approved'
                trace.metadata.setdefault('guardrail_violations', []).append(v)
            else:
                v.resolution = 'rejected'
                raise ComplianceHaltError(v)
```

#### `guardrails/exceptions.py`

```python
class ComplianceHaltError(Exception):
    """Raised when a guardrail violation is rejected or action='raise'."""
    def __init__(self, violation: Violation):
        self.violation = violation
        super().__init__(f"[{violation.severity}] {violation.rule_id}: {violation.message}")

class ComplianceWarning(UserWarning):
    """Issued for logged violations that do not halt execution."""
```

#### Approver contract

An approver is any `Callable[[Violation], bool]`. It blocks the execution thread until it returns. Examples:

```python
# CLI (dev/test)
def cli_approver(v: Violation) -> bool:
    print(f"\n⚠  [{v.severity}] {v.rule_id}")
    print(f"   {v.message}")
    print(f"   Regulation: {v.regulatory_reference}")
    return input("   Approve continuation? (y/n): ").strip().lower() == 'y'

# Webhook (production — blocks until the approval endpoint responds)
def webhook_approver(v: Violation) -> bool:
    resp = requests.post(
        os.environ["GLASSBOX_APPROVAL_URL"],
        json={"violation": asdict(v)},
        timeout=300,
    )
    return resp.json().get("approved", False)

# Slack (production — blocks until Slack interactive callback received)
# Implementation uses a local HTTP listener or polling loop
```

#### Why synchronous blocking works

LangChain callbacks (`on_tool_start`, etc.) execute synchronously on the agent's thread. Blocking that thread stalls the entire agent — the framework waits naturally. The tool does not execute until the callback returns. This gives us interception-before-execution for free, without coroutine complexity.

**Async support:** Deferred to v1.1.0. For `async def` agent frameworks, `GuardrailEngine` will provide an `async def evaluate_async` method and async-compatible `AsyncGuardrailPolicy`.

---

### 6.6 `reporter/` — Output Generation

#### `reporter/json_reporter.py`

Serialises `AgentTrace` + `List[Violation]` to a JSON object conforming to `docs/schema.json`.

Top-level structure:

```json
{
  "schema_version": "1.0",
  "trace_id": "...",
  "session": {
    "name": "loan_decision_42",
    "start": "2026-05-31T14:32:01Z",
    "end":   "2026-05-31T14:32:04Z",
    "jurisdiction": "EU",
    "halted": false
  },
  "summary": {
    "total_steps": 4,
    "total_violations": 2,
    "by_severity": { "CRITICAL": 1, "HIGH": 1, "MEDIUM": 0, "LOW": 0 }
  },
  "steps": [ ...TraceStep objects... ],
  "violations": [ ...Violation objects including resolution fields... ],
  "integrity": {
    "algorithm": "sha256",
    "chain_valid": true
  }
}
```

`integrity.chain_valid` is computed at serialisation time by re-walking the hash chain. If any step's `step_hash` does not match, `chain_valid = false` and a warning is emitted.

---

#### `reporter/pdf_reporter.py`

Generates a compliance-ready PDF via ReportLab. Sections:

1. **Cover** — trace ID, session name, date, jurisdiction, halt status
2. **Executive summary** — violation counts by severity, pass/fail banner
3. **Guardrail events** — table of real-time violations with resolution and approval latency
4. **Step trace** — table of all `TraceStep` objects with timestamps and latency
5. **Violation detail** — per-violation: rule ID, severity, regulatory reference, remediation
6. **Decision narrative** — LLM-generated paragraph (see below)
7. **Integrity attestation** — hash chain validity, schema version

**Narrative generation:** A single LLM call is made with the following system prompt contract:

> You are a compliance documentation assistant. Given the following agent trace, write a single paragraph (maximum 150 words) describing what the agent did, what decisions it made, and what compliance issues were detected. Describe only what is in the trace — do not infer or speculate. Do not use the word "I".

The generated paragraph is wrapped in a shaded box labelled `AI-GENERATED NARRATIVE — FOR INFORMATIONAL PURPOSES ONLY`.

If no API key is available or the call fails, a template string is substituted and the box is labelled `AUTO-GENERATED SUMMARY`.

---

### 6.7 `cli.py` — Command-Line Interface

Entry point: `glassbox-fin` (defined in `pyproject.toml` `[project.scripts]`).

```
glassbox-fin report    <trail.json> [--format pdf|json|md] [--output path]
glassbox-fin validate  <trail.json>
glassbox-fin violations <trail.json> [--severity critical|high|medium|low]
glassbox-fin verify    <trail.json>         # re-compute and check hash chain
```

```bash
# Generate PDF from saved trail
glassbox-fin report audit_trail.json --format pdf --output report.pdf

# Check integrity of a trail
glassbox-fin verify audit_trail.json
# → ✓ Hash chain valid (4 steps)  OR  ✗ Chain broken at step 3

# List critical violations
glassbox-fin violations audit_trail.json --severity critical
# → [CRITICAL] PII_IN_TOOL_ARGS  step 03  send_email  GDPR Art.9
```

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | Tracer adds < 5ms overhead per intercepted call measured in `tests/perf/`. Guardrail engine evaluation (excluding approver wait) < 10ms per step for up to 20 active rules. |
| NFR-2 | Compatibility | Python 3.10, 3.11, 3.12. LangChain ≥ 0.1.0. LlamaIndex ≥ 0.10.0. OpenAI SDK ≥ 1.0.0. Anthropic SDK ≥ 0.20.0. |
| NFR-3 | Security | Prompts and tool arguments are never written to disk unless `export` is explicitly set. PII is redacted before storage when `redact_pii=True` (default). Hash chain makes stored trails tamper-evident. |
| NFR-4 | Reliability | If any rule raises an exception during evaluation, that rule is skipped, the exception is recorded in `trace.metadata['rule_errors']`, and execution continues. A failing rule must never crash the agent. |
| NFR-5 | Thread safety | `TraceCollector.complete_step` is protected by `threading.Lock`. Guardrail evaluation is outside the lock. Safe for multi-threaded agent execution. |
| NFR-6 | Testability | ≥ 80% test coverage across all modules enforced in CI. Integration tests run against pinned framework versions. Performance benchmarks run in CI with failure threshold. |
| NFR-7 | Packaging | Zero mandatory runtime dependencies beyond Python stdlib and ReportLab. All framework adapters are optional extras: `pip install glassbox-fin[langchain]`, `[llamaindex]`, `[all]`. |
| NFR-8 | Documentation | Every public class and method has a docstring. `docs/` contains: quickstart, API reference, rule-authoring guide, schema reference. Demo notebook is Colab-runnable. |

---

## 8. Build Plan

| Phase | Weeks | Name | Exit criteria |
|---|---|---|---|
| 1 | 1–2 | Foundation | Repo skeleton, `models.py`, `pyproject.toml`, CI pipeline (GitHub Actions), CONTRIBUTING.md. All dataclasses defined and unit-tested. |
| 2 | 3–5 | Trace interceptor | `tracer.py`, `adapters/langchain.py`, `adapters/openai.py`, `adapters/anthropic.py`. `AuditSession` without guardrails. 30+ unit tests. Hash chain implemented. Published to PyPI as `v0.1.0-alpha`. |
| 3 | 6–7 | LlamaIndex + auto-detect | `adapters/llamaindex.py`, `adapters/__init__.py` auto-detection. Integration test matrix across framework versions. |
| 4 | 8–10 | Rule engine | All 8 built-in rules, `@rule` decorator DSL, class-based rule API. Rule trigger system. All rules unit-tested with fixture traces. |
| 5 | 11–12 | Guardrail engine | `guardrails/engine.py`, `guardrails/policy.py`, `guardrails/exceptions.py`. `GuardrailPolicy` wired into `AuditSession`. CLI approver and webhook approver implementations. Full guardrail integration tests. |
| 6 | 13–14 | Reporter + CLI | JSON reporter with schema, hash chain validator. PDF reporter with all 7 sections. LLM narrative layer. CLI with all 4 commands. |
| 7 | 15–16 | Docs, demo, launch | Complete docs. Loan decision demo notebook (Colab-runnable). Launch: Hacker News, r/MachineLearning, LangChain Discord. Target: 100+ stars in 4 weeks. |

---

## 9. Integration Examples

### Minimal — LangChain, post-hoc audit only

```python
from glassbox import AuditSession, rules

with AuditSession(
    name="loan_decision_42",
    rules=[rules.PII(), rules.DTIRationale(), rules.Jurisdiction("EU")],
    jurisdiction="EU",
) as audit:
    result = agent.run(application)

audit.to_json("trace.json")
audit.report("compliance.pdf")
```

### With real-time guardrails — pause on CRITICAL

```python
from glassbox import AuditSession, rules, GuardrailPolicy
from glassbox.guardrails.exceptions import ComplianceHaltError

policy = GuardrailPolicy(
    on_critical='pause',
    on_high='log',
    approver=cli_approver,         # or webhook_approver for production
)

try:
    with AuditSession(
        name="loan_decision_42",
        rules=[rules.PII(), rules.DTIRationale(), rules.DecisionWithoutTrace()],
        jurisdiction="EU",
        guardrails=policy,
        export="audit_trail.json",
    ) as audit:
        result = agent.run(application)

except ComplianceHaltError as e:
    print(f"Agent halted: {e.violation.rule_id} — {e.violation.message}")
    # audit_trail.json was still written with halted=true and full resolution record
```

### Raw OpenAI API

```python
import openai
from glassbox import AuditSession, rules

client = openai.OpenAI()

with AuditSession(rules=[rules.PII()]) as audit:
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Assess credit risk for..."}],
    )

print(audit.violations)
```

### Custom rule

```python
from glassbox.rules import Rule, Violation, Severity, Trigger
from glassbox.models import TraceStep, AgentTrace

class NoHumanReviewFlag(Rule):
    id                   = "NO_HUMAN_REVIEW_FLAG"
    severity             = Severity.HIGH
    trigger              = Trigger.POST_CALL
    description          = "High-value decision made without human review flag"
    regulatory_reference = "Internal policy INV-2024-003"
    remediation          = "Add human_review_required field to decision output"

    def evaluate(self, step: TraceStep, trace: AgentTrace) -> list[Violation]:
        if step.step_type == 'decision' and 'human_review_required' not in (step.output or ''):
            return [Violation.from_step(step, self)]
        return []

with AuditSession(rules=[rules.PII(), NoHumanReviewFlag()]) as audit:
    ...
```

---

## Appendix A — Rules quick reference

| Class | Rule ID | Trigger | Sev | Regulation |
|---|---|---|---|---|
| `rules.PII()` | `PII_IN_TOOL_ARGS` | PRE_CALL | CRITICAL | GDPR Art.9, EU AI Act Art.10 |
| `rules.DecisionWithoutTrace()` | `DECISION_WITHOUT_TRACE` | PRE_DECISION | CRITICAL | EU AI Act Art.13 |
| `rules.DTIRationale()` | `MISSING_DTI_RATIONALE` | POST_CALL | HIGH | EBA GL/2020/06 |
| `rules.Jurisdiction(code)` | `JURISDICTION_MISMATCH` | POST_CALL | HIGH | MiFID II Art.24 |
| `rules.ThresholdBypass()` | `THRESHOLD_BYPASS` | POST_CALL | HIGH | Basel III |
| `rules.UnverifiedDataSource()` | `UNVERIFIED_DATA_SOURCE` | POST_CALL | MEDIUM | EU AI Act Art.10 |
| `rules.StaleMarketContext()` | `STALE_MARKET_CONTEXT` | POST_CALL | MEDIUM | MiFID II Art.25 |
| `rules.RetentionWindowExceeded()` | `RETENTION_WINDOW_EXCEEDED` | POST_SESSION | MEDIUM | GDPR Art.5(1)(e) |

---

## Appendix B — What changed from the product PRD

| Area | PRD | Tech Spec |
|---|---|---|
| Import name | `glassbox_fin` | `glassbox` (matches HTML landing page) |
| License | MIT | Apache 2.0 (matches HTML footer) |
| Rules API | Function-based `@rule` decorator | Class-based with `__init__` config args — `rules.PII()`, `rules.Jurisdiction("EU")` |
| Output API | `session.report.to_pdf(path)` | `audit.report(path)` and `audit.to_json(path)` |
| Guardrails | Not in PRD | Full `GuardrailPolicy` + `GuardrailEngine` + `ComplianceHaltError` |
| Integrity | Not in PRD | SHA-256 hash chain on `TraceStep`, CLI `verify` command |
| 3 medium rules | HALLUCINATION_SIGNAL, CHAIN_FAITHFULNESS, MISSING_DISCLOSURE | UNVERIFIED_DATA_SOURCE, STALE_MARKET_CONTEXT, RETENTION_WINDOW_EXCEEDED (from HTML) |
| Narrative generation | Optional LLM call | Same, but fallback template added; clearly labelled in PDF |
