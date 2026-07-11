import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchLogs, LogFilters } from '../../services/api';
import { Log } from '../../types';

const severityOptions = [
  { value: '', label: 'All severities' },
  { value: 'INFORMATIONAL', label: 'Informational' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'true_positive', label: 'True Positive' },
  { value: 'false_positive', label: 'False Positive' },
  { value: 'new', label: 'Pending Review' },
  { value: 'reviewing', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'no_anomaly', label: 'No Anomaly' },
];

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  false_positive: { label: '❌ False Positive', color: '#dc2626' },
  confirmed:      { label: '✅ True Positive',  color: '#16a34a' },
  new:            { label: '🔵 Pending Review', color: '#2563eb' },
  reviewing:      { label: '🟡 Under Review',   color: '#d97706' },
  resolved:       { label: '✔ Resolved',        color: '#6b7280' },
  no_anomaly:     { label: 'No Anomaly',         color: '#9ca3af' },
};

const LogViewer: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialStatus = params.get('status') || '';

  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    severity: '',
    source: '',
    status: initialStatus,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const activeFilters: LogFilters = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            activeFilters[key as keyof LogFilters] = value;
          }
        });
        const fetchedLogs = await fetchLogs(activeFilters);
        setLogs(fetchedLogs);
      } catch (err) {
        setError('Failed to load logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [filters]);

  const updateFilter = (key: keyof LogFilters, value: string) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const sources = Array.from(
    new Set(logs.map(log => log.source).filter(Boolean))
  ).sort();

  if (loading) return <div>Loading logs...</div>;
  if (error)   return <div>{error}</div>;

  const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' };
  const td: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '8px' };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Alerts &amp; Logs</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <label>
          Severity{' '}
          <select value={filters.severity} onChange={e => updateFilter('severity', e.target.value)}>
            {severityOptions.map(o => <option key={o.value || 'all-sev'} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <label>
          Source{' '}
          <select value={filters.source} onChange={e => updateFilter('source', e.target.value)}>
            <option value="">All sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Status{' '}
          <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            {statusOptions.map(o => <option key={o.value || 'all-st'} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {/* Result count */}
      <p style={{ marginBottom: '8px', color: '#6b7280', fontSize: '14px' }}>
        Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
        {filters.status === 'false_positive' ? ' — False Positives' : ''}
      </p>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Log ID</th>
            <th style={th}>Time</th>
            <th style={th}>Event Type</th>
            <th style={th}>Source</th>
            <th style={th}>Severity</th>
            <th style={th}>Status</th>
            <th style={th}>Anomaly Score</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '16px', textAlign: 'center' }}>
                No logs match the selected filters.
              </td>
            </tr>
          )}
          {logs.map(log => {
            const statusKey = log.display_status || log.status || 'no_anomaly';
            const badge = STATUS_BADGE[statusKey] || STATUS_BADGE['no_anomaly'];
            return (
              <tr key={log.id}>
                <td style={td}>{log.id}</td>
                <td style={td}>{new Date(log.timestamp).toLocaleString()}</td>
                <td style={td}>{log.event_type || 'UNKNOWN'}</td>
                <td style={td}>{log.source}</td>
                <td style={td}>{log.severity || log.level || 'INFO'}</td>
                <td style={td}>
                  <span style={{ color: badge.color, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {badge.label}
                  </span>
                </td>
                <td style={td}>
                  {(log.anomaly_score ?? log.ml_scores?.anomaly_score ?? 0).toFixed(2)}
                </td>
                <td style={td}>
                  <button
                    onClick={() => setSelectedLog(log)}
                    style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '13px' }}
                  >
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Details Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '8px', padding: '28px',
              minWidth: '360px', maxWidth: '520px', width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Alert Details</h2>
            {([
              ['Log ID',         selectedLog.id],
              ['Event Type',     selectedLog.event_type || 'UNKNOWN'],
              ['Severity',       selectedLog.severity || selectedLog.level || 'INFO'],
              ['Source',         selectedLog.source],
              ['Timestamp',      new Date(selectedLog.timestamp).toLocaleString()],
              ['RF Score',       (selectedLog.ml_scores?.rf_score ?? 0).toFixed(2)],
              ['IF Score',       (selectedLog.ml_scores?.if_score ?? 0).toFixed(2)],
              ['Anomaly Score',  (selectedLog.anomaly_score ?? selectedLog.ml_scores?.anomaly_score ?? 0).toFixed(2)],
              ['Analyst Status', selectedLog.status_label || 'No Anomaly'],
            ] as [string, any][]).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, minWidth: '130px', color: '#374151' }}>{label}:</span>
                <span style={{ color: '#111827' }}>{String(value)}</span>
              </div>
            ))}
            <button
              onClick={() => setSelectedLog(null)}
              style={{ marginTop: '16px', padding: '8px 20px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
