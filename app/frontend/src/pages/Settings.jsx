import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { orgApi, vendorsApi } from '../api/org.js'
import { agentsApi } from '../api/agents.js'
import { statsApi } from '../api/traces.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { maskKey, relativeTime } from '../lib/format.js'

const TABS = [
  { value: 'org', label: 'Organization' },
  { value: 'team', label: 'Team' },
  { value: 'keys', label: 'API Keys' },
  { value: 'vendors', label: 'Vendors' },
]

const VENDORS = ['openai', 'anthropic', 'google', 'mistral', 'azure']
const JURIS = ['EU', 'UK', 'US']

export default function Settings() {
  const [tab, setTab] = useState('org')
  return (
    <div className="gb-page" style={{ maxWidth: 880 }}>
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Settings</h1>
          <p className="gb-page-sub">Organization, team, instrumentation keys, and vendors</p>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === 'org' && <OrgTab />}
      {tab === 'team' && <TeamTab />}
      {tab === 'keys' && <KeysTab />}
      {tab === 'vendors' && <VendorsTab />}
    </div>
  )
}

function OrgTab() {
  const { token, org, refreshOrg } = useAuth()
  const [name, setName] = useState(org?.name || '')
  const [industry, setIndustry] = useState(org?.industry || '')
  const [jurisdiction, setJurisdiction] = useState(org?.jurisdiction || 'EU')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await orgApi.update(token, { name, industry, jurisdiction })
      await refreshOrg()
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  return (
    <Card brackets>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
        <Field label="Organization name"><Input value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Industry"><Input value={industry} onChange={e => setIndustry(e.target.value)} /></Field>
        <Field label="Jurisdiction">
          <select className="gb-input" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
            {JURIS.map(j => <option key={j}>{j}</option>)}
          </select>
        </Field>
        <div><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}</Button></div>
      </div>
    </Card>
  )
}

function TeamTab() {
  const { token, user } = useAuth()
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('developer')

  const load = () => orgApi.members(token).then(setMembers).catch(() => {})
  useEffect(() => { load() }, [token])

  async function invite() {
    if (!email.trim()) return
    await orgApi.invite(token, email.trim(), role).catch(() => {})
    setEmail(''); load()
  }

  return (
    <>
      <Card brackets style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}><Input placeholder="teammate@company.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <select className="gb-input" style={{ width: 140 }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="developer">Developer</option>
          <option value="reviewer">Compliance Reviewer</option>
          <option value="admin">Admin</option>
        </select>
        <Button variant="primary" onClick={invite} disabled={!email.trim()}>Invite</Button>
      </Card>
      <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
        <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
          {members.map(m => (
            <div key={m.id} className="gb-table-row" style={{ gridTemplateColumns: '1fr 160px', cursor: 'default' }}>
              <div style={{ color: 'var(--ink)' }}>{m.email}{m.id === user?.id && <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}> · you</span>}</div>
              <div style={{ color: 'var(--cyan)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{m.role}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function KeysTab() {
  const { token, workspace } = useAuth()
  const [agents, setAgents] = useState([])
  const [revealed, setRevealed] = useState({})

  useEffect(() => {
    if (!workspace) return
    statsApi.agents(token, workspace.id).then(setAgents).catch(() => {})
  }, [token, workspace])

  return (
    <Card brackets style={{ padding: 0, overflow: 'hidden' }}>
      <div className="gb-table" style={{ border: 'none', borderRadius: 0 }}>
        <div className="gb-table-row gb-table-head" style={{ gridTemplateColumns: '1fr 1.4fr 100px' }}>
          <div className="gb-table-cell">Agent</div>
          <div className="gb-table-cell">Instrumentation key</div>
          <div className="gb-table-cell">Last seen</div>
        </div>
        {agents.map(a => (
          <div key={a.id} className="gb-table-row" style={{ gridTemplateColumns: '1fr 1.4fr 100px', cursor: 'default' }}>
            <div style={{ color: 'var(--ink)' }}>{a.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>
                {revealed[a.id] ? a.instrumentation_key : maskKey(a.instrumentation_key)}
              </span>
              <button onClick={() => setRevealed(r => ({ ...r, [a.id]: !r[a.id] }))}
                style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 11 }}>
                {revealed[a.id] ? 'hide' : 'reveal'}
              </button>
              <button onClick={() => navigator.clipboard?.writeText(a.instrumentation_key)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 11 }}>copy</button>
            </div>
            <div style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{relativeTime(a.last_seen_at)}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function VendorsTab() {
  const { token } = useAuth()
  const [connected, setConnected] = useState([])

  const load = () => vendorsApi.list(token).then(v => setConnected(v.map(x => x.vendor))).catch(() => {})
  useEffect(() => { load() }, [token])

  async function toggle(v) {
    if (connected.includes(v)) return  // removal not supported in v0.1
    await vendorsApi.add(token, v).catch(() => {})
    load()
  }

  return (
    <Card brackets>
      <p style={{ fontFamily: 'var(--font-prose)', fontSize: 14, color: 'var(--ink-3)', marginTop: 0 }}>
        Vendors your agents call. Used to attribute spend from token counts in your traces.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {VENDORS.map(v => {
          const on = connected.includes(v)
          return (
            <div key={v} onClick={() => toggle(v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: on ? 'default' : 'pointer',
                border: `1px solid ${on ? 'rgba(var(--cyan-rgb),0.5)' : 'var(--line-2)'}`,
                borderRadius: 'var(--r-sm)', background: on ? 'var(--cyan-soft)' : 'var(--glass)',
              }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                background: on ? 'var(--grad)' : 'transparent', color: on ? '#04121a' : 'transparent',
                border: on ? 'none' : '1px solid var(--line-2)',
              }}>✓</span>
              <span style={{ fontSize: 13, color: on ? 'var(--cyan)' : 'var(--ink-2)', textTransform: 'capitalize' }}>{v}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</label>
      {children}
    </div>
  )
}
