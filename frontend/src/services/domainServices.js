import api from './apiClient';

export const aiService = {
  getModels:           ()          => api.get('/ai/models/'),
  getModel:            (id)        => api.get(`/ai/models/${id}/`),
  updateModelWeights:  (id, data)  => api.put(`/ai/models/${id}/weights/`, data),
  getDecisions:        (params)    => api.get('/ai/decisions/', { params }),
  overrideDecision:    (id, data)  => api.post(`/ai/decisions/${id}/override/`, data),
  getAdvancedDecisions:()          => api.get('/ai/decisions/advanced/'),
  getAccuracy:         ()          => api.get('/ai/accuracy/'),
  getAnalysis:         ()          => api.get('/ai/analysis/'),
  trainModel:          (data)      => api.post('/ai/train/', data),
};

export const rulesService = {
  getRules:          (params)    => api.get('/rules/', { params }),
  getRule:           (id)        => api.get(`/rules/${id}/`),
  createRule:        (data)      => api.post('/rules/', data),
  updateRule:        (id, data)  => api.put(`/rules/${id}/`, data),
  deleteRule:        (id)        => api.delete(`/rules/${id}/`),
  toggleRule:        (id)        => api.post(`/rules/${id}/toggle/`),
  resetRules:        ()          => api.post('/rules/reset/'),
  createFromDecision:(data)      => api.post('/rules/from-decision/', data),
};

export const thresholdsService = {
  getThresholds:    (params)    => api.get('/thresholds/', { params }),
  getThreshold:     (id)        => api.get(`/thresholds/${id}/`),
  createThreshold:  (data)      => api.post('/thresholds/', data),
  updateThreshold:  (id, data)  => api.put(`/thresholds/${id}/`, data),
  deleteThreshold:  (id)        => api.delete(`/thresholds/${id}/`),
  toggleThreshold:  (id)        => api.post(`/thresholds/${id}/toggle/`),
  resetThresholds:  ()          => api.post('/thresholds/reset/'),
};

export const alertsService = {
  getAlerts:        (params)    => api.get('/alerts/', { params }),
  getAlert:         (id)        => api.get(`/alerts/${id}/`),
  updateAlert:      (id, data)  => api.put(`/alerts/${id}/`, data),
  acknowledgeAlert: (id)        => api.post(`/alerts/${id}/acknowledge/`),
  dismissAlert:     (id)        => api.post(`/alerts/${id}/dismiss/`),
  getAlertStats:    ()          => api.get('/alerts/stats/'),
};

export const behaviorService = {
  getAnalysis:    (params)  => api.get('/behavior/analysis/', { params }),
  getAnomalies:   (params)  => api.get('/behavior/anomalies/', { params }),
  getUserBehavior:(userId)  => api.get(`/behavior/user/${userId}/`),
  getHostBehavior:(hostId)  => api.get(`/behavior/host/${hostId}/`),
};
