import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { aiDecisions, aiModels, alerts, anomalies, logs, rules, thresholds } from './data';
import { AIDecision, AlertRecord, DetectionRule, LogEntry, Threshold } from './types';

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(bodyParser.json());

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const duplicateKey = (log: LogEntry) => `${log.timestamp}|${log.source}|${log.event_type}|${log.message}`;

const getDuplicateLogs = () => {
  const seen = new Map<string, string>();
  return logs.filter((log) => {
    if (log.duplicate_of) {
      return true;
    }

    const key = duplicateKey(log);
    if (seen.has(key)) {
      log.duplicate_of = seen.get(key);
      return true;
    }

    seen.set(key, log.id);
    return false;
  });
};

const activeLogStream = () => logs.filter((log) => !log.duplicate_of);

const dashboardStats = () => {
  const activeAlerts = alerts.filter((alert) => alert.status !== 'dismissed');
  const confirmedBenign = aiDecisions.filter((decision) => decision.status === 'overridden' && decision.human_decision === 'benign').length;
  const totalDecisions = aiDecisions.length || 1;

  return {
    total_alerts: activeAlerts.length,
    critical_alerts: activeAlerts.filter((alert) => alert.severity === 'critical').length,
    false_positives: confirmedBenign,
    detection_rate: Math.round((alerts.filter((alert) => alert.status !== 'dismissed').length / totalDecisions) * 100),
  };
};

const trendData = () => (
  Array.from({ length: 7 }).map((_, index) => ({
    date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    alerts: 8 + index * 2,
    resolved: 4 + index,
  }))
);

const topAlerts = () => {
  const counts = alerts.reduce<Record<string, number>>((accumulator, alert) => {
    accumulator[alert.alert_type] = (accumulator[alert.alert_type] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).map(([alert_type, count]) => ({ alert_type, count }));
};

const systemHealth = () => ({
  api_status: 'Operational',
  database_status: 'Demo In-Memory Mode',
  ai_models_status: `${aiModels.filter((model) => model.status === 'active').length} Active`,
  cpu_usage: 27,
});

const analysisSummary = () => ({
  total_anomalies: anomalies.length,
  high_risk_count: anomalies.filter((item) => item.risk_level === 'high' || item.risk_level === 'critical').length,
  suspicious_users: new Set(anomalies.map((item) => item.user_id)).size,
  baseline_deviations: anomalies.length,
  pattern_data: [
    { time: '00:00', baseline: 18, actual: 14 },
    { time: '06:00', baseline: 22, actual: 41 },
    { time: '12:00', baseline: 35, actual: 39 },
    { time: '18:00', baseline: 28, actual: 52 },
  ],
  anomaly_types: [
    { type: 'Impossible Travel', count: anomalies.filter((item) => item.anomaly_type === 'Impossible Travel').length },
    { type: 'Abnormal Data Transfer', count: anomalies.filter((item) => item.anomaly_type === 'Abnormal Data Transfer').length },
    { type: 'Privilege Escalation', count: anomalies.filter((item) => item.anomaly_type === 'Privilege Escalation').length },
  ],
});

const alertStats = () => ({
  total: alerts.length,
  open: alerts.filter((alert) => alert.status === 'open').length,
  acknowledged: alerts.filter((alert) => alert.status === 'acknowledged').length,
  resolved: alerts.filter((alert) => alert.status === 'resolved').length,
  dismissed: alerts.filter((alert) => alert.status === 'dismissed').length,
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', mode: 'demo', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/stats', (_req: Request, res: Response) => res.json(dashboardStats()));
app.get('/api/dashboard/trends', (_req: Request, res: Response) => res.json(trendData()));
app.get('/api/dashboard/top-alerts', (_req: Request, res: Response) => res.json(topAlerts()));
app.get('/api/dashboard/health', (_req: Request, res: Response) => res.json(systemHealth()));

app.get('/api/logs/duplicates', (_req: Request, res: Response) => res.json(getDuplicateLogs()));

app.post('/api/logs/remove-duplicate', (req: Request, res: Response) => {
  const ids = Array.isArray(req.body.log_ids) ? req.body.log_ids as string[] : [];
  const removedIds = new Set(ids);
  const before = logs.length;

  for (let index = logs.length - 1; index >= 0; index -= 1) {
    if (removedIds.has(logs[index].id) || (logs[index].duplicate_of && (ids.length === 0 || removedIds.has(logs[index].id)))) {
      logs.splice(index, 1);
    }
  }

  res.json({ removed: before - logs.length, remaining: logs.length });
});

app.get('/api/logs/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').toLowerCase();
  const results = activeLogStream().filter((log) =>
    [log.source, log.event_type, log.message, log.entity_name].some((value) => value.toLowerCase().includes(query))
  );
  res.json({ results, count: results.length });
});

app.get('/api/logs/:id', (req: Request, res: Response) => {
  const log = logs.find((item) => item.id === req.params.id);
  if (!log) {
    res.status(404).json({ message: 'Log not found' });
    return;
  }

  res.json(log);
});

app.get('/api/logs', (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.page_size || 10);
  const duplicatesOnly = String(req.query.duplicates || 'false') === 'true';
  const data = duplicatesOnly ? getDuplicateLogs() : activeLogStream();
  const start = (page - 1) * pageSize;

  res.json({
    results: data.slice(start, start + pageSize),
    count: data.length,
    page,
    page_size: pageSize,
  });
});

