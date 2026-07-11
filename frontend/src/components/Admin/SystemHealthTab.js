import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material';

const METRICS = [
  { key: 'cpuUsage',    label: 'CPU Usage',    color: '#ff6b6b' },
  { key: 'memoryUsage', label: 'Memory Usage', color: '#ffa500' },
  { key: 'diskUsage',   label: 'Disk Usage',   color: '#4caf50' },
];

const SystemHealthTab = ({ systemHealth }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ backgroundColor: systemHealth.status === 'healthy' ? '#e8f5e9' : '#fff3e0' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {systemHealth.status === 'healthy' ? <CheckCircleIcon sx={{ color: '#2e7d32' }} /> : <WarningIcon sx={{ color: '#f57c00' }} />}
            <Typography color="textSecondary" variant="body2">System Status</Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{systemHealth.status}</Typography>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Card><CardContent>
        <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>Uptime</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{systemHealth.uptime}</Typography>
      </CardContent></Card>
    </Grid>

    <Grid item xs={12} sm={6} md={4}>
      <Card><CardContent>
        <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>Active Connections</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{systemHealth.activeConnections}</Typography>
      </CardContent></Card>
    </Grid>

    {METRICS.map(({ key, label, color }) => (
      <Grid item xs={12} sm={6} md={3} key={key}>
        <Card><CardContent>
          <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>{label}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{systemHealth[key]}%</Typography>
            <Box sx={{ flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ width: `${systemHealth[key]}%`, height: '100%', backgroundColor: color }} />
            </Box>
          </Box>
        </CardContent></Card>
      </Grid>
    ))}
  </Grid>
);

export default SystemHealthTab;
