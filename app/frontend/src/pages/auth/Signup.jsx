import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth.js'
import { useAuth } from '../../hooks/useAuth.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import styles from './Auth.module.css'

const JURISDICTIONS = ['EU', 'UK', 'US']

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '', orgName: '', jurisdiction: 'EU' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await authApi.signup(form.email, form.password, form.orgName, form.jurisdiction)
      login(access_token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.page} gb-backdrop`}>
      <div className={styles.card}>
        <span className="gb-bracket gb-bracket-tl" />
        <span className="gb-bracket gb-bracket-br" />

        <div className={styles.brand}>
          <b>glass</b>box<span style={{ color: 'var(--cyan)' }}>·</span>fin
        </div>

        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.sub}>Start monitoring your financial agents</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Organization name</label>
            <Input placeholder="Acme Financial" value={form.orgName} onChange={e => set('orgName', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Jurisdiction</label>
            <select
              className="gb-input"
              value={form.jurisdiction}
              onChange={e => set('jurisdiction', e.target.value)}
            >
              {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <Input type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" variant="primary" size="lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account →'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login" style={{ color: 'var(--cyan)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
