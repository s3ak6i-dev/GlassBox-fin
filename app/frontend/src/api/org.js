import { apiFetch } from './client.js'

export const orgApi = {
  get:    (token)       => apiFetch('/org', { token }),
  update: (token, data) => apiFetch('/org', { token, method: 'PUT', body: data }),
  members: (token)      => apiFetch('/org/members', { token }),
  invite: (token, email, role) =>
    apiFetch('/org/invite', { token, method: 'POST', body: { email, role } }),
}

export const vendorsApi = {
  list: (token)               => apiFetch('/vendors', { token }),
  add:  (token, vendor, pricing = {}) =>
    apiFetch('/vendors', { token, method: 'POST', body: { vendor, model_pricing: pricing } }),
}

export const rulesApi = {
  catalog:       (token) => apiFetch('/rules/catalog', { token }),
  listRulesets:  (token, workspaceId) => apiFetch(`/rulesets?workspace_id=${workspaceId}`, { token }),
  createRuleset: (token, data) => apiFetch('/rulesets', { token, method: 'POST', body: data }),
}
