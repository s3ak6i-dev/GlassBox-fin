import { createContext, useCallback, useEffect, useState } from 'react'
import { authApi } from '../api/auth.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('gb_token'))
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('gb_token'))

  useEffect(() => {
    if (!token) { setLoading(false); return }
    authApi.me(token)
      .then(setUser)
      .catch(() => { localStorage.removeItem('gb_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback((newToken) => {
    localStorage.setItem('gb_token', newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gb_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
