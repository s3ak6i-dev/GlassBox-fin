import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { violationsApi } from '../api/violations.js'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import FilterPill from '../components/ui/FilterPill.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import { relativeTime } from '../lib/format.js'

const SEVS = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
]

const RESOLUTION_LABEL = {
  approved: { c: 'var(--pass)', t: 'approved' },
  rejected: { c: 'var(--critical)', t: 'denied' },
  auto_halted: { c: 'var(--critical)', t: 'auto-halted' },
  logged: { c: 'var(--ink-3)', t: 'logged' },
  pending: { c: 'var(--warn)', t: 'pending' },
}

export default function ViolationCenter() {
  const { token, workspace } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sev, setSev] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!workspace) return
    const params = sev !== 'all' ? { severity: sev } : {}
    violationsApi.list(token, workspace.id, params)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [token, workspace, sev])

  const filtered = items.filter(v =>
    !search ||
    v.rule_id.toLowerCase().includes(search.toLowerCase()) ||
    (v.agent_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Violation Center</h1>
          <p className="gb-page-sub">Every compliance violation across your fleet, mapped to its regulation</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {SEVS.map(s => (
          <FilterPill key={s.value} active={sev === s.value} onClick={() => setSev(s.value)}>{s.label}</FilterPill>
        ))}
        <div style={{ marginLeft: 'auto', width: 220 }}>
          <Input placeholder="search rule or agent…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
        <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
          <div className="gb-table-row gb-table-head" style={{ gridTemplateColumns: '90px 1fr 150px 120px 90px 24px' }}>
            <div className="gb-table-cell">Severity</div>
            <div className="gb-table-cell">Rule</div>
            <div className="gb-table-cell">Agent</div>
            <div className="gb-table-cell">Resolution</div>
            <div className="gb-table-cell">When</div>
            <div className="gb-table-cell" />
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40, background: 'var(--bg-2)' }}><div className="gb-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="gb-empty" style={{ background: 'var(--bg-2)' }}>
              <span className="gb-empty-icon" style={{ color: 'var(--pass)' }}>✓</span>
              <div className="gb-empty-title">No violations</div>
              <p style={{ color: 'var(--ink-3)' }}>Nothing flagged for this filter.</p>
            </div>
          ) : filtered.map(v => {
            const res = RESOLUTION_LABEL[v.resolution] || { c: 'var(--ink-3)', t: v.resolution || '—' }
            const open = expanded === v.id
            return (
              <div key={v.id} style={{ background: 'var(--bg-2)' }}>
                <div
                  className="gb-table-row"
                  style={{ gridTemplateColumns: '90px 1fr 150px 120px 90px 24px', background: 'transparent' }}
                  onClick={() => setExpanded(open ? null : v.id)}
                >
                  <SeverityBadge severity={v.severity} />
                  <div style={{ color: 'var(--ink)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.rule_id}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{v.agent_name}</div>
                  <div style={{ color: res.c, fontSize: 12 }}>{res.t}</div>
                  <div style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{relativeTime(v.created_at)}</div>
                  <div style={{ color: 'var(--ink-3)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</div>
                </div>
                {open && (
                  <div style={{ padding: '0 20px 18px 20px', animation: 'pane-in 0.3s ease' }}>
                    <div style={{ borderTop: '1px dashed var(--line-2)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 14, color: 'var(--ink-2)', fontFamily: 'var(--font-prose)' }}>{v.message}</div>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <Meta label="Regulation" value={v.regulatory_reference || '—'} />
                        <Meta label="Detected at" value={v.detected_at} />
                        <Meta label="Remediation" value={v.remediation || '—'} />
                      </div>
                      {v.trace_id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/traces/${v.trace_id}`) }}
                          style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid var(--line-2)', borderRadius: 7, color: 'var(--cyan)', padding: '7px 13px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                        >
                          View trace →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{value}</div>
    </div>
  )
}
