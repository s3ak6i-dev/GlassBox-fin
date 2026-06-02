import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { tracesApi } from '../../../api/traces.js'
import SeverityBadge from '../../ui/SeverityBadge.jsx'
import { money, relativeTime, maskKey } from '../../../lib/format.js'

const STATUS = { healthy: '#3fd99a', warning: '#ffb454', critical: '#ff5d6c', idle: '#6b7488' }

export default function NodeDrawer({ node, onClose }) {
  const { token, workspace } = useAuth()
  const navigate = useNavigate()
  const [traces, setTraces] = useState([])

  useEffect(() => {
    if (!node || node.type !== 'agent' || !workspace) return
    tracesApi.list(token, workspace.id, { agent_id: node.id, limit: 6 }).then(setTraces).catch(() => {})
  }, [node, token, workspace])

  if (!node) return null
  const isAgent = node.type === 'agent'

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 340,
      background: 'rgba(9,12,19,0.97)', borderLeft: '1px solid var(--line-2)',
      backdropFilter: 'var(--glass-blur)', padding: 24, overflowY: 'auto', zIndex: 10,
      animation: 'slide-in-right 0.25s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 4 }}>
            {isAgent ? 'Agent' : 'Vendor'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: '#fff' }}>{node.name}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      {isAgent ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <Stat label="Status" value={node.status} color={STATUS[node.status]} />
            <Stat label="Traces" value={node.trace_count} />
            <Stat label="Violations" value={node.violation_count} color={node.critical_count ? 'var(--critical)' : undefined} />
            <Stat label="Spend" value={money(node.spend)} />
          </div>
          {node.has_hold && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,194,77,0.1)', border: '1px solid rgba(255,194,77,0.3)', color: 'var(--warn)', fontSize: 12, marginBottom: 20 }}>
              ⏸ This agent has a hold awaiting approval
            </div>
          )}
          <div className="gb-section-label" style={{ marginBottom: 12 }}>Recent traces</div>
          {traces.length === 0 ? (
            <div style={{ color: 'var(--ink-faint)', fontSize: 12 }}>No traces yet.</div>
          ) : traces.map(t => (
            <div key={t.id} onClick={() => navigate(`/app/traces/${t.trace_id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.halted ? 'var(--critical)' : t.violation_count ? 'var(--high)' : 'var(--pass)' }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.task_description || 'untitled'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{relativeTime(t.session_start)}</span>
            </div>
          ))}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Stat label="Calls" value={node.call_count} />
          <Stat label="Tokens" value={node.tokens.toLocaleString()} />
          <Stat label="Spend" value={money(node.spend)} />
          <Stat label="Type" value="LLM provider" />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: '10px 12px', border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--glass)' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{label}</div>
      <div style={{ fontSize: 16, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  )
}
