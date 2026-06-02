import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { rulesApi } from '../api/org.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'

const ACTIONS = [
  { value: 'raise', label: 'Block' },
  { value: 'pause', label: 'Pause' },
  { value: 'log', label: 'Log' },
]

const CUSTOM_RULE_EXAMPLE = `from glassbox.rules import rule, Violation, Severity, Trigger

@rule(
    id="NO_HUMAN_REVIEW_FLAG",
    severity=Severity.HIGH,
    trigger=Trigger.POST_CALL,
    description="High-value decision lacks human review flag",
    regulatory_reference="Internal policy INV-2024-003",
    remediation="Add human_review_required to decision output",
)
def no_human_review_flag(step, trace):
    if step.step_type == "decision" and "human_review_required" not in (step.output or ""):
        return [Violation.from_step(step, no_human_review_flag)]
    return []`

export default function RuleManager() {
  const { token, workspace } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [config, setConfig] = useState({})
  const [activeRuleset, setActiveRuleset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    if (!workspace) return
    Promise.all([
      rulesApi.catalog(token),
      rulesApi.listRulesets(token, workspace.id),
    ]).then(([cat, rulesets]) => {
      setCatalog(cat)
      const active = rulesets.filter(r => r.is_active).sort((a, b) => b.version - a.version)[0]
      setActiveRuleset(active)
      const cfg = {}
      cat.forEach(r => {
        const existing = active?.rules_config?.[r.id]
        cfg[r.id] = existing || { enabled: true, action: r.default_action }
      })
      setConfig(cfg)
    }).finally(() => setLoading(false))
  }, [token, workspace])

  const toggle = (id) => setConfig(c => ({ ...c, [id]: { ...c[id], enabled: !c[id].enabled } }))
  const setAction = (id, action) => setConfig(c => ({ ...c, [id]: { ...c[id], action } }))

  const dirty = useMemo(() => {
    if (!activeRuleset) return true
    return JSON.stringify(config) !== JSON.stringify(
      Object.fromEntries(catalog.map(r => [r.id, activeRuleset.rules_config?.[r.id] || { enabled: true, action: r.default_action }]))
    )
  }, [config, activeRuleset, catalog])

  async function save() {
    setSaving(true)
    try {
      const rs = await rulesApi.createRuleset(token, {
        name: 'Default ruleset',
        rules_config: config,
        workspace_id: workspace.id,
      })
      setActiveRuleset(rs)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const activeCount = Object.values(config).filter(c => c.enabled).length

  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Rules</h1>
          <p className="gb-page-sub">
            {activeCount} of {catalog.length} rules active
            {activeRuleset ? ` · ruleset v${activeRuleset.version}` : ''}
          </p>
        </div>
        <Button variant="primary" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : dirty ? 'Save new version' : 'Saved'}
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="gb-spinner" /></div>
      ) : (
        <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
          <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
            <div className="gb-table-row gb-table-head" style={{ gridTemplateColumns: '50px 1fr 200px 160px' }}>
              <div className="gb-table-cell" />
              <div className="gb-table-cell">Rule</div>
              <div className="gb-table-cell">Regulation</div>
              <div className="gb-table-cell">On violation</div>
            </div>
            {catalog.map(rule => {
              const cfg = config[rule.id] || { enabled: true, action: rule.default_action }
              return (
                <div key={rule.id} className="gb-table-row" style={{ gridTemplateColumns: '50px 1fr 200px 160px', cursor: 'default', opacity: cfg.enabled ? 1 : 0.5 }}>
                  <div
                    className={`gb-toggle ${cfg.enabled ? 'on' : ''}`}
                    onClick={() => toggle(rule.id)}
                    role="switch" aria-checked={cfg.enabled}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{rule.id}</span>
                      <SeverityBadge severity={rule.severity} />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{rule.description}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{rule.regulatory_reference}</div>
                  <div>
                    <SegmentedControl size="sm" options={ACTIONS} value={cfg.action} onChange={a => setAction(rule.id, a)} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="gb-section-label" style={{ margin: 0 }}>Custom rules</div>
          <Button size="sm" onClick={() => setShowCustom(s => !s)}>{showCustom ? 'Hide' : 'Show'} example</Button>
        </div>
        {showCustom && (
          <Card brackets>
            <p style={{ fontFamily: 'var(--font-prose)', fontSize: 14, color: 'var(--ink-2)', marginTop: 0 }}>
              Write custom rules in plain Python with the <code>@rule</code> decorator and register them
              alongside the built-ins. Author them in your codebase — they run inside your own process,
              so no agent data leaves your infrastructure.
            </p>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)',
              background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)', borderRadius: 8,
              padding: 16, overflowX: 'auto', margin: 0,
            }}>{CUSTOM_RULE_EXAMPLE}</pre>
          </Card>
        )}
      </div>
    </div>
  )
}
