import React from 'react';
import { Box, Container, Typography, CircularProgress, Alert, Grid, Card, CardContent, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useAnalytics, DATE_RANGE_OPTIONS, SOURCE_OPTIONS } from '../components/Analytics/useAnalytics';
import { TIME_RANGE_OPTIONS } from '../config';
import { exportCSV, exportPDF } from '../components/Analytics/exportUtils';
import StatCard from '../components/shared/StatCard';
import LiveBadge from '../components/shared/LiveBadge';
import AnalyticsCharts from '../components/Analytics/AnalyticsCharts';
import SourceMetricsTable from '../components/Analytics/SourceMetricsTable';
import TopHostsSection from '../components/Analytics/TopHostsSection';
import { formatDateTime } from '../utils/helpers';

const AnalyticsPage = () => {
  const {
    summary, severityDist, eventTypes, sourceMetrics, hourlyTrends,
    responseMetrics, detectionAccuracy, topHosts,
    loading, error, dateRange, sourceFilter, setSourceFilter,
    isLive, lastUpdated, fetchData, handleTimeRange,
    displayedDetectionAccuracy, radarData,
  } = useAnalytics();

  const exportProps = { sourceMetrics, detectionAccuracy, responseMetrics, summary, dateRange, sourceFilter, displayedDetectionAccuracy };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: 32 }}>Analytics & Reports</Typography>
          {isLive && <LiveBadge lastUpdated={lastUpdated} />}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#1a237e' }}>Time Range</InputLabel>
            <Select value={dateRange} label="Time Range" onChange={(e) => handleTimeRange(e.target.value)}
              sx={{ color: '#1a237e', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' } }}>
              {DATE_RANGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.value === 'live' ? <span style={{ color: '#b71c1c', fontWeight: 'bold' }}>● Live</span> : o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Source</InputLabel>
            <Select value={sourceFilter} label="Source" onChange={(e) => setSourceFilter(e.target.value)}>
              {SOURCE_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s === 'all' ? 'All Sources' : s.toUpperCase()}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Refresh"><IconButton onClick={fetchData} sx={{ border: '1px solid #ddd' }}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportCSV(exportProps)} size="small">Export CSV</Button>
          <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={() => exportPDF(exportProps)} size="small" sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}>Export PDF</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[['Total Events', summary?.total_events ?? 0, '', null, '#e3f2fd'],
          ['Detection Accuracy', displayedDetectionAccuracy, '%', '#388e3c', '#e8f5e9'],
          ['Avg Response Time', summary?.avg_response_time ?? 0, 's', '#f57c00', '#fff3e0'],
          ['System Uptime', summary?.system_uptime ?? 0, '%', '#7b1fa2', '#f3e5f5']].map(([label, value, unit, color, bg]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <StatCard label={label} value={value} unit={unit} color={color} bg={bg} />
          </Grid>
        ))}
      </Grid>

      <AnalyticsCharts severityDist={severityDist} eventTypes={eventTypes} hourlyTrends={hourlyTrends} responseMetrics={responseMetrics} detectionAccuracy={detectionAccuracy} radarData={radarData} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}><SourceMetricsTable sourceMetrics={sourceMetrics} /></Grid>
      </Grid>

      <TopHostsSection topHosts={topHosts} />

      <Card sx={{ backgroundColor: '#1a237e', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>Report Summary</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Period: {TIME_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label ?? dateRange} &nbsp;|&nbsp;
                Source: {sourceFilter === 'all' ? 'All Sources' : sourceFilter.toUpperCase()} &nbsp;|&nbsp;
                Generated: {formatDateTime(new Date())}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportCSV(exportProps)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}>CSV</Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => exportPDF(exportProps)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}>PDF</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AnalyticsPage;