app.get('/api/behavior/analysis', (_req: Request, res: Response) => res.json(analysisSummary()));
app.get('/api/behavior/anomalies', (_req: Request, res: Response) => res.json(anomalies));
app.get('/api/behavior/user/:userId', (req: Request, res: Response) => {
  res.json(anomalies.filter((item) => item.user_id === req.params.userId));
});
app.get('/api/behavior/host/:hostId', (req: Request, res: Response) => {
  res.json(anomalies.filter((item) => item.host_id === req.params.hostId));
});

app.get('/api/rules', (_req: Request, res: Response) => res.json({ results: rules, count: rules.length }));
app.get('/api/rules/:id', (req: Request, res: Response) => {
  const rule = rules.find((item) => item.id === req.params.id);
  if (!rule) {
    res.status(404).json({ message: 'Rule not found' });
    return;
  }

  res.json(rule);
});
app.post('/api/rules', (req: Request, res: Response) => {
  const rule: DetectionRule = {
    id: makeId('rule'),
    false_positive_rate: 0,
    trigger_count: 0,
    ...req.body,
  };
  rules.unshift(rule);
  res.status(201).json(rule);
});
app.put('/api/rules/:id', (req: Request, res: Response) => {
  const index = rules.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Rule not found' });
    return;
  }

  rules[index] = { ...rules[index], ...req.body };
  res.json(rules[index]);
});
app.delete('/api/rules/:id', (req: Request, res: Response) => {
  const index = rules.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Rule not found' });
    return;
  }

  rules.splice(index, 1);
  res.status(204).send();
});
app.post('/api/rules/test', (req: Request, res: Response) => {
  const previewMatches = activeLogStream().filter((log) => log.message.toLowerCase().includes(String(req.body.condition || '').toLowerCase()));
  res.json({
    matched_count: previewMatches.length,
    sample_matches: previewMatches.slice(0, 3),
  });
});

app.get('/api/thresholds', (_req: Request, res: Response) => res.json({ results: thresholds, count: thresholds.length }));
app.get('/api/thresholds/:id', (req: Request, res: Response) => {
  const threshold = thresholds.find((item) => item.id === req.params.id);
  if (!threshold) {
    res.status(404).json({ message: 'Threshold not found' });
    return;
  }

  res.json(threshold);
});
app.post('/api/thresholds', (req: Request, res: Response) => {
  const threshold: Threshold = {
    id: makeId('threshold'),
    ...req.body,
  };
  thresholds.unshift(threshold);
  res.status(201).json(threshold);
});
app.put('/api/thresholds/:id', (req: Request, res: Response) => {
  const index = thresholds.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Threshold not found' });
    return;
  }

  thresholds[index] = { ...thresholds[index], ...req.body } as Threshold;
  res.json(thresholds[index]);
});
app.post('/api/thresholds/reset', (_req: Request, res: Response) => {
  thresholds.splice(0, thresholds.length,
    {
      id: 'threshold-1',
      name: 'Duplicate Suppression Window',
      description: 'Window used to collapse repeated copies of the same event before AI analysis.',
      value: 10,
      unit: 'minutes',
      enabled: true,
      alert_on: 'exceed',
    },
    {
      id: 'threshold-2',
      name: 'Behavior Risk Trigger',
      description: 'Minimum calculated behavior risk score that creates an analyst-visible anomaly.',
      value: 70,
      unit: 'score',
      enabled: true,
      alert_on: 'exceed',
    },
    {
      id: 'threshold-3',
      name: 'AI Auto-Dismiss Confidence',
      description: 'Confidence required for AI to auto-dismiss likely benign noise.',
      value: 82,
      unit: 'percent',
      enabled: true,
      alert_on: 'exceed',
    });

  res.json({ results: thresholds });
});

