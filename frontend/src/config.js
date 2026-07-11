// src/config.js — single source of truth for all frontend constants

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Polling intervals (ms)
export const LIVE_POLL_INTERVAL     = parseInt(process.env.REACT_APP_LIVE_POLL_MS   || '60000',  10);
export const ADVANCED_POLL_INTERVAL = parseInt(process.env.REACT_APP_ADV_POLL_MS    || '60000', 10);

// Pagination
export const DEFAULT_PAGE_SIZE = parseInt(process.env.REACT_APP_PAGE_SIZE || '20', 10);

// Anomaly score thresholds (must match backend config.py)
export const SCORE_CRITICAL = 0.90;
export const SCORE_HIGH     = 0.75;
export const SCORE_MEDIUM   = 0.45;

// Severity colour map — used across all pages
export const SEVERITY_COLORS = {
  critical: { bg: '#ffebee', color: '#d32f2f' },
  high:     { bg: '#fff3e0', color: '#f57c00' },
  medium:   { bg: '#fffde7', color: '#f9a825' },
  low:      { bg: '#e8f5e9', color: '#388e3c' },
};

// Chart colour palette
export const CHART_COLORS = ['#1a237e', '#d32f2f', '#f57c00', '#388e3c', '#7b1fa2', '#0288d1', '#c62828', '#2e7d32'];

// Time range options (shared by Dashboard, Analytics, Behavior pages)
export const TIME_RANGE_OPTIONS = [
  { label: '● Live', value: 'live' },
  { label: '30 Min', value: '30min' },
  { label: '1 Hour', value: '1h'   },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days',  value: '7d'  },
  { label: '30 Days', value: '30d' },
];

// Source options for filter dropdowns
export const SOURCE_OPTIONS = [
  'all', 'firewall', 'system', 'ssh', 'auth-service', 'file-system', 'ids-system', 'web-server',
];

// App metadata
export const APP_NAME    = process.env.REACT_APP_APP_NAME || 'AI SIEM';
export const APP_VERSION = process.env.REACT_APP_VERSION  || '1.0.0';
