import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useSSE } from '../hooks/useSSE.js'
import { holdsApi } from '../api/holds.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import LiveBadge from '../components/ui/LiveBadge.jsx'
import { fullDateTime } from '../lib/format.js'

const SLA_SECONDS = 300  // escalate to critical styling after 5 minutes

function waitLabel(createdAt, now) {
  const secs = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function HoldInbox() {
  const { token, workspace } = useAuth()
  const navigate = useNavigate()
  const { refreshHolds } = useOutletContext() || {}
  const [pending, setPending] = useState([])
  const [resolved, setResolved] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [resolving, setResolving] = useState({})   // holdId -> 'approved'|'denied'

  const load = () => {
    if (!workspace) return
    Promise.all([
      holdsApi.list(token, workspace.id, 'pending'),
      holdsApi.list(token, workspace.id),
    ]).then(([p, all]) => {
      setPending(p)
      setResolved(all.filter(h => h.status !== 'pending').slice(0, 6))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token, workspace])

  // live wait timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useSSE(workspace ? `/traces/stream?workspace_id=${workspace.id}` : null, {
    enabled: !!workspace,
    onEvent: (e) => { if (e.type === 'hold_created') load() },
  })

  async function resolve(hold, action) {
    setResolving(r => ({ ...r, [hold.id]: action === 'approve' ? 'approved' : 'denied' }))
    try {
      if (action === 'approve') await holdsApi.approve(token, hold.id, null)
      else await holdsApi.deny(token, hold.id, null)
      // let the exit animation play, then refresh
      setTimeout(() => { load(); refreshHolds?.() }, 450)
    } catch {
      setResolving(r => { const n = { ...r }; delete n[hold.id]; return n })
    }
  }

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Hold Inbox</h1>
          <p className="gb-page-sub">Agent executions paused at the call boundary, waiting for your decision</p>
        </div>
        <LiveBadge />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="gb-spinner" /></div>
      ) : pending.length === 0 ? (
        <Card brackets>
          <div className="gb-empty">
            <span className="gb-empty-icon" style={{ color: 'var(--pass)' }}>✓</span>
            <div className="gb-empty-title">Nothing waiting</div>
            <p style={{ maxWidth: 380, color: 'var(--ink-3)' }}>
              No agents are paused. When a guardrail fires with a <code>pause</code> policy,
              the agent halts at the call boundary and appears here for sign-off — it cannot
              proceed until you decide.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pending.map(hold => {
            const secs = Math.floor((now - new Date(hold.created_at).getTime()) / 1000)
            const overSla = secs > SLA_SECONDS
            const state = resolving[hold.id]
            return (
              <div
                key={hold.id}
                className={`gb-hold-card ${overSla ? 'critical' : ''} ${state ? 'resolving' : ''}`}
                style={state ? { borderColor: state === 'approved' ? 'var(--pass)' : 'var(--critical)' } : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <SeverityBadge severity={hold.severity} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                    {hold.rule_id}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: overSla ? 'var(--critical)' : 'var(--warn)' }}>
                    ⏱ waiting {waitLabel(hold.created_at, now)}{overSla ? ' · SLA breached' : ''}
                  </span>
                </div>

                <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 6 }}>{hold.message}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
                  Agent: <span style={{ color: 'var(--ink-2)' }}>{hold.agent_name}</span>
                  {hold.regulatory_reference && <> · {hold.regulatory_reference}</>}
                  {' · '}{fullDateTime(hold.created_at)}
                </div>

                {state ? (
                  <div style={{ fontSize: 13, color: state === 'approved' ? 'var(--pass)' : 'var(--critical)', fontFamily: 'var(--font-mono)' }}>
                    {state === 'approved' ? '✓ Approved — agent resuming' : '⊘ Denied — agent halted'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="approve" onClick={() => resolve(hold, 'approve')}>Approve →</Button>
                    <Button variant="danger" onClick={() => resolve(hold, 'deny')}>Deny ✕</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div className="gb-section-label">Recently resolved</div>
          <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
            <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
              {resolved.map(h => (
                <div key={h.id} className="gb-table-row" style={{ gridTemplateColumns: '90px 1fr 160px 110px', cursor: 'default' }}>
                  <SeverityBadge severity={h.severity} />
                  <div style={{ color: 'var(--ink-2)', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.rule_id} — {h.message}
                  </div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{h.agent_name}</div>
                  <div style={{ fontSize: 12, color: h.status === 'approved' ? 'var(--pass)' : 'var(--critical)' }}>
                    {h.status === 'approved' ? '✓ approved' : '⊘ denied'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
