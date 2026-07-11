import React from 'react';
import { Box, Container, Typography, CircularProgress, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useBehavior } from '../components/Behavior/useBehavior';
import BehaviorCharts from '../components/Behavior/BehaviorCharts';
import AnomaliesTable from '../components/Behavior/AnomaliesTable';
import StatCard from '../components/shared/StatCard';
import LiveBadge from '../components/shared/LiveBadge';

const STAT_CARDS = [
  { label: 'Anomalies Detected', key: 'total_anomalies',      bg: '#e3f2fd' },
  { label: 'High Risk',          key: 'high_risk_count',      bg: '#fff3e0', color: '#f57c00' },
  { label: 'Suspicious Users',   key: 'suspicious_users',     bg: '#f3e5f5', color: '#7b1fa2' },
  { label: 'Baseline Deviations',key: 'baseline_deviations',  bg: '#e8f5e9', color: '#388e3c' },
];

const BehaviorAnalysisPage = () => {
  const { analysis, anomalies, loading, timeRange, isLive, lastUpdated, handleTimeRange } = useBehavior();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Behavior Analysis</Typography>
          {isLive && <LiveBadge lastUpdated={lastUpdated} />}
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: '#1a237e' }}>Time Range</InputLabel>
          <Select value={timeRange} label="Time Range" onChange={(e) => handleTimeRange(e.target.value)}
            sx={{ color: '#1a237e', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' } }}>
            <MenuItem value="live"><span style={{ color: '#b71c1c', fontWeight: 'bold' }}>● Live</span></MenuItem>
            {['30min','1h','24h','7d','30d'].map((v) => <MenuItem key={v} value={v}>Last {v}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {STAT_CARDS.map(({ label, key, bg, color }) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <StatCard label={label} value={analysis?.[key] || 0} bg={bg} color={color} />
          </Grid>
        ))}
      </Grid>

      <BehaviorCharts analysis={analysis} />
      <AnomaliesTable anomalies={anomalies} />
    </Container>
  );
};

export default BehaviorAnalysisPage;
