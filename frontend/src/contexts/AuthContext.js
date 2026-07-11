import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isAuthenticated, getCurrentUser, logoutUser, AUTH_TOKEN_KEY } from '../utils/auth';
import { getStoredRole, setStoredRole, ROLE_CHANGE_EVENT } from '../utils/rbac';
import { AUTH_CHANGE_EVENT } from '../utils/auth';

// Decode JWT payload without verifying signature (verification is done server-side)
const getTokenExpiry = () => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ?? null;
  } catch {
    return null;
  }
};

const isTokenExpired = () => {
  const exp = getTokenExpiry();
  return exp !== null && exp < Math.floor(Date.now() / 1000);
};
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Immediately clear stale/expired token before initialising state
  if (isTokenExpired()) logoutUser();

  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [currentUser, setCurrentUser]     = useState(getCurrentUser);
  const [currentRole, setCurrentRole]     = useState(getStoredRole);

  // Proactive expiry check — re-evaluate every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        logoutUser();
        syncState();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const syncState = useCallback(() => {
    setAuthenticated(isAuthenticated());
    setCurrentUser(getCurrentUser());
    setCurrentRole(getStoredRole());
  }, []);

  useEffect(() => {
    const onRole = (e) => setCurrentRole(e.detail || getStoredRole());
    const onAuth = () => syncState();

    window.addEventListener(ROLE_CHANGE_EVENT, onRole);
    window.addEventListener(AUTH_CHANGE_EVENT, onAuth);
    window.addEventListener('storage', syncState);
    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, onRole);
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuth);
      window.removeEventListener('storage', syncState);
    };
  }, [syncState]);

  const changeRole = (role) => setCurrentRole(setStoredRole(role));

  const logout = () => {
    logoutUser();
    window.location.hash = '/login';
  };

  return (
    <AuthContext.Provider value={{ authenticated, currentUser, currentRole, changeRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
