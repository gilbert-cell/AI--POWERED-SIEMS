export interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  user_id: string;
  host_id: string;
  entity_name: string;
  duplicate_of?: string;
  status: 'new' | 'deduplicated' | 'investigating' | 'resolved';
  risk_score: number;
  metadata: Record<string, string | number | boolean>;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rule_type: 'pattern' | 'threshold' | 'behavior';
  condition: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'alert' | 'block' | 'notify';
  false_positive_rate: number;
  trigger_count: number;
}

export interface Threshold {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  enabled: boolean;
  alert_on: 'exceed' | 'drop' | 'deviation';
}

export interface AlertRecord {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  alert_type: string;
  message: string;
  status: 'open' | 'acknowledged' | 'dismissed' | 'resolved';
  log_id: string;
  ai_decision_id: string;
  confidence: number;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  entity_name: string;
  anomaly_type: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  user_id: string;
  host_id: string;
  description: string;
  summary: string;
  recommended_action: string;
  details?: Record<string, string | number>;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  model_type: string;
  status: 'active' | 'training' | 'shadow';
  is_active: boolean;
  accuracy: number;
  last_updated: string;
  weights: Record<string, number>;
  false_positive_reduction: number;
}

export interface AIDecision {
  id: string;
  timestamp: string;
  event_description: string;
  decision: 'threat' | 'benign';
  secondary_decision?: string;
  confidence: number;
  model_id: string;
  model_name: string;
  status: 'pending' | 'confirmed' | 'overridden';
  override_reason?: string;
  human_decision?: 'threat' | 'benign';
}
