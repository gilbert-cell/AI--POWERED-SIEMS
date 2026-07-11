import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Container, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, LinearProgress, TextField, InputAdornment, Stack,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ComputerIcon from '@mui/icons-material/Computer';
import RefreshIcon from '@mui/icons-material/Refresh';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { logService } from '../services/api';
import { formatLogForDisplay, getHostLogCategory, getAuthResult } from '../utils/helpers';

const POLL_MS = 10000;

const TIME_RANGES = [
  { value: '',     label: 'All time' },
  { value: '30min',label: 'Last 30 min' },
  { value: '1h',   label: 'Last 1 hour' },
  { value: '24h',  label: 'Last 24 hours' },
  { value: '7d',   label: 'Last 7 days' },
  { value: '30d',  label: 'Last 30 days' },
];

const SEVERITY_CONFIG = {
  INFORMATIONAL: { color: '#1565c0', bg: '#e3f2fd' },
  CRITICAL:      { color: '#dc2626', bg: '#fee2e2' },
  HIGH:          { color: '#ea580c', bg: '#ffedd5' },
  MEDIUM:        { color: '#ca8a04', bg: '#fefce8' },
  LOW:           { color: '#16a34a', bg: '#dcfce7' },
};

// ── Shared red pulsing live badge ─────────────────────────────────────────────
const LiveDot = ({ label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: -1 }}>
    <Box sx={{
      width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626',
      boxShadow: '0 0 0 2px #fecaca',
      animation: 'livePulse 1.5s infinite',
      '@keyframes livePulse': {
        '0%,100%': { opacity: 1, boxShadow: '0 0 0 2px #fecaca' },
        '50%':     { opacity: 0.4, boxShadow: '0 0 0 4px #fca5a5' },
      },
    }} />
    <Typography sx={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{label}</Typography>
  </Box>
);

const SeverityChip = ({ severity }) => {
  const s = (severity || 'LOW').toUpperCase();
  const cfg = SEVERITY_CONFIG[s] || SEVERITY_CONFIG.LOW;
  return (
    <Chip label={s} size="small" sx={{
      backgroundColor: cfg.bg, color: cfg.color,
      fontWeight: 800, fontSize: 13, height: 24,
    }} />
  );
};

