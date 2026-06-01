import Card from './Card.jsx'
import Sparkline from './Sparkline.jsx'

export default function StatCard({ label, value, sub, sparkData, danger }) {
  return (
    <Card brackets style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div className="gb-stat-label">{label}</div>
      <div
        className="gb-stat-value"
        style={danger ? { background: 'none', color: 'var(--critical)' } : undefined}
      >
        {value ?? '—'}
      </div>
      {sub && <div className="gb-stat-sub">{sub}</div>}
      {sparkData && (
        <div style={{ marginTop: 4 }}>
          <Sparkline data={sparkData} width={100} height={20} />
        </div>
      )}
    </Card>
  )
}
