import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const authHeaders = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type LogFilters = {
  severity?: string;
  source?: string;
  status?: string;
  q?: string;
};

// Function to get logs
export const fetchLogs = async (filters: LogFilters = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/logs/`, {
      params: filters,
      headers: authHeaders(),
    });
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    return payload.results || payload.logs || [];
  } catch (error) {
    throw new Error('Error fetching logs');
  }
};

export const getLogs = fetchLogs;

export const fetchDashboardData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats/`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching dashboard data');
  }
};

// Function to create a new rule
export const createRule = async (ruleData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rules/`, ruleData, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    throw new Error('Error creating rule: ' + error.message);
  }
};

// Function to update an existing rule
export const updateRule = async (ruleId, ruleData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/rules/${ruleId}/`, ruleData, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    throw new Error('Error updating rule: ' + error.message);
  }
};

// Function to delete a rule
export const deleteRule = async (ruleId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/rules/${ruleId}/`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    throw new Error('Error deleting rule: ' + error.message);
  }
};

// Function to get alert thresholds
export const getAlertThresholds = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/thresholds/`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching alert thresholds: ' + error.message);
  }
};

// Function to update alert thresholds
export const updateAlertThresholds = async (thresholdData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/thresholds/`, thresholdData, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    throw new Error('Error updating alert thresholds: ' + error.message);
  }
};
