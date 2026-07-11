import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AUTH_TOKEN_KEY, AUTH_CHANGE_EVENT } from '../utils/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Auto-logout on 401 — token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('siem_auth_user');
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
