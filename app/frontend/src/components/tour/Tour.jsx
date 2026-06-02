import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Tour.module.css'

const STEPS = [
  {
    center: true,
    title: 'Welcome to glassbox',
    body: 'A 30-second tour of your compliance runtime. You can replay it anytime from the ⌕ in the top bar.',
  },
  {
    selector: '[data-tour="overview"]',
    title: 'Overview',
    body: 'Your compliance posture at a glance — traces, violations, pending holds and LLM spend across every agent.',
  },
  {
    selector: '[data-tour="docs"]',
    title: 'Connect an agent',
    body: 'Start here. Grab an instrumentation key and copy a ready-made snippet for your framework — OpenAI, LangChain, LlamaIndex or multi-agent.',
  },
  {
    selector: '[data-tour="holds"]',
    title: 'Hold Inbox',
    body: 'When an agent hits a CRITICAL guardrail with a pause policy, it stops at the call boundary and waits here for your approval before continuing.',
  },
  {
    selector: '[data-tour="traces"]',
    title: 'Trace Explorer',
    body: 'Every agent run, streamed live. Each step is SHA-256 hash-chained, so the audit trail is tamper-evident.',
  },
  {
    selector: '[data-tour="violations"]',
    title: 'Violations',
    body: 'Compliance breaches across your fleet, each mapped to the exact regulation it answers to — GDPR, EU AI Act, MiFID II, Basel III.',
  },
  {
    selector: '[data-tour="fleets"]',
    title: 'Fleet topology',
    body: 'A live force-directed graph of your agents, the vendors they call, and where violations flow — including agent-to-agent delegation.',
  },
  {
    selector: '[data-tour="spend"]',
    title: 'Spend',
    body: 'LLM cost estimated from token counts, broken down by vendor, model and agent over any window.',
  },
  {
    selector: '[data-tour="rules"]',
    title: 'Rules',
    body: 'Toggle the eight built-in checks and choose what happens when one fires — block, pause for approval, or just log.',
  },
  {
    center: true,
    title: "You're all set",
    body: 'Connect your first agent and watch it light up across these screens.',
    cta: { label: 'Connect an agent →', to: '/app/docs' },
  },
]

const PAD = 6

export default function Tour({ open, onClose }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)

  useEffect(() => { if (open) setI(0) }, [open])

  const step = STEPS[i]

  useLayoutEffect(() => {
    if (!open || step?.center) { setRect(null); return }
    const el = document.querySelector(step.selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
  }, [open, i, step])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, i])

  if (!open) return null

  function finish() {
    localStorage.setItem('gb_tour_done', '1')
    onClose?.()
  }
  function next() { i < STEPS.length - 1 ? setI(i + 1) : finish() }
  function back() { if (i > 0) setI(i - 1) }

  // tooltip placement: beside the highlighted element, else centered
  let cardStyle
  if (rect) {
    const vw = window.innerWidth, vh = window.innerHeight
    const right = rect.left + rect.width + 18
    const left = right + 320 > vw ? rect.left - 338 : right
    cardStyle = { left: Math.max(16, left), top: Math.min(Math.max(16, rect.top), vh - 230) }
  }

  return (
    <div className={styles.root}>
      <div className={styles.blocker} onClick={(e) => e.stopPropagation()} />
      {rect && <div className={styles.spotlight} style={rect} />}

      <div className={`${styles.card} ${step.center ? styles.cardCenter : ''}`} style={cardStyle}>
        <div className={styles.dots}>
          {STEPS.map((_, k) => (
            <span key={k} className={`${styles.dot} ${k === i ? styles.dotActive : ''}`} />
          ))}
        </div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.actions}>
          <button className={styles.skip} onClick={finish}>Skip</button>
          <div className={styles.nav}>
            {i > 0 && <button className={styles.btn} onClick={back}>Back</button>}
            {step.cta ? (
              <button className={styles.btnPrimary}
                onClick={() => { finish(); navigate(step.cta.to) }}>
                {step.cta.label}
              </button>
            ) : (
              <button className={styles.btnPrimary} onClick={next}>
                {i === STEPS.length - 1 ? 'Done' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
