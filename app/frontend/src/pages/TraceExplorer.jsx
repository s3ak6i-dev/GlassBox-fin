import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useSSE } from '../hooks/useSSE.js'
import { tracesApi } from '../api/traces.js'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import LiveBadge from '../components/ui/LiveBadge.jsx'
import FilterPill from '../components/ui/FilterPill.jsx'
import { relativeTime } from '../lib/format.js'

const OUTCOMES = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'halted', label: 'Halted' },
  { value: 'running', label: 'Running' },
]

function OutcomeTag({ outcome }) {
  const map = {
    completed: { c: 'var(--pass)', t: '✓ completed' },
    halted:    { c: 'var(--critical)', t: '⊘ halted' },
    running:   { c: 'var(--warn)', t: '● running' },
  }
  const o = map[outcome] || map.completed
  return <span style={{ color: o.c, fontSize: 12 }}>{o.t}</span>
}

const COLS = '140px 1fr 160px 70px 120px 120px'

export default function TraceExplorer() {
  const { token, workspace } = useAuth()
  const navigate = useNavigate()
  const [traces, setTraces] = useState([])
  const [loading, setLoading] = useState(true)
  const [outcome, setOutcome] = useState('all')
  const [search, setSearch] = useState('')

  const load = () => {
    if (!workspace) return
    const params = outcome !== 'all' ? { outcome } : {}
    tracesApi.list(token, workspace.id, params)
      .then(setTraces)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token, workspace, outcome])

  useSSE(workspace ? `/traces/stream?workspace_id=${workspace.id}` : null, {
    enabled: !!workspace,
    onEvent: (e) => { if (e.type === 'trace_end' || e.type === 'trace_start') load() },
  })

  const filtered = traces.filter(t =>
    !search ||
    (t.task_description || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.agent_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Trace Explorer</h1>
          <p className="gb-page-sub">Every agent execution, searchable and filterable</p>
        </div>
        <LiveBadge />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {OUTCOMES.map(o => (
          <FilterPill key={o.value} active={outcome === o.value} onClick={() => setOutcome(o.value)}>
            {o.label}
          </FilterPill>
        ))}
        <div style={{ marginLeft: 'auto', width: 220 }}>
          <Input placeholder="search task or agent…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
        <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
          <div className="gb-table-row gb-table-head" style={{ gridTemplateColumns: COLS }}>
            <div className="gb-table-cell">Time</div>
            <div className="gb-table-cell">Task</div>
            <div className="gb-table-cell">Agent</div>
            <div className="gb-table-cell">Steps</div>
            <div className="gb-table-cell">Violations</div>
            <div className="gb-table-cell">Outcome</div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40, background: 'var(--bg-2)' }}>
              <div className="gb-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="gb-empty" style={{ background: 'var(--bg-2)' }}>
              <span className="gb-empty-icon">≡</span>
              <div className="gb-empty-title">No traces yet</div>
              <p style={{ color: 'var(--ink-3)', maxWidth: 360 }}>
                Run an agent wrapped with your instrumentation key and its trace appears here in real time.
              </p>
            </div>
          ) : filtered.map(t => (
            <div
              key={t.id}
              className="gb-table-row"
              style={{ gridTemplateColumns: COLS }}
              onClick={() => navigate(`/traces/${t.trace_id}`)}
            >
              <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{relativeTime(t.session_start)}</div>
              <div style={{ color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.task_description || <span style={{ color: 'var(--ink-faint)' }}>untitled</span>}
              </div>
              <div style={{ color: 'var(--ink-2)', fontSize: 12 }}>{t.agent_name}</div>
              <div style={{ color: 'var(--ink-2)' }}>{t.step_count}</div>
              <div>
                {t.violation_count === 0
                  ? <span style={{ color: 'var(--pass)', fontSize: 12 }}>clean</span>
                  : <span style={{ color: t.critical_count ? 'var(--critical)' : 'var(--high)', fontSize: 12 }}>
                      {t.violation_count}{t.critical_count ? ` · ${t.critical_count} crit` : ''}
                    </span>}
              </div>
              <div><OutcomeTag outcome={t.outcome} /></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