const LogTable = ({ logs, loading, columns }) => (
  <TableContainer component={Paper} sx={{ maxHeight: 480, borderRadius: 0, boxShadow: 'none', borderTop: '1px solid #e2e8f0' }}>
    <Table stickyHeader size="small">
      <TableHead>
        <TableRow>
          {columns.map(c => (
            <TableCell key={c} sx={{
              fontWeight: 900, fontSize: 14, color: '#475569',
              backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1',
              whiteSpace: 'nowrap',
            }}>{c}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={columns.length} sx={{ p: 0 }}>
              <LinearProgress />
            </TableCell>
          </TableRow>
        ) : logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
              No logs found.
            </TableCell>
          </TableRow>
        ) : logs.map((log, i) => {
          const sev = (log.severity || 'LOW').toUpperCase();
          const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.LOW;
          const display = formatLogForDisplay(log);
          return (
            <TableRow key={log.id ?? i} sx={{
              '&:hover': { backgroundColor: '#f8fbff' },
              '& td': { borderBottom: '1px solid #edf2f7' },
              borderLeft: display.score >= 0.45 ? `4px solid ${cfg.color}` : '4px solid transparent',
            }}>
              <TableCell sx={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                {display.timestamp}
              </TableCell>
              <TableCell sx={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>
                {display.host}
              </TableCell>
              <TableCell sx={{ fontSize: 14, color: '#475569' }}>
                {display.process}
              </TableCell>
              <TableCell><SeverityChip severity={sev} /></TableCell>
              <TableCell sx={{ fontSize: 14, color: '#334155', maxWidth: 500 }}>
                <Typography sx={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480 }}>
                  {display.summary}
                </Typography>
                {display.details && (
                  <Typography sx={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480, mt: 0.25 }}>
                    {display.details}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

const AUTH_RESULT_CONFIG = {
  failed:  { label: 'FAILED',  color: '#dc2626', bg: '#fee2e2' },
  success: { label: 'SUCCESS', color: '#16a34a', bg: '#dcfce7' },
  info:    { label: 'INFO',    color: '#1565c0', bg: '#e3f2fd' },
};

const AuthResultChip = ({ log }) => {
  const result = getAuthResult(log);
  const cfg = AUTH_RESULT_CONFIG[result];
  return (
    <Chip label={cfg.label} size="small" sx={{
      backgroundColor: cfg.bg, color: cfg.color,
      fontWeight: 800, fontSize: 12, height: 22,
    }} />
  );
};

const AuthLogTable = ({ logs, loading }) => (
  <TableContainer component={Paper} sx={{ maxHeight: 480, borderRadius: 0, boxShadow: 'none', borderTop: '1px solid #e2e8f0' }}>
    <Table stickyHeader size="small">
      <TableHead>
        <TableRow>
          {['Time', 'Host', 'Process', 'Status', 'Severity', 'Message'].map(c => (
            <TableCell key={c} sx={{
              fontWeight: 900, fontSize: 14, color: '#475569',
              backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1',
              whiteSpace: 'nowrap',
            }}>{c}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6} sx={{ p: 0 }}><LinearProgress /></TableCell></TableRow>
        ) : logs.length === 0 ? (
          <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>No logs found.</TableCell></TableRow>
        ) : logs.map((log, i) => {
          const sev = (log.severity || 'LOW').toUpperCase();
          const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.LOW;
          const display = formatLogForDisplay(log);
          const result = getAuthResult(log);
          const rowBg = result === 'failed' ? '#fff8f8' : result === 'success' ? '#f0fdf4' : undefined;
          return (
            <TableRow key={log.id ?? i} sx={{
              backgroundColor: rowBg,
              '&:hover': { backgroundColor: result === 'failed' ? '#fff0f0' : result === 'success' ? '#e8faf0' : '#f8fbff' },
              '& td': { borderBottom: '1px solid #edf2f7' },
              borderLeft: result === 'failed' ? '4px solid #dc2626' : result === 'success' ? '4px solid #16a34a' : '4px solid #1565c0',
            }}>
              <TableCell sx={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>{display.timestamp}</TableCell>
              <TableCell sx={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>{display.host}</TableCell>
              <TableCell sx={{ fontSize: 14, color: '#475569' }}>{display.process}</TableCell>
              <TableCell><AuthResultChip log={log} /></TableCell>
              <TableCell><SeverityChip severity={sev} /></TableCell>
              <TableCell sx={{ fontSize: 14, color: '#334155', maxWidth: 460 }}>
                <Typography sx={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 440 }}>
                  {display.summary}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

// ── Host Monitoring ───────────────────────────────────────────────────────────
const SYSTEM_SEVERITY_PRIORITY = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFORMATIONAL: 4 };

const HOST_SECTIONS = [
  { title: 'Authentication',   subtitle: 'Failed passwords, accepted logins, PAM session events',       color: '#d32f2f', bg: '#ffebee', isAuth: true,   filter: l => getHostLogCategory(l) === 'auth' },
  { title: 'Privilege Activity', subtitle: 'sudo and pkexec session opens, closes, and commands',       color: '#e65100', bg: '#fff3e0', isAuth: false,  filter: l => getHostLogCategory(l) === 'privilege_activity' },
  { title: 'Port Scanning',    subtitle: 'UFW blocked connections and port scan detection',              color: '#7c3aed', bg: '#f5f3ff', isAuth: false,  filter: l => ['PORT_SCAN', 'FIREWALL_BLOCK'].includes(l.event_type) || /ufw block/i.test(l.message || '') },
  { title: 'System Activity',  subtitle: 'Kernel events, OOM killer, NetworkManager, and system errors', color: '#0369a1', bg: '#f0f9ff', isAuth: false,  filter: l => getHostLogCategory(l) === 'system_activity' },
];

const HostMonitoring = ({ logs, loading, search, live }) => {
  const filtered = logs.filter(l =>
    !search || l.message?.toLowerCase().includes(search.toLowerCase()) ||
    l.event_type?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {live && <LiveDot label="Live" />}
      {HOST_SECTIONS.map(({ title, subtitle, color, bg, filter, isAuth }) => {
        const sectionLogs = filtered.filter(filter);
        const sorted = title === 'System Activity'
          ? [...sectionLogs].sort((a, b) =>
              (SYSTEM_SEVERITY_PRIORITY[a.severity?.toUpperCase()] ?? 4) -
              (SYSTEM_SEVERITY_PRIORITY[b.severity?.toUpperCase()] ?? 4))
          : sectionLogs;
        const failCount    = isAuth ? sectionLogs.filter(l => getAuthResult(l) === 'failed').length  : 0;
        const successCount = isAuth ? sectionLogs.filter(l => getAuthResult(l) === 'success').length : 0;
        const criticalCount = !isAuth && title === 'System Activity'
          ? sectionLogs.filter(l => ['CRITICAL','HIGH'].includes((l.severity || '').toUpperCase())).length : 0;
        return (
          <Card key={title} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 14px 34px rgba(15, 23, 42, 0.07) !important', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: { xs: 2, md: 3 }, py: 2, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 18, color }}>{title}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#64748b' }}>{subtitle}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isAuth && (
                    <>
                      <Chip label={`${failCount} failed`}   size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800 }} />
                      <Chip label={`${successCount} success`} size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800 }} />
                    </>
                  )}
                  {criticalCount > 0 && (
                    <Chip label={`${criticalCount} critical`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800 }} />
                  )}
                  <Chip label={sectionLogs.length} sx={{ backgroundColor: color, color: '#fff', fontWeight: 900, minWidth: 48 }} />
                </Box>
              </Box>
              {isAuth
                ? <AuthLogTable logs={sorted} loading={loading} />
                : <LogTable logs={sorted} loading={loading} columns={['Time', 'Host', 'Process', 'Severity', 'Message']} />
              }
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const LogViewerDashboard = () => {
  const [hostLogs, setHostLogs]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [live, setLive]               = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown]     = useState(POLL_MS / 1000);
  const [search, setSearch]           = useState('');
  const [timeRange, setTimeRange]     = useState('7d');
  const pollRef                       = useRef(null);
  const countRef                      = useRef(null);

  const fetchHost = useCallback(async (range) => {
    try {
      const res = await logService.getLogs({ page: 1, page_size: 1000, dataset_type: 'host', ...(range ? { range } : {}) });
      const all = res.data?.results ?? res.data?.logs ?? [];
      setHostLogs(all);
      setLive(true);
      setCountdown(POLL_MS / 1000);
    } catch {}
  }, []);

  // Reload whenever timeRange changes
  useEffect(() => {
    setLoading(true);
    setLive(false);
    fetchHost(timeRange).finally(() => setLoading(false));
  }, [timeRange, fetchHost]);

  // Auto-refresh polling
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countRef.current) clearInterval(countRef.current);
    if (!autoRefresh) return;

    setCountdown(POLL_MS / 1000);
    countRef.current = setInterval(() => setCountdown(c => c > 1 ? c - 1 : POLL_MS / 1000), 1000);
    pollRef.current  = setInterval(() => fetchHost(timeRange), POLL_MS);

    return () => { clearInterval(pollRef.current); clearInterval(countRef.current); };
  }, [autoRefresh, timeRange, fetchHost]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchHost(timeRange).finally(() => setLoading(false));
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          mb: 3, p: { xs: 2, md: 3 }, borderRadius: 2,
          border: '1px solid #dbe5f3',
          background: 'linear-gradient(135deg, #ffffff 0%, #edf7ff 58%, #f0fdf4 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 900, letterSpacing: 0 }}>SIEM Telemetry</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }}>Log Monitoring</Typography>
            <Typography sx={{ color: '#64748b', mt: 1, maxWidth: 620 }}>
              Monitor host activity by attack family, process signal, and event severity.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: '#fff', borderRadius: 1 }}>
              <InputLabel sx={{ fontSize: 13 }}>Time Range</InputLabel>
              <Select value={timeRange} label="Time Range" onChange={e => setTimeRange(e.target.value)} sx={{ fontSize: 13, borderRadius: 1 }}>
                {TIME_RANGES.map(r => (
                  <MenuItem key={r.value} value={r.value} sx={{ fontSize: 13 }}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Auto-refresh controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1, px: 1, py: 0.5 }}>
              <Tooltip title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}>
                <IconButton size="small" onClick={() => setAutoRefresh(v => !v)} sx={{ color: autoRefresh ? '#dc2626' : '#94a3b8' }}>
                  {autoRefresh ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              {autoRefresh ? (
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#dc2626', minWidth: 52 }}>
                  in {countdown}s
                </Typography>
              ) : (
                <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 52 }}>Paused</Typography>
              )}
            </Box>

            <Tooltip title="Refresh now">
              <IconButton onClick={handleManualRefresh} size="small" sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {live && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{
                  width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626',
                  boxShadow: '0 0 0 2px #fecaca',
                  animation: 'headerPulse 1.5s infinite',
                  '@keyframes headerPulse': { '0%,100%': { opacity: 1, boxShadow: '0 0 0 2px #fecaca' }, '50%': { opacity: 0.4, boxShadow: '0 0 0 4px #fca5a5' } },
                }} />
                <Typography sx={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>LIVE</Typography>
              </Box>
            )}
            <Chip icon={<ComputerIcon />} label={`${hostLogs.length} logs monitored`} sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 900 }} />
          </Stack>
        </Box>
        <TextField
          size="small" placeholder="Search logs…" value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mt: 2.5, width: { xs: '100%', sm: 360 }, bgcolor: '#fff', borderRadius: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
            sx: { borderRadius: 2 },
          }}
        />
      </Paper>

      <HostMonitoring logs={hostLogs} loading={loading} search={search} live={live} />
    </Container>
  );
};

export default LogViewerDashboard;
