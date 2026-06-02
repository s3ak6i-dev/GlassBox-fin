import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { statsApi } from '../api/traces.js'
import Card from '../components/ui/Card.jsx'
import CodeBlock from '../components/ui/CodeBlock.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'

const FRAMEWORKS = [
  { value: 'openai', label: 'OpenAI / Groq / Ollama' },
  { value: 'langchain', label: 'LangChain' },
  { value: 'llamaindex', label: 'LlamaIndex' },
  { value: 'multi', label: 'Multi-agent' },
]

function snippets(KEY) {
  return {
    openai: `from openai import OpenAI
from glassbox import AuditSession, rules, GuardrailPolicy

# Any OpenAI-compatible endpoint — OpenAI, Groq, Together, OpenRouter, Ollama…
client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_KEY)

with AuditSession(
    name="loan_decision_42",
    instrumentation_key="${KEY}",
    api_url="${location.origin.replace('5173', '8000')}",
    rules=[rules.PII(), rules.DTIRationale()],
    guardrails=GuardrailPolicy(on_critical="pause"),
) as audit:
    client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Assess loan A-8821"}],
    )
# → trace streams to this dashboard automatically (nothing else to wire)`,

    langchain: `from glassbox import AuditSession, rules, GuardrailPolicy

with AuditSession(
    instrumentation_key="${KEY}",
    api_url="${location.origin.replace('5173', '8000')}",
    rules=[rules.PII()],
    guardrails=GuardrailPolicy(on_critical="pause"),
) as audit:
    # Modern LangChain attaches callbacks per-invocation — pass audit.callbacks:
    executor.invoke({"input": task}, config={"callbacks": audit.callbacks})

# A tool call carrying PII pauses the agent → approve it from the Hold Inbox.`,

    llamaindex: `from glassbox import AuditSession, rules

# LlamaIndex needs ZERO wiring — the adapter registers on
# Settings.callback_manager and captures every LLM/tool event.
with AuditSession(
    instrumentation_key="${KEY}",
    api_url="${location.origin.replace('5173', '8000')}",
    rules=[rules.PII(), rules.DTIRationale()],
) as audit:
    llm.complete("Assess the creditworthiness of applicant A-8821")`,

    multi: `from glassbox import AuditSession, rules
from glassbox.platform import spawn_subagent

API = "${location.origin.replace('5173', '8000')}"
SUPERVISOR = "${KEY}"

# A supervisor registers child agents — the Fleet graph draws the edges.
fraud_key  = spawn_subagent(SUPERVISOR, "fraud-check", API)
credit_key = spawn_subagent(SUPERVISOR, "credit-scoring", API)

with AuditSession(instrumentation_key=fraud_key, api_url=API, rules=[rules.PII()]) as audit:
    ...   # this sub-agent's calls appear under its own node, wired to the supervisor`,
  }
}

export default function Docs() {
  const { token, workspace } = useAuth()
  const [agents, setAgents] = useState([])
  const [fw, setFw] = useState('openai')
  const [keyId, setKeyId] = useState(null)

  useEffect(() => {
    if (!workspace) return
    statsApi.agents(token, workspace.id).then(a => {
      setAgents(a)
      if (a.length) setKeyId(a[0].id)
    }).catch(() => {})
  }, [token, workspace])

  const activeKey = useMemo(
    () => agents.find(a => a.id === keyId)?.instrumentation_key || '<your-instrumentation-key>',
    [agents, keyId]
  )
  const code = snippets(activeKey)[fw]
  const apiUrl = location.origin.replace('5173', '8000')

  return (
    <div className="gb-page" style={{ maxWidth: 920 }}>
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Connect an agent</h1>
          <p className="gb-page-sub">Wrap any LLM agent and its traces, violations, and guardrails stream here live</p>
        </div>
      </div>

      {/* Step 1 — key */}
      <Card brackets style={{ marginBottom: 16 }}>
        <div className="gb-section-label">1 · Pick an instrumentation key</div>
        <p style={{ fontFamily: 'var(--font-prose)', fontSize: 14, color: 'var(--ink-2)', marginTop: 0 }}>
          Every agent has a key that routes its data to this workspace. The snippets below are
          pre-filled with the one you select.
        </p>
        {agents.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            No agents yet — register one in <strong style={{ color: 'var(--ink-2)' }}>Agents</strong> or <strong style={{ color: 'var(--ink-2)' }}>Settings ▸ API Keys</strong>.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <select className="gb-input" style={{ width: 260 }} value={keyId || ''} onChange={e => setKeyId(e.target.value)}>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>{activeKey}</span>
          </div>
        )}
      </Card>

      {/* Step 2 — install */}
      <Card brackets style={{ marginBottom: 16 }}>
        <div className="gb-section-label">2 · Install the library</div>
        <CodeBlock lang="bash" label="shell" code={`pip install glassbox-fin`} />
        <p style={{ fontFamily: 'var(--font-prose)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 0 }}>
          Need a free LLM to test with? <strong style={{ color: 'var(--ink-2)' }}>Groq</strong>
          {' '}(free key at console.groq.com) or <strong style={{ color: 'var(--ink-2)' }}>Ollama</strong> (local, no key).
        </p>
      </Card>

      {/* Step 3 — wire it */}
      <Card brackets style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="gb-section-label" style={{ margin: 0 }}>3 · Wrap your agent</div>
          <SegmentedControl options={FRAMEWORKS} value={fw} onChange={setFw} size="sm" />
        </div>
        <CodeBlock code={code} label={`python · ${FRAMEWORKS.find(f => f.value === fw).label}`} />
        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-3)', fontFamily: 'var(--font-prose)' }}>
          {fw === 'openai' && 'Instance clients with any base_url are captured automatically — that covers every OpenAI-compatible provider.'}
          {fw === 'langchain' && 'audit.callbacks returns the LangChain handler for this session. LangGraph works the same way.'}
          {fw === 'llamaindex' && 'No callbacks to pass — capture is global via Settings.callback_manager.'}
          {fw === 'multi' && 'Each child becomes its own agent node, linked to the supervisor by a dashed delegation arrow in the Fleet graph.'}
        </div>
      </Card>

      {/* Step 4 — watch */}
      <Card brackets>
        <div className="gb-section-label">4 · Watch it land</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          {[
            ['Trace Explorer', 'every run appears live (SSE)'],
            ['Hold Inbox', 'pause guardrails wait for your approval'],
            ['Fleet', 'agents wire to vendors & sub-agents'],
            ['Spend', 'token cost per vendor / model'],
          ].map(([t, d]) => (
            <div key={t} style={{ padding: '12px 14px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', background: 'var(--glass)' }}>
              <div style={{ color: 'var(--ink)', fontSize: 13, marginBottom: 3 }}>{t}</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-prose)', fontSize: 13, color: 'var(--ink-faint)', marginBottom: 0, marginTop: 16 }}>
          Standalone (no platform)? Drop <code>instrumentation_key</code> and pass your own
          <code> approver=</code> to GuardrailPolicy, then <code>audit.to_json()</code> / <code>audit.report()</code>.
          Backend API for this workspace: <code>{apiUrl}</code>.
        </p>
      </Card>
    </div>
  )
}
