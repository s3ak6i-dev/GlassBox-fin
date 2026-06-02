import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth.js'
import { useAuth } from '../../hooks/useAuth.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import GoogleButton from '../../components/auth/GoogleButton.jsx'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await authApi.login(email, password)
      login(access_token)
      navigate('/app')
    } catch (err) {
      setError(err.message || 'Login failed')
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

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your compliance dashboard</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" variant="primary" size="lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </Button>
        </form>

        <div className={styles.divider}>or</div>
        <GoogleButton />

        <p className={styles.footer}>
          No account? <Link to="/signup" style={{ color: 'var(--cyan)' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