app.get('/api/ai/models', (_req: Request, res: Response) => res.json({ results: aiModels, count: aiModels.length }));
app.get('/api/ai/models/:id', (req: Request, res: Response) => {
  const model = aiModels.find((item) => item.id === req.params.id);
  if (!model) {
    res.status(404).json({ message: 'Model not found' });
    return;
  }

  res.json(model);
});
app.put('/api/ai/models/:id/weights', (req: Request, res: Response) => {
  const index = aiModels.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Model not found' });
    return;
  }

  aiModels[index] = { ...aiModels[index], weights: req.body.weights || aiModels[index].weights };
  res.json(aiModels[index]);
});
app.get('/api/ai/decisions', (req: Request, res: Response) => {
  const status = String(req.query.status || '');
  const results = status ? aiDecisions.filter((decision) => decision.status === status) : aiDecisions;
  res.json({ results, count: results.length });
});
app.post('/api/ai/decisions/:id/override', (req: Request, res: Response) => {
  const index = aiDecisions.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Decision not found' });
    return;
  }

  aiDecisions[index] = {
    ...aiDecisions[index],
    status: 'overridden',
    override_reason: req.body.override_reason || 'Manual analyst override',
    human_decision: req.body.human_decision || aiDecisions[index].decision,
  } as AIDecision;

  res.json(aiDecisions[index]);
});
app.get('/api/ai/accuracy', (_req: Request, res: Response) => {
  res.json({
    overall_accuracy: 89,
    precision: 89,
    recall: 83,
    f1_score: 0.86,
    true_positives: 143,
    false_positives: 18,
    false_negatives: 11,
    true_negatives: 209,
    accuracy_trend: [
      { date: '2026-01', accuracy: 78 },
      { date: '2026-02', accuracy: 81 },
      { date: '2026-03', accuracy: 85 },
      { date: '2026-04', accuracy: 89 },
    ],
  });
});
app.post('/api/ai/train', (_req: Request, res: Response) => {
  aiModels[0].status = 'training';
  res.json({ message: 'Training job queued', model: aiModels[0] });
});

app.get('/api/alerts/stats', (_req: Request, res: Response) => res.json(alertStats()));
app.get('/api/alerts/:id', (req: Request, res: Response) => {
  const alert = alerts.find((item) => item.id === req.params.id);
  if (!alert) {
    res.status(404).json({ message: 'Alert not found' });
    return;
  }

  res.json(alert);
});
app.put('/api/alerts/:id', (req: Request, res: Response) => {
  const index = alerts.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Alert not found' });
    return;
  }

  alerts[index] = { ...alerts[index], ...req.body } as AlertRecord;
  res.json(alerts[index]);
});
app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const index = alerts.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Alert not found' });
    return;
  }

  alerts[index].status = 'acknowledged';
  res.json(alerts[index]);
});
app.post('/api/alerts/:id/dismiss', (req: Request, res: Response) => {
  const index = alerts.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ message: 'Alert not found' });
    return;
  }

  alerts[index].status = 'dismissed';
  res.json(alerts[index]);
});
app.get('/api/alerts', (_req: Request, res: Response) => res.json({ results: alerts, count: alerts.length }));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AI SIEM backend listening on http://localhost:${port}`);
});
