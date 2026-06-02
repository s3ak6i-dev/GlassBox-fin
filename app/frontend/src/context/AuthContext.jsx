import { createContext, useCallback, useEffect, useState } from 'react'
import { authApi } from '../api/auth.js'
import { orgApi } from '../api/org.js'
import { workspacesApi } from '../api/agents.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(() => localStorage.getItem('gb_token'))
  const [user, setUser]       = useState(null)
  const [org, setOrg]         = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('gb_token'))

  const bootstrap = useCallback(async (tk) => {
    const [me, orgData, workspaces] = await Promise.all([
      authApi.me(tk),
      orgApi.get(tk),
      workspacesApi.list(tk),
    ])
    setUser(me)
    setOrg(orgData)
    setWorkspace(workspaces[0] || null)
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    bootstrap(token)
      .catch(() => { localStorage.removeItem('gb_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token, bootstrap])

  const login = useCallback((newToken) => {
    localStorage.setItem('gb_token', newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gb_token')
    setToken(null)
    setUser(null)
    setOrg(null)
    setWorkspace(null)
  }, [])

  const refreshOrg = useCallback(async () => {
    if (!token) return
    const orgData = await orgApi.get(token)
    setOrg(orgData)
    return orgData
  }, [token])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const me = await authApi.me(token)
    setUser(me)
    return me
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, org, workspace, loading, login, logout, refreshOrg, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
