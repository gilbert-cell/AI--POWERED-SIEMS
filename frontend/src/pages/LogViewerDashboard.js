import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Container, Grid, Card, CardContent, Typography, Chip,
  IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Badge, TextField, InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import BugReportIcon from '@mui/icons-material/BugReport';
import ShieldIcon from '@mui/icons-material/Shield';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { logService, analyticsService } from '../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL: { color: '#d32f2f', bg: '#ffebee', label: 'Critical' },
  HIGH:     { color: '#e65100', bg: '#fff3e0', label: 'High'     },
  MEDIUM:   { color: '#f9a825', bg: '#fffde7', label: 'Medium'   },
  LOW:      { color: '#388e3c', bg: '#e8f5e9', label: 'Low'      },
};

const SOURCE_ICONS = {
  'auth-service':    <SecurityIcon sx={{ fontSize: 16 }} />,
  'firewall':        <ShieldIcon   sx={{ fontSize: 16 }} />,
  'network-monitor': <NetworkCheckIcon sx={{ fontSize: 16 }} />,
  'ids-system':      <BugReportIcon sx={{ fontSize: 16 }} />,
  'system':          <StorageIcon  sx={{ fontSize: 16 }} />,
  'kernel':          <StorageIcon  sx={{ fontSize: 16 }} />,
  'web-server':      <NetworkCheckIcon sx={{ fontSize: 16 }} />,
  'database':        <StorageIcon  sx={{ fontSize: 16 }} />,
};

const SOURCE_COLORS = {
  'auth-service':    '#1565c0',
  'firewall':        '#6a1b9a',
  'network-monitor': '#00695c',
  'ids-system':      '#c62828',
  'system':          '#e65100',
  'kernel':          '#4527a0',
  'web-server':      '#2e7d32',
  'database':        '#0277bd',
};

const POLL_INTERVAL = 5000; // ms

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, bg, icon, subtitle }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Box sx={{ color, backgroundColor: bg, borderRadius: 1.5, p: 0.6, display: 'flex' }}>{icon}</Box>
      </Box>
      <Typography sx={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
      {subtitle && <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5 }}>{subtitle}</Typography>}
    </CardContent>
  </Card>
);

