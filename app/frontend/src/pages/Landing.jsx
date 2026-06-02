import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LANDING_HTML } from '../landing/markup.js'
import { initLanding } from '../landing/initLanding.js'
import '../landing/landing.css'

export default function Landing() {
  const navigate = useNavigate()
  const ref = useRef(null)
  const initedRef = useRef(false)

  useEffect(() => {
    // run the marketing animations once (StrictMode double-invoke guard)
    if (!initedRef.current) {
      initedRef.current = true
      try { initLanding() } catch { /* non-fatal */ }
    }

    const root = ref.current
    if (!root) return
    const authed = !!localStorage.getItem('gb_token')
    const cleanups = []
    const wire = (el, to) => {
      if (!el) return
      const h = (e) => { e.preventDefault(); navigate(to) }
      el.addEventListener('click', h)
      cleanups.push(() => el.removeEventListener('click', h))
    }

    // nav pill → Get started / Open dashboard
    const pill = root.querySelector('.pill')
    if (pill) {
      pill.innerHTML = authed
        ? '<span>Open dashboard</span><span class="arr">→</span>'
        : '<span>Get started</span><span class="arr">→</span>'
      wire(pill, authed ? '/app' : '/signup')
    }

    // add a Sign in link to the nav (only when signed out; guard double-mount)
    const navLinks = root.querySelector('.nav-links')
    if (navLinks && !authed && !navLinks.querySelector('[data-gb-signin]')) {
      const a = document.createElement('a')
      a.href = '/login'
      a.textContent = 'Sign in'
      a.setAttribute('data-gb-signin', '1')
      navLinks.appendChild(a)
      wire(a, '/login')
    }

    // every primary CTA funnels into the product
    root.querySelectorAll('.btn-primary').forEach((b) => wire(b, authed ? '/app' : '/signup'))

    return () => cleanups.forEach((fn) => fn())
  }, [navigate])

  return <div className="gb-landing" ref={ref} dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
}
