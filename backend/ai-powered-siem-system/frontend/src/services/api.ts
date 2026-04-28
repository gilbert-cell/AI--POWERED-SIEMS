import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

// Function to get logs
export const getLogs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/logs`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching logs: ' + error.message);
  }
};

// Function to create a new rule
export const createRule = async (ruleData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rules`, ruleData);
    return response.data;
  } catch (error) {
    throw new Error('Error creating rule: ' + error.message);
  }
};

// Function to update an existing rule
export const updateRule = async (ruleId, ruleData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/rules/${ruleId}`, ruleData);
    return response.data;
  } catch (error) {
    throw new Error('Error updating rule: ' + error.message);
  }
};

// Function to delete a rule
export const deleteRule = async (ruleId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/rules/${ruleId}`);
    return response.data;
  } catch (error) {
    throw new Error('Error deleting rule: ' + error.message);
  }
};

// Function to get alert thresholds
export const getAlertThresholds = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/thresholds`);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching alert thresholds: ' + error.message);
  }
};

// Function to update alert thresholds
export const updateAlertThresholds = async (thresholdData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/thresholds`, thresholdData);
    return response.data;
  } catch (error) {
    throw new Error('Error updating alert thresholds: ' + error.message);
  }
};