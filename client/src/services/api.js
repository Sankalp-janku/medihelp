import { http } from './httpClient.js';

/** Builds a query string, skipping empty values. */
export const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? '?' + new URLSearchParams(clean).toString() : '';
};

export const authApi = {
  register: (formData) => http.post('/auth/register', formData),
  verifyPhone: (b) => http.post('/auth/verify-phone', b),
  login: (b) => http.post('/auth/login', b),
  me: () => http.get('/auth/me'),
  updateProfile: (b) => http.put('/auth/profile', b),
};
export const metaApi = { specialities: () => http.get('/meta/specialities') };
export const userApi = { photo: (id) => http.blob(`/users/${id}/photo`) };
export const documentsApi = {
  list: (patientId, params) => http.get('/documents' + qs({ patientId, ...params, tz: new Date().getTimezoneOffset() })),
  get: (id, patientId) => http.get(`/documents/${id}` + qs({ patientId })),
  upload: (form) => http.post('/documents', form),
  remove: (id) => http.del(`/documents/${id}`),
  file: (id, patientId) => http.blob(`/documents/${id}/file` + qs({ patientId })),
};
export const historyApi = { list: (before) => http.get('/history' + qs({ before })) };
export const accessApi = {
  request: (dishaId) => http.post('/access/request', { dishaId }),
  verify: (otpId, code) => http.post('/access/verify', { otpId, code }),
  sessions: () => http.get('/access/sessions'),
};
export const adminApi = {
  stats: () => http.get('/admin/stats'),
  doctors: (params) => http.get('/admin/doctors' + qs(params)),
  doctor: (id) => http.get(`/admin/doctors/${id}`),
  verificationFile: (id, index) => http.blob(`/admin/doctors/${id}/verification/${index}`),
  approve: (id) => http.patch(`/admin/doctors/${id}/approve`),
  reject: (id, reason) => http.patch(`/admin/doctors/${id}/reject`, { reason }),
};
export const emergencyApi = {
  me: () => http.get('/emergency/me'),
  lookup: (dishaId) => http.get(`/emergency/lookup/${encodeURIComponent(dishaId)}`),
  sessions: () => http.get('/emergency/access'),
  revoke: (id) => http.del(`/emergency/access/${id}`),
};
