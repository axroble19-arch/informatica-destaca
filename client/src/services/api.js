import axios from 'axios';

// En producción (despliegue en línea) la API vive en otra URL: se configura
// con VITE_API_URL. En desarrollo se usa el proxy /api de Vite.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
};

export const studentsApi = {
  list: () => api.get('/students').then((r) => r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data),
  create: (data) => api.post('/students', data).then((r) => r.data),
  update: (id, data) => api.put(`/students/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/students/${id}`).then((r) => r.data),
};

export const eventsApi = {
  list: (params) => api.get('/events', { params }).then((r) => r.data),
  get: (id) => api.get(`/events/${id}`).then((r) => r.data),
  create: (data) => api.post('/events', data).then((r) => r.data),
  update: (id, data) => api.put(`/events/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/events/${id}`).then((r) => r.data),
};

export const achievementsApi = {
  list: (params) => api.get('/achievements', { params }).then((r) => r.data),
  create: (data) => api.post('/achievements', data).then((r) => r.data),
  // Postulación pública al Cuadro de Honor (sin login): crea el logro en PENDING.
  apply: (data) => api.post('/achievements/apply', data).then((r) => r.data),
  update: (id, data) => api.put(`/achievements/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/achievements/${id}`).then((r) => r.data),
};

export const participationsApi = {
  list: (params) => api.get('/participations', { params }).then((r) => r.data),
  create: (data) => api.post('/participations', data).then((r) => r.data),
  update: (id, data) => api.put(`/participations/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/participations/${id}`).then((r) => r.data),
};

export const mediaApi = {
  list: (params) => api.get('/media', { params }).then((r) => r.data),
  create: (data) => api.post('/media', data).then((r) => r.data),
  // Subida de archivo: devuelve { url } en /uploads/... (luego se registra con create).
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/media/upload', fd).then((r) => r.data);
  },
  remove: (id) => api.delete(`/media/${id}`).then((r) => r.data),
};

export const searchApi = {
  search: (params) => api.get('/search', { params }).then((r) => r.data),
};

export const adminApi = {
  pending: () => api.get('/admin/pending').then((r) => r.data),
  approveAchievement: (id) => api.post(`/admin/achievements/${id}/approve`).then((r) => r.data),
  rejectAchievement: (id) => api.post(`/admin/achievements/${id}/reject`).then((r) => r.data),
  approveParticipation: (id) => api.post(`/admin/participations/${id}/approve`).then((r) => r.data),
  rejectParticipation: (id) => api.post(`/admin/participations/${id}/reject`).then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  media: () => api.get('/admin/media').then((r) => r.data),
  evaluations: () => api.get('/evaluations').then((r) => r.data),
};

export const evaluationsApi = {
  // Proyectos que el evaluador debe evaluar (solo EVALUATOR).
  assignments: () => api.get('/evaluations/assignments').then((r) => r.data),
  // Evaluaciones realizadas (EVALUATOR: las suyas; ADMIN: todas).
  list: () => api.get('/evaluations').then((r) => r.data),
  // Registrar o actualizar la calificación de un proyecto (solo EVALUATOR).
  save: (data) => api.post('/evaluations', data).then((r) => r.data),
};

export default api;
