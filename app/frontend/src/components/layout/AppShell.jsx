import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import Tour from '../tour/Tour.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useSSE } from '../../hooks/useSSE.js'
import { holdsApi } from '../../api/holds.js'
import styles from './AppShell.module.css'

export default function AppShell() {
  const { token, workspace } = useAuth()
  const [holdCount, setHoldCount] = useState(0)
  const [tourOpen, setTourOpen] = useState(false)

  const refreshHolds = useCallback(() => {
    if (!workspace) return
    holdsApi.list(token, workspace.id, 'pending')
      .then(h => setHoldCount(h.length))
      .catch(() => {})
  }, [token, workspace])

  useEffect(() => { refreshHolds() }, [refreshHolds])

  // Auto-start the tour once, on first visit to the dashboard
  useEffect(() => {
    if (!localStorage.getItem('gb_tour_done')) {
      const t = setTimeout(() => setTourOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  // Keep the badge live across the whole app
  useSSE(workspace ? `/traces/stream?workspace_id=${workspace.id}` : null, {
    enabled: !!workspace,
    onEvent: (e) => { if (e.type === 'hold_created') refreshHolds() },
  })

  return (
    <div className={`${styles.shell} gb-backdrop`}>
      <Sidebar holdCount={holdCount} />
      <div className={styles.main}>
        <Topbar onHelp={() => setTourOpen(true)} />
        <main className={styles.content}>
          <Outlet context={{ refreshHolds }} />
        </main>
      </div>
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  )
}
