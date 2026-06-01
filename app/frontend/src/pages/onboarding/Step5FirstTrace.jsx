import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { agentsApi } from '../../api/agents.js'
import StepShell from './StepShell.jsx'
import Button from '../../components/ui/Button.jsx'
import styles from './Onboarding.module.css'

export default function Step5FirstTrace({ data, back, finish }) {
  const { token } = useAuth()
  const agent = data.agent
  const key = agent?.instrumentation_key || 'gbx_...'
  const [arrived, setArrived] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  // Poll the agent — last_seen_at is set the moment the SDK first hits ingest
  useEffect(() => {
    if (!agent) return
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await agentsApi.get(token, agent.id)
        if (fresh.last_seen_at) {
          setArrived(true)
          clearInterval(pollRef.current)
        }
      } catch { /* keep polling */ }
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [agent, token])

  const snippet = `from glassbox import AuditSession, rules, GuardrailPolicy

policy = GuardrailPolicy(on_critical="pause")

with AuditSession(
    name="loan_decision_42",
    instrumentation_key="${key}",
    rules=[rules.PII(), rules.DTIRationale()],
    guardrails=policy,
) as audit:
    result = agent.run(application)`

  function copySnippet() {
    navigator.clipboard?.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <StepShell
      step={4}
      title="Go live"
      sub="Wrap any agent with an AuditSession using your key. The moment it runs, its trace streams here."
      footer={
        <>
          <Button onClick={back}>← Back</Button>
          <Button variant="primary" onClick={finish}>
            {arrived ? 'Enter dashboard →' : 'Skip to dashboard →'}
          </Button>
        </>
      }
    >
      <div className={styles.field}>
        <label className={styles.label}>Drop this into your agent</label>
        <pre className={styles.snippet}>{snippet}</pre>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button size="sm" onClick={copySnippet}>{copied ? '✓ Copied' : 'Copy snippet'}</Button>
        </div>
      </div>

      {arrived ? (
        <div className={styles.arrived}>
          <div className={styles.arrivedCheck}>✓</div>
          <div className={styles.waitingText} style={{ color: 'var(--pass)' }}>
            First trace received from <b>{agent?.name}</b>
          </div>
          <div className={styles.waitingSub}>You're all set — head to the dashboard.</div>
        </div>
      ) : (
        <div className={styles.waiting}>
          <div className={styles.pulseRing} />
          <div className={styles.waitingText}>Listening for your first trace…</div>
          <div className={styles.waitingSub}>This screen updates automatically when {agent?.name || 'your agent'} runs.</div>
        </div>
      )}
    </StepShell>
  )
}
