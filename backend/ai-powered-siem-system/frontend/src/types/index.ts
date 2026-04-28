// This file exports TypeScript types and interfaces used throughout the frontend application.

export interface Log {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  source: string;
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