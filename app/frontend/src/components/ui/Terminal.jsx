import LiveBadge from './LiveBadge.jsx'

export function Terminal({ title, live = false, children }) {
  return (
    <div className="gb-terminal">
      <div className="gb-term-bar">
        <div className="gb-term-dots">
          <i style={{ background: '#ff5f57' }} />
          <i style={{ background: '#febc2e' }} />
          <i style={{ background: '#28c840' }} />
        </div>
        <div className="gb-term-title">{title}</div>
        {live && <LiveBadge />}
      </div>
      <div className="gb-term-body">{children}</div>
    </div>
  )
}

export function TraceRow({ idx, ts, children, flagged, status }) {
  const statusEl = status === 'pass'
    ? <span className="gb-status-pass">✓ traced</span>
    : status === 'fail'
    ? <span className="gb-status-fail">✗ flagged</span>
    : status === 'warn'
    ? <span className="gb-status-warn">! review</span>
    : null

  return (
    <div className={`gb-trace-row${flagged ? ' flagged' : ''}`}>
      <span className="gb-trace-idx">{String(idx).padStart(2, '0')}</span>
      <span className="gb-trace-ts">{ts}</span>
      <span className="gb-trace-body">{children}</span>
      {statusEl}
    </div>
  )
}

export function ViolationBar({ ruleId, message, severity, regulation, flash }) {
  return (
    <div className={`gb-vbar${flash ? ' flash' : ''}`}>
      <span className="gb-vbar-icon">▲</span>
      <b>{ruleId}</b>
      <span>— {message}</span>
      <span style={{ marginLeft: 'auto' }} className="gb-vbar-sev">
        {severity} · {regulation}
      </span>
    </div>
  )
}
