import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { analyticsService } from '../services/api';
import { toast } from 'react-toastify';

const SEVERITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
};

const SOURCE_OPTIONS = ['all', 'firewall', 'web-server', 'database', 'auth-service', 'network-monitor', 'ids-system', 'filesystem', 'application'];
const DATE_RANGE_OPTIONS = [
  { label: 'Live', value: 'live' },
  { label: '30 Min', value: '30min' },
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
];

const getSeverityColor = (severity) =>
  SEVERITY_COLORS[severity?.toLowerCase()] || '#666';

const StatCard = ({ label, value, unit = '', color, bg }) => (
  <Card sx={{ backgroundColor: bg, height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom variant="body2">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>
        {value}{unit}
      </Typography>
    </CardContent>
  </Card>
);

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [severityDist, setSeverityDist] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [sourceMetrics, setSourceMetrics] = useState({});
  const [hourlyTrends, setHourlyTrends] = useState([]);
  const [responseMetrics, setResponseMetrics] = useState(null);
  const [detectionAccuracy, setDetectionAccuracy] = useState([]);
  const [topHosts, setTopHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [dateRange, setDateRange] = useState('24h');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const liveRef = React.useRef(null);

  const handleTimeRange = (range) => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setIsLive(range === 'live');
    setDateRange(range === 'live' ? '1h' : range);
    if (range === 'live') {
      liveRef.current = setInterval(fetchAnalyticsData, 5000);
    }
  };

  useEffect(() => () => { if (liveRef.current) clearInterval(liveRef.current); }, []);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        range: dateRange,
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
      };

      const [
        summaryRes, severityRes, typesRes, sourceRes,
        hourlyRes, responseRes, accuracyRes, hostsRes,
      ] = await Promise.all([
        analyticsService.getSummary(params),
        analyticsService.getSeverityDistribution(params),
        analyticsService.getEventTypes(10, params),
        analyticsService.getSourceMetrics(params),
        analyticsService.getHourlyTrends(params),
        analyticsService.getResponseMetrics(params),
        analyticsService.getDetectionAccuracy(params),
        analyticsService.getTopHosts(10, params),
      ]);

      setSummary(summaryRes.data);
      setSeverityDist(severityRes.data.severity_distribution || []);
      setEventTypes(typesRes.data.event_types || []);
      setSourceMetrics(sourceRes.data.source_metrics || {});
      setHourlyTrends(hourlyRes.data.hourly_trends || []);
      setResponseMetrics(responseRes.data);
      setDetectionAccuracy(accuracyRes.data.accuracy_by_severity || []);
      setTopHosts(hostsRes.data.top_hosts || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load analytics data. Ensure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, sourceFilter]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleExportCSV = () => {
    try {
      // Build CSV from source metrics table
      const rows = [
        ['Source', 'Total', 'Critical', 'High', 'Medium', 'Low', 'False Positives', 'Duplicates'],
        ...Object.entries(sourceMetrics).map(([src, m]) => [
          src, m.total, m.critical, m.high, m.medium, m.low, m.false_positives, m.duplicates,
        ]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `siem-report-${dateRange}-${sourceFilter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV report downloaded');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      // Build a printable HTML report and trigger browser print-to-PDF
      const reportWindow = window.open('', '_blank');
      const rows = Object.entries(sourceMetrics)
        .map(([src, m]) =>
          `<tr><td>${src}</td><td>${m.total}</td><td>${m.critical}</td><td>${m.high}</td>
           <td>${m.medium}</td><td>${m.false_positives}</td><td>${m.duplicates}</td></tr>`
        ).join('');

      const accuracyRows = detectionAccuracy
        .map((a) =>
          `<tr><td>${a.severity}</td><td>${a.accuracy}%</td><td>${a.false_positive_rate}%</td></tr>`
        ).join('');

      reportWindow.document.write(`
        <html><head><title>SIEM Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
          h1 { color: #1a237e; } h2 { color: #333; margin-top: 32px; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th { background: #1a237e; color: white; padding: 8px 12px; text-align: left; }
          td { padding: 8px 12px; border-bottom: 1px solid #ddd; }
          .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin: 16px 0; }
          .stat-box { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
          .stat-val { font-size: 24px; font-weight: bold; color: #1a237e; }
        </style></head><body>
        <h1>AI SIEM — Analytics Report</h1>
        <p class="meta">Period: ${DATE_RANGE_OPTIONS.find(d => d.value === dateRange)?.label} &nbsp;|&nbsp;
          Source: ${sourceFilter === 'all' ? 'All Sources' : sourceFilter.toUpperCase()} &nbsp;|&nbsp;
          Generated: ${new Date().toLocaleString()}</p>

        <h2>Summary</h2>
        <div class="stat-grid">
          <div class="stat-box"><div>Total Events</div><div class="stat-val">${summary?.total_events ?? 0}</div></div>
          <div class="stat-box"><div>Detection Accuracy</div><div class="stat-val">${summary?.detection_accuracy ?? 0}%</div></div>
          <div class="stat-box"><div>Avg Response Time</div><div class="stat-val">${summary?.avg_response_time ?? 0}s</div></div>
          <div class="stat-box"><div>System Uptime</div><div class="stat-val">${summary?.system_uptime ?? 0}%</div></div>
        </div>

        <h2>Source Metrics</h2>
        <table>
          <tr><th>Source</th><th>Total</th><th>Critical</th><th>High</th><th>Medium</th><th>False Positives</th><th>Duplicates</th></tr>
          ${rows}
        </table>

        <h2>Detection Accuracy by Severity</h2>
        <table>
          <tr><th>Severity</th><th>Accuracy</th><th>False Positive Rate</th></tr>
          ${accuracyRows}
        </table>

        <h2>Response Time Metrics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Average</td><td>${responseMetrics?.avg_response_time ?? 0}s</td></tr>
          <tr><td>Minimum</td><td>${responseMetrics?.min_response_time ?? 0}s</td></tr>
          <tr><td>Maximum</td><td>${responseMetrics?.max_response_time ?? 0}s</td></tr>
          <tr><td>P95</td><td>${responseMetrics?.p95_response_time ?? 0}s</td></tr>
          <tr><td>P99</td><td>${responseMetrics?.p99_response_time ?? 0}s</td></tr>
        </table>
        </body></html>
      `);
      reportWindow.document.close();
      reportWindow.focus();
      setTimeout(() => { reportWindow.print(); }, 500);
      toast.success('PDF report ready — use browser Print → Save as PDF');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const radarData = detectionAccuracy.map((d) => ({
    subject: d.severity,
    accuracy: d.accuracy,
    falsePositive: d.false_positive_rate,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Analytics & Reports
          </Typography>
          {isLive && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#ffebee', px: 1.5, py: 0.5, borderRadius: 2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d32f2f', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } } }} />
              <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>LIVE</Typography>
              {lastUpdated && <Typography variant="caption" sx={{ color: '#999', ml: 0.5 }}>· {lastUpdated.toLocaleTimeString()}</Typography>}
            </Box>
          )}
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#1a237e' }}>Time Range</InputLabel>
            <Select
              value={dateRange}
              label="Time Range"
              onChange={(e) => handleTimeRange(e.target.value)}
              sx={{ color: '#1a237e', borderColor: '#1a237e', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' } }}
            >
              {DATE_RANGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.value === 'live' ? <span style={{ color: '#b71c1c', fontWeight: 'bold' }}>● Live</span> : o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Source</InputLabel>
            <Select value={sourceFilter} label="Source" onChange={(e) => setSourceFilter(e.target.value)}>
              {SOURCE_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s === 'all' ? 'All Sources' : s.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton onClick={fetchAnalyticsData} sx={{ border: '1px solid #ddd' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            size="small"
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            disabled={exporting}
            size="small"
            sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Events" value={summary?.total_events ?? 0} bg="#e3f2fd" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Detection Accuracy" value={summary?.detection_accuracy ?? 0} unit="%" color="#388e3c" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Avg Response Time" value={summary?.avg_response_time ?? 0} unit="s" color="#f57c00" bg="#fff3e0" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="System Uptime" value={summary?.system_uptime ?? 0} unit="%" color="#7b1fa2" bg="#f3e5f5" />
        </Grid>
      </Grid>

      {/* Severity Distribution + Top Event Types */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Event Distribution by Severity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={severityDist} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={100} label={({ severity, percent }) => `${severity} ${(percent * 100).toFixed(0)}%`}>
                    {severityDist.map((entry, i) => (
                      <Cell key={i} fill={getSeverityColor(entry.severity)} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Top Event Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventTypes} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event_type" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#1a237e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hourly Trends */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Hourly Event Trends (Last 24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="events" stroke="#1a237e" strokeWidth={2} name="Total Events" dot={false} />
                  <Line type="monotone" dataKey="detected" stroke="#388e3c" strokeWidth={2} name="Detected" dot={false} />
                  <Line type="monotone" dataKey="critical" stroke="#d32f2f" strokeWidth={2} name="Critical" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Response Metrics + Detection Accuracy Radar */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Response Time Metrics
              </Typography>
              {[
                { label: 'Average', key: 'avg_response_time' },
                { label: 'Minimum', key: 'min_response_time' },
                { label: 'Maximum', key: 'max_response_time' },
                { label: 'Median', key: 'median_response_time' },
                { label: 'P95', key: 'p95_response_time' },
                { label: 'P99', key: 'p99_response_time' },
              ].map(({ label, key }) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, mb: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {responseMetrics?.[key] ?? 0}s
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Detection Accuracy by Severity
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={detectionAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#388e3c" name="Accuracy %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="false_positive_rate" fill="#d32f2f" name="False Positive %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Accuracy Radar
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#388e3c" fill="#388e3c" fillOpacity={0.4} />
                  <Radar name="False Positive" dataKey="falsePositive" stroke="#d32f2f" fill="#d32f2f" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Source Metrics Table */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Metrics by Source System
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#1a237e' }}>
                    <TableRow>
                      {['Source', 'Total Events', 'Critical', 'High', 'Medium', 'Low', 'False Positives', 'Duplicates'].map((h) => (
                        <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }} align={h === 'Source' ? 'left' : 'center'}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(sourceMetrics).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ color: '#999', py: 3 }}>No data available</TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(sourceMetrics).map(([source, metrics]) => (
                        <TableRow key={source} hover>
                          <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{source}</TableCell>
                          <TableCell align="center">{metrics.total}</TableCell>
                          <TableCell align="center"><Chip label={metrics.critical} size="small" sx={{ backgroundColor: '#ffebee', color: '#d32f2f', fontWeight: 'bold' }} /></TableCell>
                          <TableCell align="center"><Chip label={metrics.high} size="small" sx={{ backgroundColor: '#fff3e0', color: '#f57c00', fontWeight: 'bold' }} /></TableCell>
                          <TableCell align="center"><Chip label={metrics.medium} size="small" sx={{ backgroundColor: '#fffde7', color: '#f9a825', fontWeight: 'bold' }} /></TableCell>
                          <TableCell align="center"><Chip label={metrics.low} size="small" sx={{ backgroundColor: '#e8f5e9', color: '#388e3c', fontWeight: 'bold' }} /></TableCell>
                          <TableCell align="center">{metrics.false_positives}</TableCell>
                          <TableCell align="center">{metrics.duplicates}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Hosts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Top Hosts by Event Count
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topHosts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="host" type="category" width={90} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="event_count" fill="#1a237e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Hosts Table */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Host Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Host</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Events</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topHosts.map((h, i) => {
                      const total = topHosts.reduce((s, x) => s + x.event_count, 0);
                      const pct = total ? ((h.event_count / total) * 100).toFixed(1) : 0;
                      return (
                        <TableRow key={h.host} hover>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{h.host}</TableCell>
                          <TableCell align="right">{h.event_count}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                              <Box sx={{ width: 50, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3 }}>
                                <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: '#1a237e', borderRadius: 3 }} />
                              </Box>
                              <Typography variant="caption">{pct}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Summary Footer */}
      <Card sx={{ backgroundColor: '#1a237e', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Report Summary
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Period: {DATE_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label ?? dateRange} &nbsp;|&nbsp;
                Source: {sourceFilter === 'all' ? 'All Sources' : sourceFilter.toUpperCase()} &nbsp;|&nbsp;
                Generated: {new Date().toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}>
                CSV
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF} disabled={exporting}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}>
                PDF
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AnalyticsPage;
