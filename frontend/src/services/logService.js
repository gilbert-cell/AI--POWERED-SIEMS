import api from './apiClient';

export const logService = {
  getLogs:          (params)        => api.get('/logs/', { params }),
  getLiveFeed:      (params)        => api.get('/logs/live/', { params }),
  getLogDetails:    (id)            => api.get(`/logs/${id}/`),
  getDuplicateLogs: ()              => api.get('/logs/duplicates/'),
  removeDuplicate:  (logIds)        => api.post('/logs/remove-duplicate/', { log_ids: logIds }),
  searchLogs:       (query, params) => api.get('/logs/search/', { params: { q: query, ...params } }),
  exportLogs:       (params)        => api.get('/logs/export/', { params, responseType: 'blob' }),
};
