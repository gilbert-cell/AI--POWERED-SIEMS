import api from './apiClient';

const timeRangeToMinutes = { '30min': 30, '1h': 60, '24h': 1440, '7d': 10080 };

export const dashboardService = {
  getStats:       (timeRange) => api.get('/dashboard/stats/',        { params: timeRange && timeRange !== 'live' ? { minutes: timeRangeToMinutes[timeRange] } : {} }),
  getSourceStats: (timeRange) => api.get('/dashboard/source-stats/', { params: timeRange && timeRange !== 'live' ? { minutes: timeRangeToMinutes[timeRange] } : {} }),
  getAlertTrends: (days = 30) => api.get(`/dashboard/trends/?days=${days}`),
  getTopAlerts:   (limit = 10, timeRange) => api.get('/dashboard/top-alerts/', { params: { limit, ...(timeRange && timeRange !== 'live' ? { minutes: timeRangeToMinutes[timeRange] } : {}) } }),
  getSystemHealth:()          => api.get('/dashboard/health/'),
};
