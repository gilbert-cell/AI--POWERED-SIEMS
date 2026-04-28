import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    return response.data;
  } catch (error) {
    throw new Error('Login failed. Please check your credentials.');
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/auth/logout`);
  } catch (error) {
    throw new Error('Logout failed. Please try again.');
  }
};

export const register = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, { username, password });
    return response.data;
  } catch (error) {
    throw new Error('Registration failed. Please try again.');
  }
};