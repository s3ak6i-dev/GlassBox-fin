import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { orgApi } from '../../api/org.js'
import StepShell from './StepShell.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import styles from './Onboarding.module.css'

const JURISDICTIONS = ['EU', 'UK', 'US']
const INDUSTRIES = ['Financial Services', 'Banking', 'Insurance', 'Fintech', 'Investment / Wealth', 'Other']

export default function Step1Org({ next }) {
  const { token, org, refreshOrg } = useAuth()
  const [industry, setIndustry] = useState(org?.industry || 'Financial Services')
  const [jurisdiction, setJurisdiction] = useState(org?.jurisdiction || 'EU')
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    try {
      await orgApi.update(token, { industry, jurisdiction })
      await refreshOrg()
      next()
    } finally {
      setSaving(false)
    }
  }

  return (
    <StepShell
      step={0}
      title={`Welcome, ${org?.name || 'there'}`}
      sub="Confirm your organisation details. Your jurisdiction sets the default rule pack and the regulations each rule answers to."
      footer={
        <>
          <span />
          <Button variant="primary" onClick={handleNext} disabled={saving}>
            {saving ? 'Saving…' : 'Continue →'}
          </Button>
        </>
      }
    >
      <div className={styles.field}>
        <label className={styles.label}>Industry</label>
        <select className="gb-input" value={industry} onChange={e => setIndustry(e.target.value)}>
          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Jurisdiction</label>
        <select className="gb-input" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
          {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
        </select>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
          EU → GDPR · EU AI Act · MiFID II · EBA · Basel III
        </span>
      </div>
    </StepShell>
  )
}
