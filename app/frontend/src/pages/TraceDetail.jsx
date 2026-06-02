import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { tracesApi } from '../api/traces.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import { Terminal } from '../components/ui/Terminal.jsx'
import { reportsApi, downloadBlob } from '../api/spend.js'
import { fullDateTime, shortTime } from '../lib/format.js'

function StepLine({ idx, step, violations }) {
  const stepViols = violations.filter(v => v.step_db_id === step.id)
  const flagged = stepViols.length > 0
  const status = flagged ? 'fail' : 'pass'

  let body
  if (step.step_type === 'llm_call') {
    body = <><span className="kw">llm.call</span> <span className="k">model</span>=<span className="str">"{step.model || '?'}"</span></>
  } else if (step.step_type === 'tool_call') {
    body = <><span className="kw">tool.call</span> <span className="k">name</span>=<span className="str">"{step.tool_name || '?'}"</span>{step.tool_arguments ? <> <span className="k">args</span>=<span className="num">{JSON.stringify(step.tool_arguments).slice(0, 60)}</span></> : null}</>
  } else {
    body = <><span className="kw">decision</span> <span className="k">out</span>=<span className="str">"{(step.output || '').slice(0, 60)}"</span></>
  }

  return (
    <>
      <div className={`gb-trace-row${flagged ? ' flagged' : ''}`} style={{ gridTemplateColumns: '32px 90px 1fr auto' }}>
        <span className="gb-trace-idx">{String(idx).padStart(2, '0')}</span>
        <span className="gb-trace-ts">{shortTime(step.timestamp)}</span>
        <span className="gb-trace-body">{body}</span>
        <span className={status === 'pass' ? 'gb-status-pass' : 'gb-status-fail'}>
          {status === 'pass' ? '✓ traced' : '✗ flagged'}
        </span>
      </div>
      {stepViols.map(v => (
        <div key={v.id} className="gb-vbar">
          <span className="gb-vbar-icon">▲</span>
          <b>{v.rule_id}</b>
          <span>— {v.message}</span>
          <span style={{ marginLeft: 'auto' }} className="gb-vbar-sev">{v.severity} · {v.regulatory_reference}</span>
        </div>
      ))}
    </>
  )
}

export default function TraceDetail() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [trace, setTrace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    tracesApi.get(token, id)
      .then(setTrace)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, id])

  async function exportPdf() {
    setExporting(true)
    try {
      const blob = await reportsApi.traceBlob(token, id)
      downloadBlob(blob, `compliance_${id.slice(0, 8)}.pdf`)
    } catch { /* ignore */ } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="gb-page"><div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="gb-spinner" /></div></div>
  if (error || !trace) return <div className="gb-page"><Card brackets><div className="gb-empty"><span className="gb-empty-icon">⊘</span><div className="gb-empty-title">Trace not found</div></div></Card></div>

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <button onClick={() => navigate('/app/traces')} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 12, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
            ← Trace Explorer
          </button>
          <h1 className="gb-page-title">{trace.task_description || 'Untitled trace'}</h1>
          <p className="gb-page-sub">
            {trace.agent_name} · {fullDateTime(trace.session_start)} · {trace.jurisdiction || '—'}
          </p>
        </div>
        <Button variant="primary" onClick={exportPdf} disabled={exporting}>
          {exporting ? 'Generating…' : '↧ Export PDF'}
        </Button>
      </div>

      {/* summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryChip label="Steps" value={trace.step_count} />
        <SummaryChip label="Critical" value={trace.by_severity.CRITICAL} danger={trace.by_severity.CRITICAL > 0} />
        <SummaryChip label="High" value={trace.by_severity.HIGH} />
        <SummaryChip label="Medium" value={trace.by_severity.MEDIUM} />
        <SummaryChip
          label="Outcome"
          value={trace.halted ? 'HALTED' : (trace.session_end ? 'completed' : 'running')}
          danger={trace.halted}
        />
        <SummaryChip
          label="Hash chain"
          value={trace.chain_valid ? '✓ valid' : '✗ broken'}
          danger={!trace.chain_valid}
          ok={trace.chain_valid}
        />
      </div>

      <Terminal title={`glassbox ▸ ${trace.trace_id.slice(0, 18)}…`}>
        {trace.steps.map((s, i) => (
          <StepLine key={s.step_id} idx={i + 1} step={s} violations={trace.violations} />
        ))}
        {trace.steps.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>No steps recorded.</div>
        )}
      </Terminal>

      <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
        SHA-256 hash chain · {trace.chain_valid
          ? <span style={{ color: 'var(--pass)' }}>integrity verified — trace is tamper-evident</span>
          : <span style={{ color: 'var(--critical)' }}>chain broken — possible tampering</span>}
      </div>
    </div>
  )
}

function SummaryChip({ label, value, danger, ok }) {
  const color = danger ? 'var(--critical)' : ok ? 'var(--pass)' : 'var(--ink)'
  return (
    <div style={{
      padding: '10px 16px', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)',
      background: 'var(--glass)', minWidth: 90,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 18, color, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  )
}
