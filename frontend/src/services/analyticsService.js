import api from './apiClient';

export const analyticsService = {
  getSummary:             (params)          => api.get('/analytics/summary/', { params }),
  getSeverityDistribution:(params)          => api.get('/analytics/severity-distribution/', { params }),
  getEventTypes:          (limit = 10, params) => api.get(`/analytics/event-types/?limit=${limit}`, { params }),
  getSourceMetrics:       (params)          => api.get('/analytics/source-metrics/', { params }),
  getHourlyTrends:        (params)          => api.get('/analytics/hourly-trends/', { params }),
  getResponseMetrics:     (params)          => api.get('/analytics/response-metrics/', { params }),
  getDetectionAccuracy:   (params)          => api.get('/analytics/detection-accuracy/', { params }),
  getTopHosts:            (limit = 10, params) => api.get(`/analytics/top-hosts/?limit=${limit}`, { params }),
  getEvaluation:          (params)          => api.get('/analytics/evaluation/', { params }),
  exportReport:           (params)          => api.get('/analytics/export/', { params, responseType: 'blob' }),
};
