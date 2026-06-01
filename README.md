# glassbox-fin

Real-time compliance guardrails and audit trails for financial LLM agents.

```bash
pip install glassbox-fin
```

```python
from glassbox import AuditSession, rules, GuardrailPolicy

policy = GuardrailPolicy(on_critical="pause", approver=your_approver)

with AuditSession(
    name="loan_decision_42",
    rules=[rules.PII(), rules.DTIRationale(), rules.Jurisdiction("EU")],
    jurisdiction="EU",
    guardrails=policy,
) as audit:
    result = agent.run(application)

audit.to_json("trace.json")
audit.report("compliance.pdf")
```

Apache 2.0 license.
