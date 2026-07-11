import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress, Paper, Grid, Card, CardContent, LinearProgress, Alert } from '@mui/material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../services/api';

const MetricCard = ({ label, value, unit = '%', color = '#1976d2' }) => (
  <Card sx={{ flex: 1, minWidth: 200 }}>
    <CardContent>
      <Typography color="textSecondary">{label}</Typography>
      <Typography variant="h4" sx={{ color, fontWeight: 'bold' }}>{value}{unit}</Typography>
    </CardContent>
  </Card>
);

const EvaluationPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getEvaluation();
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load evaluation metrics');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;

  if (error) return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="info">{error}</Alert></Container>;

  if (!metrics) return <Container maxWidth="lg" sx={{ py: 4 }}><Typography>No evaluation data available</Typography></Container>;

  // Prepare data for charts
  const responseTimeData = [
    { name: 'Avg', value: metrics.response_time.avg },
    { name: 'P50', value: metrics.response_time.p50 },
    { name: 'P95', value: metrics.response_time.p95 },
    { name: 'P99', value: metrics.response_time.p99 },
  ];

  const severityData = Object.entries(metrics.detection_by_severity || {}).map(([sev, data]) => ({
    severity: sev,
    detection: data.detection_rate,
    confirmed: data.confirmed,
    total: data.total,
  }));

  const eventTypeData = Object.entries(metrics.detection_by_event_type || {}).map(([etype, data]) => ({
    event_type: etype.replace(/_/g, ' '),
    detection: data.detection_rate,
    confirmed: data.confirmed,
    total: data.total,
  }));

  const confusionMatrix = metrics.confusion_matrix || {};
  const cmData = [
    { name: 'True Pos', value: confusionMatrix.true_positives || 0, fill: '#4caf50' },
    { name: 'False Pos', value: confusionMatrix.false_positives || 0, fill: '#ff9800' },
    { name: 'True Neg', value: confusionMatrix.true_negatives || 0, fill: '#2196f3' },
    { name: 'False Neg', value: confusionMatrix.false_negatives || 0, fill: '#f44336' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#1a237e' }}>Evaluation & Performance Metrics</Typography>

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <MetricCard label="Accuracy" value={Number(metrics.accuracy * 100).toFixed(1)} />
        <MetricCard label="Precision" value={Number(metrics.precision * 100).toFixed(1)} color="#4caf50" />
        <MetricCard label="Recall" value={Number(metrics.recall * 100).toFixed(1)} color="#ff9800" />
        <MetricCard label="F1-Score" value={Number(metrics.f1_score * 100).toFixed(1)} color="#9c27b0" />
        <MetricCard label="False Positive Rate" value={Number(metrics.false_positive_rate * 100).toFixed(1)} color="#f44336" />
      </Box>

      {/* Event Statistics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>System Statistics</Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Total Events</Typography>
            <Typography variant="h6">{metrics.total_events}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Labeled Anomalies</Typography>
            <Typography variant="h6">{metrics.total_anomalies}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">Confirmed Threats</Typography>
            <Typography variant="h6">{metrics.confusion_matrix?.true_positives || 0}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="textSecondary">False Positives</Typography>
            <Typography variant="h6" sx={{ color: '#f44336' }}>{metrics.total_false_positives}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Confusion Matrix */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Confusion Matrix</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={cmData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80}>
                  {cmData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Response Time Percentiles */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Response Time (ms)</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Detection by Severity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Detection Rate by Severity</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="detection" fill="#4caf50" name="Detection Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Detection by Event Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Top Event Types - Detection Rate</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_type" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="detection" fill="#ff9800" name="Detection Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Performance Summary */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Performance Summary</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Overall Accuracy</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(metrics.accuracy * 100).toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={metrics.accuracy * 100} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Precision (False Positives Control)</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(metrics.precision * 100).toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={metrics.precision * 100} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' } }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Recall (Threat Detection Rate)</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(metrics.recall * 100).toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={metrics.recall * 100} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' } }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">F1-Score (Harmonic Mean)</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{Number(metrics.f1_score * 100).toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={metrics.f1_score * 100} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: '#9c27b0' } }} />
          </Box>
        </Box>
      </Paper>

      {/* Insights */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Insights</Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li><Typography variant="body2">The system achieved <strong>{Number(metrics.accuracy * 100).toFixed(1)}% overall accuracy</strong> in threat detection and classification.</Typography></li>
          <li><Typography variant="body2">Precision of <strong>{Number(metrics.precision * 100).toFixed(1)}%</strong> indicates <strong>{Number((1 - metrics.precision) * 100).toFixed(1)}% false positive rate</strong> — important for reducing alert fatigue.</Typography></li>
          <li><Typography variant="body2">Recall of <strong>{Number(metrics.recall * 100).toFixed(1)}%</strong> means the system detects <strong>{Number(metrics.recall * 100).toFixed(1)}% of actual threats</strong>.</Typography></li>
          <li><Typography variant="body2">Average response time: <strong>{Number(metrics.response_time.avg).toFixed(2)} ms</strong> — sub-second detection and alerting.</Typography></li>
          <li><Typography variant="body2">P95 response time: <strong>{Number(metrics.response_time.p95).toFixed(2)} ms</strong> — 95% of events processed within this latency.</Typography></li>
        </Box>
      </Paper>
    </Container>
  );
};

export default EvaluationPage;
