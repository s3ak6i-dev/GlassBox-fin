import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { statsApi } from '../api/traces.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { relativeTime } from '../lib/format.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { token, user, org, workspace } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [lastVisit, setLastVisit] = useState(null)

  useEffect(() => {
    setLastVisit(localStorage.getItem('gb_last_home'))
    localStorage.setItem('gb_last_home', new Date().toISOString())
  }, [])

  useEffect(() => {
    if (!workspace) return
    statsApi.overview(token, workspace.id).then(setStats).catch(() => {})
  }, [token, workspace])

  const firstName = (user?.email || 'there').split('@')[0].split(/[.\-_]/)[0]
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const holds = stats?.holds_pending ?? 0
  const crit = stats?.critical_violations ?? 0
  const agents = stats?.agents_total ?? 0

  let status
  if (!stats) status = 'Loading your workspace…'
  else if (agents === 0) status = "Let's connect your first agent."
  else if (holds > 0) status = `${holds} hold${holds > 1 ? 's' : ''} ${holds > 1 ? 'are' : 'is'} waiting for your approval.`
  else if (crit > 0) status = `${crit} critical violation${crit > 1 ? 's' : ''} need${crit > 1 ? '' : 's'} a look.`
  else status = "Everything's quiet — no action needed."

  const go = (p) => () => navigate(p)

  return (
    <div className="gb-page" style={{ maxWidth: 1100 }}>
      <div style={{ margin: '12px 0 32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700,
          letterSpacing: '-0.02em', color: '#fff', margin: 0,
        }}>
          {greeting()}, <span className="gb-grad-text">{name}</span>.
        </h1>
        <p style={{ fontFamily: 'var(--font-prose)', fontSize: 18, color: 'var(--ink-2)', margin: '8px 0 0' }}>
          {status}
        </p>
        {lastVisit && (
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '6px 0 0', fontFamily: 'var(--font-mono)' }}>
            Last here {relativeTime(lastVisit)}
          </p>
        )}
      </div>

      {/* Needs you */}
      {(holds > 0 || crit > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
          {holds > 0 && (
            <NeedsCard
              color="var(--warn)" icon="⏸"
              title={`${holds} hold${holds > 1 ? 's' : ''} awaiting approval`}
              body="An agent is paused at a guardrail until you decide."
              cta="Open Hold Inbox →" onClick={go('/app/holds')}
            />
          )}
          {crit > 0 && (
            <NeedsCard
              color="var(--critical)" icon="▲"
              title={`${crit} critical violation${crit > 1 ? 's' : ''}`}
              body="Compliance breaches flagged across your fleet."
              cta="Review violations →" onClick={go('/app/violations')}
            />
          )}
        </div>
      )}

      {/* First-agent nudge */}
      {agents === 0 && (
        <Card brackets style={{ marginBottom: 28 }}>
          <div className="gb-section-label">Get started</div>
          <p style={{ fontFamily: 'var(--font-prose)', fontSize: 15, color: 'var(--ink-2)', marginTop: 0 }}>
            You haven't connected an agent yet. Grab an instrumentation key and wrap any
            LLM agent in two lines — its traces, violations and guardrails stream in here live.
          </p>
          <Button variant="primary" onClick={go('/app/docs')}>Connect an agent →</Button>
        </Card>
      )}

      {/* Quick actions */}
      <div className="gb-section-label">Jump in</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <QuickAction icon="◈" label="Overview" desc="Operational dashboard" onClick={go('/app/overview')} />
        <QuickAction icon="≡" label="Trace Explorer" desc="Every agent run, live" onClick={go('/app/traces')} />
        <QuickAction icon="⬡" label="Fleet" desc="Topology graph" onClick={go('/app/fleets')} />
        <QuickAction icon="↧" label="Reports" desc="Audit-ready PDFs" onClick={go('/app/reports')} />
      </div>
    </div>
  )
}

function NeedsCard({ color, icon, title, body, cta, onClick }) {
  return (
    <div style={{
      border: `1px solid ${color}`, borderRadius: 'var(--r)', padding: 20,
      background: 'var(--glass)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color, fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: '#fff' }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px', fontFamily: 'var(--font-prose)' }}>{body}</p>
      <button onClick={onClick} style={{
        background: 'none', border: 'none', color, cursor: 'pointer',
        fontFamily: 'var(--font-mono)', fontSize: 13, padding: 0,
      }}>{cta}</button>
    </div>
  )
}

function QuickAction({ icon, label, desc, onClick }) {
  return (
    <div onClick={onClick} style={{
      cursor: 'pointer', padding: 18, border: '1px solid var(--line-2)',
      borderRadius: 'var(--r)', background: 'var(--glass)', transition: 'border-color 0.18s, transform 0.18s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--cyan-rgb),0.5)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ fontSize: 18, color: 'var(--cyan)', marginBottom: 8 }}>{icon}</div>
      <div style={{ color: 'var(--ink)', fontSize: 14, marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{desc}</div>
    </div>
  )
}