// ── Severity badge ────────────────────────────────────────────────────────────
const SeverityChip = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  return (
    <Chip label={cfg.label} size="small" sx={{
      backgroundColor: cfg.bg, color: cfg.color,
      fontWeight: 700, fontSize: 11, height: 22,
    }} />
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const LogViewerDashboard = () => {
  const [logs, setLogs]               = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [sourceMetrics, setSourceMetrics] = useState({});
  const [severityDist, setSeverityDist]   = useState([]);
  const [eventTypes, setEventTypes]       = useState([]);
  const [totalLogs, setTotalLogs]         = useState(0);
  const [loading, setLoading]         = useState(true);
  const [paused, setPaused]           = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch]           = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter]     = useState('ALL');
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 50;

  const timerRef  = useRef(null);
  const tableRef  = useRef(null);

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      const [logsRes, srcRes, sevRes, evtRes] = await Promise.all([
        logService.getLogs({ page: 1, page_size: 200 }),
        analyticsService.getSourceMetrics(),
        analyticsService.getSeverityDistribution(),
        analyticsService.getEventTypes(10),
      ]);

      const rawLogs = logsRes.data?.results ?? logsRes.data?.logs ?? [];
      setLogs(rawLogs);
      setTotalLogs(logsRes.data?.count ?? rawLogs.length);
      setSourceMetrics(srcRes.data?.source_metrics ?? {});
      setSeverityDist(sevRes.data?.severity_distribution ?? []);
      setEventTypes(evtRes.data?.event_types ?? []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('LogViewerDashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-poll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!paused) {
      timerRef.current = setInterval(fetchLogs, POLL_INTERVAL);
    }
    return () => clearInterval(timerRef.current);
  }, [paused, fetchLogs]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...logs];
    if (severityFilter !== 'ALL')
      result = result.filter(l => (l.severity || '').toUpperCase() === severityFilter);
    if (sourceFilter !== 'ALL')
      result = result.filter(l => l.source === sourceFilter);
    if (search.trim())
      result = result.filter(l =>
        (l.message || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.event_type || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.source || '').toLowerCase().includes(search.toLowerCase())
      );
    setFiltered(result);
    setPage(1);
  }, [logs, severityFilter, sourceFilter, search]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const criticalCount = logs.filter(l => (l.severity || '').toUpperCase() === 'CRITICAL').length;
  const anomalyCount  = logs.filter(l => l.anomaly_score > 0.45).length;
  const sources       = [...new Set(logs.map(l => l.source).filter(Boolean))];

  const sevChartData = ['CRITICAL','HIGH','MEDIUM','LOW'].map(s => ({
    name: s,
    count: logs.filter(l => (l.severity || '').toUpperCase() === s).length,
    fill: SEVERITY_CONFIG[s]?.color,
  }));

  const pagedLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0d1b4b' }}>
            Log Viewer
          </Typography>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            backgroundColor: paused ? '#f5f5f5' : '#ffebee',
            px: 1.5, py: 0.4, borderRadius: 2,
          }}>
            <FiberManualRecordIcon sx={{
              fontSize: 10,
              color: paused ? '#9e9e9e' : '#d32f2f',
              animation: paused ? 'none' : 'pulse 1s infinite',
              '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
            }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: paused ? '#9e9e9e' : '#d32f2f' }}>
              {paused ? 'PAUSED' : 'LIVE'}
            </Typography>
            {lastUpdated && !paused && (
              <Typography variant="caption" sx={{ color: '#999', ml: 0.5 }}>
                · {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title={paused ? 'Resume live updates' : 'Pause live updates'}>
            <IconButton onClick={() => setPaused(p => !p)} sx={{ border: '1px solid #ddd' }}>
              {paused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchLogs} sx={{ border: '1px solid #ddd' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Logs" value={totalLogs.toLocaleString()}
            color="#1565c0" bg="#e3f2fd"
            icon={<StorageIcon sx={{ fontSize: 18 }} />}
            subtitle="All ingested records" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Critical" value={criticalCount}
            color="#d32f2f" bg="#ffebee"
            icon={<BugReportIcon sx={{ fontSize: 18 }} />}
            subtitle="Severity = CRITICAL" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Anomalies" value={anomalyCount}
            color="#6a1b9a" bg="#f3e5f5"
            icon={<ShieldIcon sx={{ fontSize: 18 }} />}
            subtitle="ML score ≥ 0.45" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Sources" value={sources.length}
            color="#00695c" bg="#e0f7fa"
            icon={<NetworkCheckIcon sx={{ fontSize: 18 }} />}
            subtitle="Active log sources" />
        </Grid>
      </Grid>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* Severity distribution bar chart */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 14 }}>
                Severity Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sevChartData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {sevChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top event types */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 14 }}>
                Top Event Types
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {eventTypes.slice(0, 6).map((et, i) => {
                  const max = eventTypes[0]?.count || 1;
                  return (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                        <Typography sx={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{et.event_type}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#64748b' }}>{et.count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate"
                        value={(et.count / max) * 100}
                        sx={{ height: 6, borderRadius: 3,
                          backgroundColor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': { backgroundColor: '#1a237e', borderRadius: 3 },
                        }} />
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Source breakdown */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 14 }}>
                Log Sources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {Object.entries(sourceMetrics).slice(0, 7).map(([src, m]) => (
                  <Box key={src} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: SOURCE_COLORS[src] || '#64748b' }}>
                        {SOURCE_ICONS[src] || <StorageIcon sx={{ fontSize: 16 }} />}
                      </Box>
                      <Typography sx={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{src}</Typography>
                    </Box>
                    <Chip label={m.total} size="small" sx={{
                      height: 20, fontSize: 11, fontWeight: 700,
                      backgroundColor: '#f1f5f9', color: '#334155',
                    }} />
                  </Box>
                ))}
                {Object.keys(sourceMetrics).length === 0 && (
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>No source data yet</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search logs…" value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                sx: { borderRadius: 2 },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Severity</InputLabel>
              <Select value={severityFilter} label="Severity"
                onChange={e => setSeverityFilter(e.target.value)}
                sx={{ borderRadius: 2 }}>
                <MenuItem value="ALL">All</MenuItem>
                {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
                  <MenuItem key={s} value={s}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: SEVERITY_CONFIG[s]?.color }} />
                      {s}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Source</InputLabel>
              <Select value={sourceFilter} label="Source"
                onChange={e => setSourceFilter(e.target.value)}
                sx={{ borderRadius: 2 }}>
                <MenuItem value="ALL">All Sources</MenuItem>
                {sources.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography sx={{ fontSize: 12, color: '#64748b', ml: 'auto', whiteSpace: 'nowrap' }}>
              {filtered.length} / {logs.length} logs
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ── Log table ──────────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <TableContainer component={Paper} ref={tableRef}
          sx={{ maxHeight: 520, borderRadius: 3, boxShadow: 'none' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {['Time', 'Source', 'Event Type', 'Severity', 'Score', 'Message'].map(h => (
                  <TableCell key={h} sx={{
                    fontWeight: 700, fontSize: 12, color: '#475569',
                    backgroundColor: '#f8faff', borderBottom: '2px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                  }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                    {loading ? 'Loading logs…' : 'No logs match the current filters.'}
                  </TableCell>
                </TableRow>
              ) : pagedLogs.map((log, i) => {
                const sev = (log.severity || 'LOW').toUpperCase();
                const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.LOW;
                const score = log.anomaly_score ?? log.ml_scores?.anomaly_score ?? 0;
                const isAnomaly = score >= 0.45;
                return (
                  <TableRow key={log.id ?? i} sx={{
                    backgroundColor: isAnomaly ? `${cfg.bg}88` : 'white',
                    '&:hover': { backgroundColor: '#f1f5f9' },
                    borderLeft: isAnomaly ? `3px solid ${cfg.color}` : '3px solid transparent',
                  }}>
                    <TableCell sx={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ color: SOURCE_COLORS[log.source] || '#64748b', display: 'flex' }}>
                          {SOURCE_ICONS[log.source] || <StorageIcon sx={{ fontSize: 14 }} />}
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                          {log.source || '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      {log.event_type || '—'}
                    </TableCell>
                    <TableCell><SeverityChip severity={sev} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{
                          width: 36, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden',
                        }}>
                          <Box sx={{
                            width: `${Math.round(score * 100)}%`, height: '100%', borderRadius: 3,
                            backgroundColor: score >= 0.9 ? '#d32f2f' : score >= 0.6 ? '#e65100' : '#388e3c',
                          }} />
                        </Box>
                        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                          {score > 0 ? score.toFixed(2) : '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#334155', maxWidth: 400 }}>
                      <Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>
                        {log.message || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, p: 1.5, borderTop: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>
              Page {page} of {totalPages}
            </Typography>
            <IconButton size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              {'‹'}
            </IconButton>
            <IconButton size="small" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              {'›'}
            </IconButton>
          </Box>
        )}
      </Card>
    </Container>
  );
};

export default LogViewerDashboard;
