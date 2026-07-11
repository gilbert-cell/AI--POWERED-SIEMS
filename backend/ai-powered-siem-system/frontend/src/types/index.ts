// This file exports TypeScript types and interfaces used throughout the frontend application.

export interface Log {
  id: string | number;
  timestamp: string;
  message: string;
  level?: 'info' | 'warning' | 'error' | string;
  source: string;
  event_type?: string;
  severity?: string;
  status?: string | null;
  status_label?: string;
  display_status?: string;
  false_positive?: boolean;
  anomaly_score?: number;
  rf_score?: number;
  if_score?: number;
  ml_scores?: {
    anomaly_score?: number;
    if_score?: number;
    rf_score?: number;
  };
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  actions: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AIDecision {
  parameter: string;
  value: number;
}

export interface Threshold {
  alertType: string;
  thresholdValue: number;
}
