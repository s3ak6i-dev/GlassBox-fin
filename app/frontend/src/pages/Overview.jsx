import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useSSE } from '../hooks/useSSE.js'
import { statsApi, tracesApi } from '../api/traces.js'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import LiveBadge from '../components/ui/LiveBadge.jsx'
import { money, relativeTime } from '../lib/format.js'

export default function Overview() {
  const { token, org, workspace } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])

  const load = () => {
    if (!workspace) return
    statsApi.overview(token, workspace.id).then(setStats).catch(() => {})
    tracesApi.list(token, workspace.id, { limit: 8 }).then(setRecent).catch(() => {})
  }
  useEffect(() => { load() }, [token, workspace])

  const { connected } = useSSE(workspace ? `/traces/stream?workspace_id=${workspace.id}` : null, {
    enabled: !!workspace,
    onEvent: (e) => { if (e.type === 'trace_end' || e.type === 'trace_start') load() },
  })

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Overview</h1>
          <p className="gb-page-sub">Compliance posture across {org?.name || 'your organization'}</p>
        </div>
        {connected && <LiveBadge />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Traces this week"
          value={stats ? stats.traces_week : '—'}
          sub={stats ? `${stats.traces_today} today` : 'loading…'}
          sparkData={stats?.traces_spark}
        />
        <StatCard
          label="Active violations"
          value={stats ? stats.active_violations : '—'}
          sub={stats ? `${stats.critical_violations} critical` : 'loading…'}
          danger={stats?.critical_violations > 0}
        />
        <StatCard
          label="Holds pending"
          value={stats ? stats.holds_pending : '—'}
          sub="awaiting approval"
          danger={stats?.holds_pending > 0}
        />
        <StatCard
          label="Spend this month"
          value={stats ? money(stats.spend_month) : '—'}
          sub="across all vendors"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card brackets>
          <div className="gb-section-label">Recent traces</div>
          {recent.length === 0 ? (
            <div className="gb-empty">
              <span className="gb-empty-icon">≡</span>
              <div className="gb-empty-title">No traces yet</div>
              <p style={{ maxWidth: 320, color: 'var(--ink-3)' }}>
                Wrap an agent with an <code>AuditSession</code> using your instrumentation key.
                Traces stream in here live.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recent.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/app/traces/${t.trace_id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px',
                    borderBottom: '1px solid var(--line)', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: t.halted ? 'var(--critical)' : t.violation_count ? 'var(--high)' : 'var(--pass)',
                  }} />
                  <span style={{ flex: 1, color: 'var(--ink)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.task_description || 'untitled'}
                  </span>
                  <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>{t.agent_name}</span>
                  <span style={{ color: 'var(--ink-faint)', fontSize: 11.5, minWidth: 60, textAlign: 'right' }}>
                    {relativeTime(t.session_start)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card brackets>
          <div className="gb-section-label">Posture</div>
          {!stats || stats.active_violations === 0 ? (
            <div className="gb-empty">
              <span className="gb-empty-icon" style={{ color: 'var(--pass)' }}>✓</span>
              <div className="gb-empty-title">All clear</div>
              <p style={{ maxWidth: 260, color: 'var(--ink-3)' }}>No active violations across your fleet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
              <PostureRow label="Critical" value={stats.critical_violations} color="var(--critical)" total={stats.active_violations} />
              <PostureRow label="All violations" value={stats.active_violations} color="var(--high)" total={stats.active_violations} />
              <PostureRow label="Agents online" value={stats.agents_total} color="var(--cyan)" total={stats.agents_total} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function PostureRow({ label, value, color, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
        <span style={{ color: 'var(--ink-2)' }}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--line-2)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  )
}
