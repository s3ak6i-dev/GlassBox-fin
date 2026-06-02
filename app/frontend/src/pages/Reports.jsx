import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { reportsApi, downloadBlob } from '../api/spend.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'

const PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

export default function Reports() {
  const { token, workspace, org } = useAuth()
  const [days, setDays] = useState(30)
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setGenerating(true); setError(''); setDone(false)
    try {
      const blob = await reportsApi.generatePeriod(token, workspace.id, days)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, `glassbox_compliance_${stamp}.pdf`)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch (e) {
      setError(e.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="gb-page" style={{ maxWidth: 760 }}>
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Compliance Reports</h1>
          <p className="gb-page-sub">Audit-ready PDF summaries for regulators and internal compliance teams</p>
        </div>
      </div>

      <Card brackets>
        <div className="gb-section-label">Period summary report</div>
        <p style={{ fontFamily: 'var(--font-prose)', fontSize: 15, color: 'var(--ink-2)', marginTop: 0, lineHeight: 1.6 }}>
          Generates a branded PDF for <strong style={{ color: 'var(--ink)' }}>{org?.name}</strong> covering all agent
          sessions, violations grouped by severity and regulation, halted executions, the agent inventory, and a note
          on hash-chain verifiability — the document you hand to an auditor.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
          <SegmentedControl options={PERIODS.map(p => ({ value: String(p.value), label: p.label }))}
            value={String(days)} onChange={v => setDays(Number(v))} />
          <Button variant="primary" onClick={generate} disabled={generating}>
            {generating ? 'Generating…' : done ? '✓ Downloaded' : '↧ Generate report'}
          </Button>
        </div>
        {error && <div style={{ color: 'var(--critical)', fontSize: 12.5, marginTop: 12 }}>{error}</div>}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Card brackets>
          <div className="gb-section-label">Per-trace reports</div>
          <p style={{ fontFamily: 'var(--font-prose)', fontSize: 14, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
            Need the receipt for a single decision? Open any trace in the <strong style={{ color: 'var(--ink-2)' }}>Trace
            Explorer</strong> and hit <strong style={{ color: 'var(--ink-2)' }}>Export PDF</strong> — it reconstructs the
            full step-by-step record (with the hash-chain attestation) using the same glassbox library that produced it.
          </p>
        </Card>
      </div>
    </div>
  )
}
