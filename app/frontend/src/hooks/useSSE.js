import { useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth.js'
import { API_ORIGIN } from '../api/client.js'

// path may already contain a query string (e.g. ?workspace_id=...).
// token is appended with the correct separator since EventSource can't set headers.
export function useSSE(path, { enabled = true, onEvent } = {}) {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  useEffect(() => {
    if (!enabled || !token || !path) return

    const sep = path.includes('?') ? '&' : '?'
    const url = `${API_ORIGIN}/api${path}${sep}token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setEvents(prev => [...prev.slice(-99), data])
        cbRef.current?.(data)
      } catch { /* ignore comments / malformed */ }
    }
    es.onerror = () => setConnected(false)

    return () => { es.close(); setConnected(false) }
  }, [path, token, enabled])

  return { events, connected, clear: () => setEvents([]) }
}
