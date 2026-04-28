import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topAlerts, setTopAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [sourceStats, setSourceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRange, setTimeRange] = useState('live');
  const liveRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, sourceStatsRes, trendsRes, topAlertsRes, healthRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getSourceStats(),
        dashboardService.getAlertTrends(30),
        dashboardService.getTopAlerts(10),
        dashboardService.getSystemHealth(),
      ]);

      setStats(statsRes.data);
      setSourceStats(sourceStatsRes.data);
      // backend returns { trends: [...] }
      setTrends(trendsRes.data?.trends ?? []);
      // backend returns { top_alerts: [...] }
      setTopAlerts(topAlertsRes.data?.top_alerts ?? []);
      setHealth(healthRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRange = (range) => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setTimeRange(range);
    setIsLive(range === 'live');
    if (range === 'live') {
      liveRef.current = setInterval(fetchDashboardData, 5000);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Start live by default
    liveRef.current = setInterval(fetchDashboardData, 5000);
    setIsLive(true);
    return () => { if (liveRef.current) clearInterval(liveRef.current); };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Dashboard
          </Typography>
          {isLive && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#ffebee', px: 1.5, py: 0.5, borderRadius: 2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d32f2f', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } } }} />
              <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>LIVE</Typography>
              {lastUpdated && <Typography variant="caption" sx={{ color: '#999', ml: 0.5 }}>· {lastUpdated.toLocaleTimeString()}</Typography>}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#1a237e' }}>Time Range</InputLabel>
            <Select value={timeRange} label="Time Range"
              onChange={(e) => handleTimeRange(e.target.value)}
              sx={{ color: '#1a237e', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' } }}>
              <MenuItem value="live"><span style={{ color: '#b71c1c', fontWeight: 'bold' }}>● Live</span></MenuItem>
              <MenuItem value="1h">1 Hour</MenuItem>
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchDashboardData} sx={{ border: '1px solid #ddd' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Alerts
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {stats?.total_alerts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical Alerts
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                {stats?.critical_alerts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                False Positives
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                {stats?.false_positives || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Detection Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                {stats?.detection_rate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Source Breakdown — shows all real sources from DB */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.keys(sourceStats?.source_counts ?? {}).length > 0
          ? Object.entries(sourceStats.source_counts).map(([source, count]) => (
            <Grid item xs={12} sm={6} md={4} key={source}>
              <Card sx={{ backgroundColor: '#f5f5f5' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ textTransform: 'uppercase' }}>
                    {source} logs
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{count}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    False positives: {sourceStats?.false_positive_counts?.[source] ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
          : ['network', 'dos', 'intrusion'].map((source) => (
            <Grid item xs={12} sm={4} key={source}>
              <Card sx={{ backgroundColor: '#f5f5f5' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ textTransform: 'uppercase' }}>
                    {source} logs
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>0</Typography>
                  <Typography variant="body2" color="textSecondary">False positives: 0</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        }
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Alert Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Alert Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="alerts" stroke="#1a237e" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" stroke="#388e3c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Alert Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Top Alert Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topAlerts || []}
                    dataKey="count"
                    nameKey="alert_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(topAlerts || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#1a237e', '#d32f2f', '#f57c00', '#388e3c', '#7b1fa2'][index % 5]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                System Health Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      API Status
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                      {health?.api_status || 'Unknown'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Database
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 'bold' }}>
                      {health?.database_status || 'Unknown'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f3e5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      AI Models
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                      {health?.ai_models_status || 'Unknown'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      CPU Usage
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                      {health?.cpu_usage || '0'}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
