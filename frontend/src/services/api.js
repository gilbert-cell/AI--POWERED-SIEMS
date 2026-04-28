import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Log Service
export const logService = {
  getLogs: (params) => api.get('/logs/', { params }),
  getLogDetails: (id) => api.get(`/logs/${id}/`),
  getDuplicateLogs: () => api.get('/logs/duplicates/'),
  removeDuplicate: (logIds) => api.post('/logs/remove-duplicate/', { log_ids: logIds }),
  searchLogs: (query, params) => api.get(`/logs/search/?q=${query}`, { params }),
};

// Dashboard Service
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats/'),
  getSourceStats: () => api.get('/dashboard/source-stats/'),
  getAlertTrends: (days = 30) => api.get(`/dashboard/trends/?days=${days}`),
  getTopAlerts: (limit = 10) => api.get(`/dashboard/top-alerts/?limit=${limit}`),
  getSystemHealth: () => api.get('/dashboard/health/'),
};

// Behavior Analysis Service
export const behaviorService = {
  getAnalysis: (params) => api.get('/behavior/analysis/', { params }),
  getAnomalies: (params) => api.get('/behavior/anomalies/', { params }),
  getUserBehavior: (userId) => api.get(`/behavior/user/${userId}/`),
  getHostBehavior: (hostId) => api.get(`/behavior/host/${hostId}/`),
};

// Rules Service
export const rulesService = {
  getRules: (params) => api.get('/rules/', { params }),
  getRule: (id) => api.get(`/rules/${id}/`),
  createRule: (data) => api.post('/rules/', data),
  updateRule: (id, data) => api.put(`/rules/${id}/`, data),
  deleteRule: (id) => api.delete(`/rules/${id}/`),
  toggleRule: (id) => api.post(`/rules/${id}/toggle/`),
};

// Thresholds Service
export const thresholdsService = {
  getThresholds: () => api.get('/thresholds/'),
  getThreshold: (id) => api.get(`/thresholds/${id}/`),
  createThreshold: (data) => api.post('/thresholds/', data),
  updateThreshold: (id, data) => api.put(`/thresholds/${id}/`, data),
  deleteThreshold: (id) => api.delete(`/thresholds/${id}/`),
  toggleThreshold: (id) => api.post(`/thresholds/${id}/toggle/`),
  resetThresholds: () => api.post('/thresholds/reset/'),
};

// AI Decision Service
export const aiService = {
  getModels: () => api.get('/ai/models/'),
  getModel: (id) => api.get(`/ai/models/${id}/`),
  updateModelWeights: (id, data) => api.put(`/ai/models/${id}/weights/`, data),
  getDecisions: (params) => api.get('/ai/decisions/', { params }),
  overrideDecision: (decisionId, data) => api.post(`/ai/decisions/${decisionId}/override/`, data),
  getAdvancedDecisions: () => api.get('/ai/decisions/advanced/'),
  getAccuracy: () => api.get('/ai/accuracy/'),
  trainModel: (data) => api.post('/ai/train/', data),
};

// Alerts Service
export const alertsService = {
  getAlerts: (params) => api.get('/alerts/', { params }),
  getAlert: (id) => api.get(`/alerts/${id}/`),
  updateAlert: (id, data) => api.put(`/alerts/${id}/`, data),
  acknowledgeAlert: (id) => api.post(`/alerts/${id}/acknowledge/`),
  dismissAlert: (id) => api.post(`/alerts/${id}/dismiss/`),
  getAlertStats: () => api.get('/alerts/stats/'),
};

// Analytics Service
export const analyticsService = {
  getSummary: (params) => api.get('/analytics/summary/', { params }),
  getSeverityDistribution: (params) => api.get('/analytics/severity-distribution/', { params }),
  getEventTypes: (limit = 10, params) => api.get(`/analytics/event-types/?limit=${limit}`, { params }),
  getSourceMetrics: (params) => api.get('/analytics/source-metrics/', { params }),
  getHourlyTrends: (params) => api.get('/analytics/hourly-trends/', { params }),
  getResponseMetrics: (params) => api.get('/analytics/response-metrics/', { params }),
  getDetectionAccuracy: (params) => api.get('/analytics/detection-accuracy/', { params }),
  getTopHosts: (limit = 10, params) => api.get(`/analytics/top-hosts/?limit=${limit}`, { params }),
  exportReport: (params) => api.get('/analytics/export/', { params, responseType: 'blob' }),
};

export default api;
