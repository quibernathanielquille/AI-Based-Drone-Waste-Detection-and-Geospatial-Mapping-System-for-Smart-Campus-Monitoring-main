import axios from 'axios';
import { API_BASE_URL, ML_API_URL } from '../utils/constants';
import { getToken, clearAuth } from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const onPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isAuthCheck && !onPublicPage) {
        clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

const mlApi = axios.create({ baseURL: ML_API_URL });

export const detectService = {
  health: () => mlApi.get('/health'),
  getModels: () => mlApi.get('/models'),
  detect: (imageBlob, model = 'garbage', confidence = 0.5) => {
    const fd = new FormData();
    fd.append('image', imageBlob, 'frame.jpg');
    fd.append('model', model);
    fd.append('confidence', String(confidence));
    return mlApi.post('/detect', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const wasteService = {
  getAll: (params) => api.get('/waste-detections', { params }),
  getOne: (id) => api.get(`/waste-detections/${id}`),
  getUserStats: () => api.get('/waste-detections/user-stats'),
  create: (formData) => api.post('/waste-detections', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.post(`/waste-detections/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/waste-detections/${id}`),
};

export const mapService = {
  getDetections: (params) => api.get('/map/detections', { params }),
};

export const reportService = {
  getAll: (params) => api.get('/reports', { params }),
  getOne: (id) => api.get(`/reports/${id}`),
  preview: (data) => api.post('/reports/preview', data),
  generate: (data) => api.post('/reports/generate', data),
  export: (data) => api.post('/reports/export', data, { responseType: 'blob' }),
};

export const analyticsService = {
  getData: () => api.get('/analytics'),
};

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, { password }),
  getRoles: () => api.get('/users/roles'),
};

export const settingsService = {
  get: (params) => api.get('/settings', { params }),
  updateProfile: (data) => api.put('/settings/profile', data),
  changePassword: (data) => api.put('/settings/password', data),
  updateNotifications: (data) => api.put('/settings/notifications', data),
  updateTheme: (data) => api.put('/settings/theme', data),
  updateSystem: (data) => api.put('/settings/system', data),
  getActivityLogs: (params) => api.get('/settings/activity-logs', { params }),
};
