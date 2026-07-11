import React from 'react';
import { Box, Container, Typography, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../components/Dashboard/useDashboard';
import StatsCards from '../components/Dashboard/StatsCards';
import LiveFeed from '../components/Dashboard/LiveFeed';
import SourceBreakdown from '../components/Dashboard/SourceBreakdown';

const SEVERITY_CONFIG = [
  { key: 'critical',      label: 'Critical',      color: '#d32f2f', bg: '#ffebee' },
  { key: 'high',          label: 'High',          color: '#f57c00', bg: '#fff3e0' },
  { key: 'medium',        label: 'Medium',        color: '#f9a825', bg: '#fffde7' },
  { key: 'low',           label: 'Low',           color: '#388e3c', bg: '#e8f5e9' },
  { key: 'informational', label: 'Informational', color: '#1565c0', bg: '#e3f2fd' },
];

const AlertSeverityCard = ({ stats }) => {
  const counts = stats?.severity_counts ?? {};
  const total  = Object.values(counts).reduce((s, v) => s + v, 0);
  const navigate = useNavigate();
  return (
    <Card sx={{ mb: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontWeight: 900, color: '#1a237e', fontSize: 20 }}>Alert Severity</Typography>
          <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Click any card to filter logs</Typography>
        </Box>
        <Grid container spacing={2}>
          {SEVERITY_CONFIG.map(({ key, label, color, bg }) => {
            const count = counts[key] ?? 0;
            const pct   = total > 0 ? Math.round(count / total * 100) : 0;
            return (
              <Grid item xs={12} sm={6} md={12/5} key={key}>
                <Box
                  onClick={() => navigate(`/logs?severity=${key}`)}
                  sx={{
                    backgroundColor: bg, borderRadius: 2, p: 1.5,
                    border: `1px solid ${color}22`, cursor: 'pointer',
                    transition: 'all .15s',
                    '&:hover': { boxShadow: `0 0 0 2px ${color}`, transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, color, fontSize: 16 }}>● {label}</Typography>
                    <Typography sx={{ fontWeight: 900, color, fontSize: 26 }}>{count.toLocaleString()}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={pct}
                    sx={{ height: 6, borderRadius: 3, backgroundColor: `${color}22`,
                      '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 } }} />
                  <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.5 }}>{pct}% of total</Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

const TIME_OPTIONS = [
  { value: 'live', label: '● Live', live: true },
  { value: '30min', label: 'Last 30 Minutes' },
  { value: '1h', label: 'Last 1 Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
];

const Dashboard = () => {
  const { stats, trends, topAlerts, health, sourceStats, loading, error, isLive, lastUpdated, timeRange, fetchData, handleTimeRange } = useDashboard();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: { xs: '2rem', sm: '2.125rem' } }}>Dashboard</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: timeRange === 'live' ? '#b71c1c' : '#1a237e', backgroundColor: timeRange === 'live' ? '#ffebee' : '#e8eaf6', px: 1.5, py: 0.4, borderRadius: 2 }}>
            {TIME_OPTIONS.find(o => o.value === timeRange)?.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 150 }, flex: { xs: 1, sm: 'initial' } }}>
            <InputLabel sx={{ color: '#1a237e' }}>Time Range</InputLabel>
            <Select value={timeRange} label="Time Range" onChange={(e) => handleTimeRange(e.target.value)}
              sx={{ color: '#1a237e', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' } }}>
              {TIME_OPTIONS.map(({ value, label, live }) => (
                <MenuItem key={value} value={value}>{live ? <span style={{ color: '#b71c1c', fontWeight: 'bold' }}>{label}</span> : label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh now"><IconButton onClick={fetchData} sx={{ border: '1px solid #ddd', flexShrink: 0 }}><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <StatsCards stats={stats} />
      <AlertSeverityCard stats={stats} />
      <LiveFeed limit={25} pollInterval={3000} />
    </Container>
  );
};

export default Dashboard;
