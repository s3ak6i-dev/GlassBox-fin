import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { statsApi } from '../api/traces.js'
import { agentsApi } from '../api/agents.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { relativeTime, maskKey } from '../lib/format.js'

const STATUS = {
  healthy:  { c: 'var(--pass)',     label: 'healthy' },
  warning:  { c: 'var(--high)',     label: 'warning' },
  critical: { c: 'var(--critical)', label: 'attention' },
  idle:     { c: 'var(--ink-faint)',label: 'idle' },
}

const COLS = '16px 1fr 200px 90px 110px 120px'

function StatusDot({ status }) {
  const s = STATUS[status] || STATUS.idle
  return <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.c, boxShadow: `0 0 8px ${s.c}`, display: 'inline-block' }} />
}

function KeyCell({ agentKey }) {
  const [copied, setCopied] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(agentKey); setCopied(true); setTimeout(() => setCopied(false), 1400) }}
      title="Click to copy full key"
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>{maskKey(agentKey)}</span>
      <span style={{ fontSize: 10, color: copied ? 'var(--pass)' : 'var(--ink-faint)' }}>{copied ? '✓' : '⧉'}</span>
    </div>
  )
}

export default function AgentRegistry() {
  const { token, workspace } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const load = () => {
    if (!workspace) return
    statsApi.agents(token, workspace.id).then(setAgents).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token, workspace])

  async function addAgent() {
    if (!newName.trim()) return
    await agentsApi.create(token, workspace.id, { name: newName.trim(), description: '' })
    setNewName(''); setAdding(false); load()
  }

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Agents</h1>
          <p className="gb-page-sub">Every registered agent and its instrumentation key</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(a => !a)}>+ Register agent</Button>
      </div>

      {adding && (
        <Card brackets style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Input placeholder="agent name, e.g. fraud-detection-eu" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button variant="primary" onClick={addAgent} disabled={!newName.trim()}>Generate key</Button>
          <Button onClick={() => setAdding(false)}>Cancel</Button>
        </Card>
      )}

      <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
        <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
          <div className="gb-table-row gb-table-head" style={{ gridTemplateColumns: COLS }}>
            <div className="gb-table-cell" />
            <div className="gb-table-cell">Agent</div>
            <div className="gb-table-cell">Instrumentation key</div>
            <div className="gb-table-cell">Traces</div>
            <div className="gb-table-cell">Violations</div>
            <div className="gb-table-cell">Last seen</div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40, background: 'var(--bg-2)' }}><div className="gb-spinner" /></div>
          ) : agents.length === 0 ? (
            <div className="gb-empty" style={{ background: 'var(--bg-2)' }}>
              <span className="gb-empty-icon">●</span>
              <div className="gb-empty-title">No agents yet</div>
              <p style={{ color: 'var(--ink-3)' }}>Register your first agent to get an instrumentation key.</p>
            </div>
          ) : agents.map(a => (
            <div key={a.id} className="gb-table-row" style={{ gridTemplateColumns: COLS, cursor: 'default' }}>
              <StatusDot status={a.status} />
              <div>
                <div style={{ color: 'var(--ink)' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: STATUS[a.status]?.c || 'var(--ink-faint)' }}>{STATUS[a.status]?.label}</div>
              </div>
              <KeyCell agentKey={a.instrumentation_key} />
              <div style={{ color: 'var(--ink-2)' }}>{a.trace_count}</div>
              <div>
                {a.violation_count === 0
                  ? <span style={{ color: 'var(--pass)', fontSize: 12 }}>clean</span>
                  : <span style={{ color: a.critical_count ? 'var(--critical)' : 'var(--high)', fontSize: 12 }}>
                      {a.violation_count}{a.critical_count ? ` · ${a.critical_count} crit` : ''}
                    </span>}
              </div>
              <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{relativeTime(a.last_seen_at)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
