import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, configApi } from '../../api/auth.js'
import { useAuth } from '../../hooks/useAuth.js'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    let s = document.querySelector(`script[src="${GSI_SRC}"]`)
    if (s) { s.addEventListener('load', () => resolve()); return }
    s = document.createElement('script')
    s.src = GSI_SRC; s.async = true; s.defer = true
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// Renders the official "Sign in with Google" button — but only if the backend
// has a Google client ID configured. Otherwise renders nothing.
export default function GoogleButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { google_client_id } = await configApi.get()
        if (!google_client_id || cancelled) return
        await loadGsi()
        if (cancelled || !ref.current) return

        window.google.accounts.id.initialize({
          client_id: google_client_id,
          callback: async ({ credential }) => {
            try {
              const { access_token } = await authApi.google(credential)
              login(access_token)
              navigate('/app')
            } catch (e) {
              setError(e.message || 'Google sign-in failed')
            }
          },
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'filled_black', size: 'large', shape: 'pill',
          text: 'continue_with', width: 320,
        })
      } catch {
        /* GSI unavailable — silently skip, email login still works */
      }
    })()
    return () => { cancelled = true }
  }, [login, navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div ref={ref} />
      {error && <div style={{ color: 'var(--critical)', fontSize: 12 }}>{error}</div>}
    </div>
  )
}
