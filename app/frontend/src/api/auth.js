import { apiFetch } from './client.js'

export const authApi = {
  signup: (email, password, orgName, jurisdiction) =>
    apiFetch('/auth/signup', { method: 'POST', body: { email, password, org_name: orgName, jurisdiction } }),

  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: { email, password } }),

  me: (token) =>
    apiFetch('/auth/me', { token }),
}
