import { toast } from 'react-toastify';
import { TIME_RANGE_OPTIONS } from '../../config';
import { formatDateTime } from '../../utils/helpers';

export const exportCSV = ({ sourceMetrics, dateRange, sourceFilter }) => {
  try {
    const rows = [
      ['Source', 'Total', 'Critical', 'High', 'Medium', 'Low', 'False Positives', 'Duplicates'],
      ...Object.entries(sourceMetrics).map(([src, m]) => [src, m.total, m.critical, m.high, m.medium, m.low, m.false_positives, m.duplicates]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `siem-report-${dateRange}-${sourceFilter}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('CSV report downloaded');
  } catch { toast.error('Failed to export CSV'); }
};

export const exportPDF = ({ summary, sourceMetrics, detectionAccuracy, responseMetrics, dateRange, sourceFilter, displayedDetectionAccuracy }) => {
  try {
    const win = window.open('', '_blank');
    const label = TIME_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label ?? dateRange;
    const srcLabel = sourceFilter === 'all' ? 'All Sources' : sourceFilter.toUpperCase();

    const sourceRows = Object.entries(sourceMetrics).map(([src, m]) =>
      `<tr><td>${src}</td><td>${m.total}</td><td>${m.critical}</td><td>${m.high}</td><td>${m.medium}</td><td>${m.false_positives}</td><td>${m.duplicates}</td></tr>`
    ).join('');

    const accuracyRows = detectionAccuracy.map((a) =>
      `<tr><td>${a.severity}</td><td>${a.accuracy}%</td><td>${a.false_positive_rate}%</td></tr>`
    ).join('');

    win.document.write(`<html><head><title>SIEM Analytics Report</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{color:#1a237e}h2{color:#333;margin-top:32px}
      table{border-collapse:collapse;width:100%;margin-top:12px}th{background:#1a237e;color:white;padding:8px 12px;text-align:left}
      td{padding:8px 12px;border-bottom:1px solid #ddd}.meta{color:#666;font-size:13px;margin-bottom:24px}
      .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0}
      .stat-box{border:1px solid #ddd;border-radius:6px;padding:12px}.stat-val{font-size:24px;font-weight:bold;color:#1a237e}</style></head><body>
      <h1>AI SIEM — Analytics Report</h1>
      <p class="meta">Period: ${label} | Source: ${srcLabel} | Generated: ${formatDateTime(new Date())}</p>
      <h2>Summary</h2>
      <div class="stat-grid">
        <div class="stat-box"><div>Total Events</div><div class="stat-val">${summary?.total_events ?? 0}</div></div>
        <div class="stat-box"><div>Detection Accuracy</div><div class="stat-val">${displayedDetectionAccuracy}%</div></div>
        <div class="stat-box"><div>Avg Response Time</div><div class="stat-val">${summary?.avg_response_time ?? 0}s</div></div>
        <div class="stat-box"><div>System Uptime</div><div class="stat-val">${summary?.system_uptime ?? 0}%</div></div>
      </div>
      <h2>Source Metrics</h2>
      <table><tr><th>Source</th><th>Total</th><th>Critical</th><th>High</th><th>Medium</th><th>False Positives</th><th>Duplicates</th></tr>${sourceRows}</table>
      <h2>Detection Accuracy by Severity</h2>
      <table><tr><th>Severity</th><th>Accuracy</th><th>False Positive Rate</th></tr>${accuracyRows}</table>
      <h2>Response Time Metrics</h2>
      <table><tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Average</td><td>${responseMetrics?.avg_response_time ?? 0}s</td></tr>
        <tr><td>Minimum</td><td>${responseMetrics?.min_response_time ?? 0}s</td></tr>
        <tr><td>Maximum</td><td>${responseMetrics?.max_response_time ?? 0}s</td></tr>
        <tr><td>P95</td><td>${responseMetrics?.p95_response_time ?? 0}s</td></tr>
        <tr><td>P99</td><td>${responseMetrics?.p99_response_time ?? 0}s</td></tr>
      </table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
    toast.success('PDF report ready — use browser Print → Save as PDF');
  } catch { toast.error('Failed to generate PDF'); }
};
