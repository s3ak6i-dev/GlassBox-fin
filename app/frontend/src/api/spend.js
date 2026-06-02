import { apiFetch, API_ORIGIN } from './client.js'

export const spendApi = {
  breakdown: (token, workspaceId, days = 30) =>
    apiFetch(`/spend/breakdown?workspace_id=${workspaceId}&days=${days}`, { token }),
}

export const reportsApi = {
  // returns a Blob for download
  generatePeriod: async (token, workspaceId, days) => {
    const res = await fetch(`${API_ORIGIN}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ workspace_id: workspaceId, days }),
    })
    if (!res.ok) throw new Error('Report generation failed')
    return res.blob()
  },
  traceUrl: (traceId) => `${API_ORIGIN}/api/reports/trace/${traceId}`,
  traceBlob: async (token, traceId) => {
    const res = await fetch(`${API_ORIGIN}/api/reports/trace/${traceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Report generation failed')
    return res.blob()
  },
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
