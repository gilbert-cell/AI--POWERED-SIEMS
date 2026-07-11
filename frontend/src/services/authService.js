import api from './apiClient';

export const authService = {
  login:         (data)     => api.post('/auth/login/', data),
  me:            (email)    => api.get('/auth/me/', { params: email ? { email } : {} }),
  getUsers:      ()         => api.get('/auth/users/'),
  createUser:    (data)     => api.post('/auth/users/', data),
  updateUser:    (id, data) => api.put(`/auth/users/${id}/`, data),
  deleteUser:    (id)       => api.delete(`/auth/users/${id}/`),
  resetPassword: (data)     => api.post('/auth/reset-password/', data),
};
