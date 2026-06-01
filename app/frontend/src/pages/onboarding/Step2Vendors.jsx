import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { vendorsApi } from '../../api/org.js'
import StepShell from './StepShell.jsx'
import Button from '../../components/ui/Button.jsx'
import styles from './Onboarding.module.css'

const VENDORS = [
  { id: 'openai',    name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google',    name: 'Google Gemini' },
  { id: 'mistral',   name: 'Mistral' },
  { id: 'azure',     name: 'Azure OpenAI' },
  { id: 'other',     name: 'Other / self-hosted' },
]

export default function Step2Vendors({ data, patch, next, back }) {
  const { token } = useAuth()
  const [selected, setSelected] = useState(new Set(data.vendors))
  const [saving, setSaving] = useState(false)

  const toggle = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function handleNext() {
    setSaving(true)
    try {
      const vendors = [...selected]
      await Promise.all(vendors.map(v => vendorsApi.add(token, v).catch(() => {})))
      patch({ vendors })
      next()
    } finally {
      setSaving(false)
    }
  }

  return (
    <StepShell
      step={1}
      title="Connect your LLM vendors"
      sub="Which providers do your agents call? We use token counts from your traces to estimate spend per vendor."
      footer={
        <>
          <Button onClick={back}>← Back</Button>
          <Button variant="primary" onClick={handleNext} disabled={saving}>
            {saving ? 'Saving…' : (selected.size ? 'Continue →' : 'Skip for now →')}
          </Button>
        </>
      }
    >
      <div className={styles.vendorGrid}>
        {VENDORS.map(v => (
          <div
            key={v.id}
            className={`${styles.vendorCard} ${selected.has(v.id) ? styles.selected : ''}`}
            onClick={() => toggle(v.id)}
          >
            <span className={styles.vendorCheck}>✓</span>
            <span className={styles.vendorName}>{v.name}</span>
          </div>
        ))}
      </div>
    </StepShell>
  )
}
