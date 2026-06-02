import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { spendApi } from '../api/spend.js'
import Card from '../components/ui/Card.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import PageHint from '../components/ui/PageHint.jsx'
import { money } from '../lib/format.js'

const DIMS = [
  { value: 'by_vendor', label: 'By vendor' },
  { value: 'by_model', label: 'By model' },
  { value: 'by_agent', label: 'By agent' },
]
const PERIODS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

function BarChart({ slices }) {
  if (!slices.length) return <div style={{ color: 'var(--ink-faint)', padding: 20 }}>No spend recorded.</div>
  const max = Math.max(...slices.map(s => s.cost), 0.0000001)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {slices.map(s => (
        <div key={s.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
            <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{s.key}</span>
            <span style={{ color: 'var(--ink-2)' }}>
              {money(s.cost)} <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>· {s.tokens.toLocaleString()} tok · {s.calls} calls</span>
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--line-2)', overflow: 'hidden' }}>
            <div style={{
              width: `${(s.cost / max) * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--blue), var(--cyan))', borderRadius: 4,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TimeSeries({ series }) {
  if (series.length < 2) return null
  const w = 100, h = 36
  const max = Math.max(...series.map(p => p.cost), 0.0000001)
  const step = w / Math.max(1, series.length - 1)
  const pts = series.map((p, i) => `${(i * step).toFixed(1)},${(h - (p.cost / max) * h).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
      <polyline points={pts} fill="none" stroke="var(--cyan)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function SpendDashboard() {
  const { token, workspace } = useAuth()
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [dim, setDim] = useState('by_vendor')

  useEffect(() => {
    if (!workspace) return
    spendApi.breakdown(token, workspace.id, days).then(setData).catch(() => {})
  }, [token, workspace, days])

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Spend</h1>
          <p className="gb-page-sub">LLM cost estimated from token counts across every agent and vendor</p>
          <PageHint>
            Cost is estimated from the token counts in your traces, priced per model. Switch the
            breakdown between vendor, model and agent, and change the window with the period
            toggle. The daily line shows spend over time.
          </PageHint>
        </div>
        <SegmentedControl options={PERIODS.map(p => ({ value: String(p.value), label: p.label }))}
          value={String(days)} onChange={v => setDays(Number(v))} size="sm" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label={`Spend · last ${days}d`} value={data ? money(data.total) : '—'} sub="estimated" />
        <StatCard label="Tokens" value={data ? data.total_tokens.toLocaleString() : '—'} sub="in + out" />
        <StatCard label="Calls" value={data ? data.total_calls : '—'} sub="LLM invocations" />
        <StatCard label="Avg / call" value={data && data.total_calls ? money(data.total / data.total_calls) : '—'} sub="cost per call" />
      </div>

      {data && data.series.length > 1 && (
        <Card brackets style={{ marginBottom: 16 }}>
          <div className="gb-section-label">Daily spend</div>
          <TimeSeries series={data.series} />
        </Card>
      )}

      <Card brackets>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div className="gb-section-label" style={{ margin: 0 }}>Breakdown</div>
          <SegmentedControl options={DIMS} value={dim} onChange={setDim} size="sm" />
        </div>
        {data ? <BarChart slices={data[dim]} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="gb-spinner" /></div>}
      </Card>
    </div>
  )
}
