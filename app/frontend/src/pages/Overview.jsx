import { useAuth } from '../hooks/useAuth.js'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import LiveBadge from '../components/ui/LiveBadge.jsx'

const SPARK = [3, 5, 2, 8, 6, 9, 4, 7, 11, 8, 6, 12, 9, 14, 10, 8, 13, 11, 9, 15, 12, 10, 14, 11]

export default function Overview() {
  const { user } = useAuth()

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Overview</h1>
          <p className="gb-page-sub">
            Compliance posture across all agents{user?.email ? ` · ${user.email}` : ''}
          </p>
        </div>
        <LiveBadge />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Traces this week"  value="—"  sub="connect an agent to begin" sparkData={SPARK} />
        <StatCard label="Active violations" value="—"  sub="0 critical" />
        <StatCard label="Holds pending"     value="—"  sub="awaiting approval" />
        <StatCard label="Spend this month"  value="—"  sub="across all vendors" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card brackets>
          <div className="gb-section-label">Recent traces</div>
          <div className="gb-empty">
            <span className="gb-empty-icon">≡</span>
            <div className="gb-empty-title">No traces yet</div>
            <p style={{ maxWidth: 320, color: 'var(--ink-3)' }}>
              Register an agent and wrap it with an <code>AuditSession</code> using your
              instrumentation key. Traces will stream in here live.
            </p>
          </div>
        </Card>

        <Card brackets>
          <div className="gb-section-label">Violation trend</div>
          <div className="gb-empty">
            <span className="gb-empty-icon">△</span>
            <div className="gb-empty-title">Nothing flagged</div>
            <p style={{ maxWidth: 260, color: 'var(--ink-3)' }}>
              Compliance violations across your fleet will trend here once traces arrive.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
