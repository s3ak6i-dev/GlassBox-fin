import { money, relativeTime } from '../../../lib/format.js'

const STATUS = {
  healthy:  { c: '#3fd99a', label: 'healthy' },
  warning:  { c: '#ffb454', label: 'warning' },
  critical: { c: '#ff5d6c', label: 'attention' },
  idle:     { c: '#6b7488', label: 'idle' },
}

export default function FleetGrid({ nodes, onSelect, selectedId }) {
  const agents = nodes.filter(n => n.type === 'agent')
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      {agents.map(a => {
        const s = STATUS[a.status] || STATUS.idle
        const sel = a.id === selectedId
        return (
          <div
            key={a.id}
            onClick={() => onSelect?.(a)}
            style={{
              position: 'relative', cursor: 'pointer', padding: 16,
              border: `1px solid ${sel ? s.c : 'var(--line-2)'}`,
              borderRadius: 'var(--r)', background: 'var(--glass)',
              transition: 'border-color 0.2s',
              animation: a.status === 'critical' ? 'node-flag 1.8s ease-in-out infinite' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.c, boxShadow: `0 0 8px ${s.c}` }} />
              {a.has_hold && <span style={{ fontSize: 10, color: 'var(--warn)', fontFamily: 'var(--font-mono)' }}>⏸ HOLD</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', marginBottom: 2, wordBreak: 'break-word' }}>
              {a.name}
            </div>
            <div style={{ fontSize: 11, color: s.c, marginBottom: 12 }}>{s.label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)' }}>
              <span>{a.trace_count} traces</span>
              <span style={{ color: a.critical_count ? 'var(--critical)' : a.violation_count ? 'var(--high)' : 'var(--pass)' }}>
                {a.violation_count ? `${a.violation_count} viol` : 'clean'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
