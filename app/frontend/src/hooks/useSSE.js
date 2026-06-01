import { useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth.js'

export function useSSE(path, { enabled = true } = {}) {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)

  useEffect(() => {
    if (!enabled || !token || !path) return

    const url = `/api${path}?token=${token}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setEvents(prev => [...prev.slice(-99), data])
      } catch { /* ignore malformed */ }
    }
    es.onerror = () => setConnected(false)

    return () => {
      es.close()
      setConnected(false)
    }
  }, [path, token, enabled])

  const clear = () => setEvents([])
  return { events, connected, clear }
}
