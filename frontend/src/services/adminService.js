import api from './apiClient';

export const adminService = {
  getSystemSettings: () => api.get('/admin/system-settings/'),
  saveSystemSettings: (settings) => api.put('/admin/system-settings/', { settings }),
};
