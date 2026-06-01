import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { rulesApi } from '../../api/org.js'
import StepShell from './StepShell.jsx'
import Button from '../../components/ui/Button.jsx'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'
import SegmentedControl from '../../components/ui/SegmentedControl.jsx'
import styles from './Onboarding.module.css'

const ACTIONS = [
  { value: 'raise', label: 'Block' },
  { value: 'pause', label: 'Pause' },
  { value: 'log',   label: 'Log' },
]

export default function Step4Ruleset({ data, patch, next, back }) {
  const { token, workspace } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [config, setConfig] = useState({})   // ruleId -> { enabled, action }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    rulesApi.catalog(token).then(items => {
      setCatalog(items)
      const initial = {}
      items.forEach(r => { initial[r.id] = { enabled: true, action: r.default_action } })
      setConfig(initial)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  const toggle = (id) => setConfig(c => ({ ...c, [id]: { ...c[id], enabled: !c[id].enabled } }))
  const setAction = (id, action) => setConfig(c => ({ ...c, [id]: { ...c[id], action } }))

  async function handleNext() {
    setSaving(true)
    try {
      const ruleset = await rulesApi.createRuleset(token, {
        name: 'Default ruleset',
        rules_config: config,
        workspace_id: workspace.id,
      })
      patch({ ruleset })
      next()
    } catch {
      next()  // non-blocking — proceed even if ruleset save fails
    } finally {
      setSaving(false)
    }
  }

  const activeCount = Object.values(config).filter(c => c.enabled).length

  return (
    <StepShell
      step={3}
      title="Configure your ruleset"
      sub="These eight checks ship in the box, pre-set for your jurisdiction. Toggle any off, or change what happens when one fires — block the call, pause for approval, or just log it."
      footer={
        <>
          <Button onClick={back}>← Back</Button>
          <Button variant="primary" onClick={handleNext} disabled={saving || loading}>
            {saving ? 'Saving…' : `Continue with ${activeCount} rules →`}
          </Button>
        </>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <div className="gb-spinner" />
        </div>
      ) : (
        <div className={styles.ruleList}>
          {catalog.map(rule => {
            const cfg = config[rule.id] || { enabled: true, action: rule.default_action }
            return (
              <div key={rule.id} className={styles.ruleRow} style={{ opacity: cfg.enabled ? 1 : 0.45 }}>
                <div
                  className={`gb-toggle ${cfg.enabled ? 'on' : ''}`}
                  onClick={() => toggle(rule.id)}
                  role="switch"
                  aria-checked={cfg.enabled}
                />
                <div className={styles.ruleInfo}>
                  <div className={styles.ruleName}>
                    {rule.id} <SeverityBadge severity={rule.severity} />
                  </div>
                  <div className={styles.ruleDesc}>{rule.regulatory_reference}</div>
                </div>
                <div className={styles.ruleAction}>
                  <SegmentedControl
                    size="sm"
                    options={ACTIONS}
                    value={cfg.action}
                    onChange={(a) => setAction(rule.id, a)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </StepShell>
  )
}
