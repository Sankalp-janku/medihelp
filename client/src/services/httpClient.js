import { config } from '../config/env.js';

export class HttpError extends Error {
  constructor(message, code, details) { super(message); this.code = code; this.details = details; }
}
const TOKEN_KEY = 'disha_token';
// sessionStorage keeps each browser tab's login separate, so a doctor logging in in one tab
// can never replace a user's session in another tab. A refresh in the same tab keeps the session.
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, raw } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(config.apiUrl + path, { method,
      headers: { ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}), ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}) },
      body: body && !isForm ? JSON.stringify(body) : body });
  } catch { throw new HttpError('Cannot reach the server. Check your connection.', 'NETWORK'); }
  if (res.status === 401 && tokenStore.get()) { tokenStore.clear(); onUnauthorized(); } // expired or invalid token
  if (raw && res.ok) return res.blob();
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(json.error?.message || 'Request failed', json.error?.code, json.error?.details);
  return json.data;
}
export const http = {
  get: (p) => request(p), post: (p, b) => request(p, { method: 'POST', body: b }),
  put: (p, b) => request(p, { method: 'PUT', body: b }), patch: (p, b) => request(p, { method: 'PATCH', body: b }), del: (p) => request(p, { method: 'DELETE' }),
  blob: (p) => request(p, { raw: true }),
};
