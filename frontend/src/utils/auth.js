import { authService } from '../services/api';
import { DEFAULT_ROLE, ROLE_STORAGE_KEY, normalizeRole } from './rbac';

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'siem_auth_user';
export const AUTH_CHANGE_EVENT = 'siem-auth-change';

const emitAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

const saveSessionUser = (user, token = null) => {
  const sessionUser = {
    ...user,
    role: normalizeRole(user.role || DEFAULT_ROLE),
    sessionStartedAt: new Date().toISOString(),
  };

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
  localStorage.setItem(ROLE_STORAGE_KEY, sessionUser.role);
  emitAuthChange();
  return sessionUser;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem(AUTH_USER_KEY);
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(localStorage.getItem(AUTH_TOKEN_KEY) && getCurrentUser());

export const refreshCurrentUser = async () => {
  const currentUser = getCurrentUser();
  if (!currentUser?.email) return null;

  const response = await authService.me(currentUser.email);
  return saveSessionUser(response.data.user, localStorage.getItem(AUTH_TOKEN_KEY));
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await authService.login({ email, password });
    return saveSessionUser(response.data.user, response.data.token);
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Invalid email or password.');
  }
};

export const getRegisteredUsers = async () => {
  const response = await authService.getUsers();
  return response.data?.users || [];
};

export const registerUser = async ({ name, email, password, role }) => {
  try {
    const response = await authService.createUser({ name, email, password, role });
    return response.data.user;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to create user.');
  }
};

export const updateUser = async (id, updates) => {
  try {
    const response = await authService.updateUser(id, updates);
    const updatedUser = response.data.user;
    const currentUser = getCurrentUser();
    if (currentUser?.id === updatedUser.id) {
      saveSessionUser(updatedUser, localStorage.getItem(AUTH_TOKEN_KEY));
    }
    return updatedUser;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to update user.');
  }
};

export const deleteUser = async (id) => {
  try {
    await authService.deleteUser(id);
    const currentUser = getCurrentUser();
    if (currentUser?.id === id) {
      logoutUser();
    }
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to delete user.');
  }
};

export const resetPassword = async ({ email, password }) => {
  try {
    await authService.resetPassword({ email, password });
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Unable to reset password.');
  }
};

export const logoutUser = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  emitAuthChange();
};
