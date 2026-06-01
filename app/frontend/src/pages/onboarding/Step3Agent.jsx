import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { agentsApi, fleetsApi } from '../../api/agents.js'
import StepShell from './StepShell.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import styles from './Onboarding.module.css'

export default function Step3Agent({ data, patch, next, back }) {
  const { token, workspace } = useAuth()
  const [name, setName] = useState(data.agent?.name || '')
  const [description, setDescription] = useState('')
  const [fleetName, setFleetName] = useState('')
  const [agent, setAgent] = useState(data.agent || null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!name.trim() || !workspace) return
    setBusy(true); setError('')
    try {
      let fleetId = null
      if (fleetName.trim()) {
        const fleet = await fleetsApi.create(token, workspace.id, { name: fleetName.trim(), description: '' })
        fleetId = fleet.id
      }
      const created = await agentsApi.create(token, workspace.id, {
        name: name.trim(), description: description.trim(), fleet_id: fleetId,
      })
      setAgent(created)
      patch({ agent: created })
    } catch (e) {
      setError(e.message || 'Failed to register agent')
    } finally {
      setBusy(false)
    }
  }

  function copyKey() {
    navigator.clipboard?.writeText(agent.instrumentation_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <StepShell
      step={2}
      title="Register your first agent"
      sub="An agent is one LLM workflow you want under compliance watch. Registering it mints an instrumentation key that routes its traces to this dashboard."
      footer={
        <>
          <Button onClick={back}>← Back</Button>
          <Button variant="primary" onClick={next} disabled={!agent}>
            Continue →
          </Button>
        </>
      }
    >
      {!agent ? (
        <>
          <div className={styles.field}>
            <label className={styles.label}>Agent name</label>
            <Input placeholder="loan-assessment-eu" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description <span style={{ textTransform: 'none', color: 'var(--ink-faint)' }}>(optional)</span></label>
            <Input placeholder="Assesses EU retail loan applications" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Fleet <span style={{ textTransform: 'none', color: 'var(--ink-faint)' }}>(optional — groups agents under one ruleset)</span></label>
            <Input placeholder="credit-assessment" value={fleetName} onChange={e => setFleetName(e.target.value)} />
          </div>
          {error && <div style={{ color: 'var(--critical)', fontSize: 12.5 }}>{error}</div>}
          <Button variant="primary" onClick={generate} disabled={busy || !name.trim()}>
            {busy ? 'Registering…' : 'Generate instrumentation key'}
          </Button>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label className={styles.label}>Agent</label>
            <div style={{ fontSize: 14, color: 'var(--ink)' }}>{agent.name}</div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Instrumentation key</label>
            <div className={styles.keyBox}>
              {agent.instrumentation_key}
              <Button size="sm" onClick={copyKey}>{copied ? '✓ Copied' : 'Copy'}</Button>
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              Pass this to <code>AuditSession(instrumentation_key=...)</code>. Keep it secret — it authorises trace ingest.
            </span>
          </div>
        </>
      )}
    </StepShell>
  )
}
