import { apiFetch } from './client.js'

export const authApi = {
  signup: (email, password, orgName, jurisdiction) =>
    apiFetch('/auth/signup', { method: 'POST', body: { email, password, org_name: orgName, jurisdiction } }),

  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: { email, password } }),

  google: (credential) =>
    apiFetch('/auth/google', { method: 'POST', body: { credential } }),

  me: (token) =>
    apiFetch('/auth/me', { token }),
}

export const configApi = {
  get: () => apiFetch('/config'),
}
