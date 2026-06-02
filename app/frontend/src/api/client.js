// Same-origin by default (backend serves the SPA). For a split deploy,
// set VITE_API_URL to the backend origin at build time.
export const API_ORIGIN = import.meta.env.VITE_API_URL || ''
const BASE = `${API_ORIGIN}/api`

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function apiFetch(path, { token, method = 'GET', body, ...opts } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    ...opts,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.detail || `HTTP ${res.status}`, res.status)
  }

  if (res.status === 204) return null
  return res.json()
}
