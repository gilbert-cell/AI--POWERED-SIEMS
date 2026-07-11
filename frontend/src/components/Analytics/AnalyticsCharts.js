import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const SEVERITY_COLORS = { critical: '#d32f2f', high: '#f57c00', medium: '#fbc02d', low: '#388e3c' };
const getSeverityColor = (s) => SEVERITY_COLORS[s?.toLowerCase()] || '#666';

export const SeverityPieChart = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Event Distribution by Severity</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={100}
            label={({ severity, percent }) => `${severity} ${(percent * 100).toFixed(0)}%`}>
            {data.map((e, i) => <Cell key={i} fill={getSeverityColor(e.severity)} />)}
          </Pie>
          <Tooltip /><Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const EventTypesChart = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Top Event Types</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="event_type" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 14 }} />
          <YAxis /><Tooltip />
          <Bar dataKey="count" fill="#1a237e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const HourlyTrendsChart = ({ data }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Hourly Event Trends (Last 24 Hours)</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" stroke="#666" tick={{ fontSize: 14 }} /><YAxis stroke="#666" tick={{ fontSize: 14 }} />
          <Tooltip /><Legend />
          <Line type="monotone" dataKey="events" stroke="#1a237e" strokeWidth={2} name="Total Events" dot={false} />
          <Line type="monotone" dataKey="detected" stroke="#388e3c" strokeWidth={2} name="Detected" dot={false} />
          <Line type="monotone" dataKey="critical" stroke="#d32f2f" strokeWidth={2} name="Critical" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const ResponseMetricsCard = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Response Time Metrics</Typography>
      {[['Average', 'avg_response_time'], ['Minimum', 'min_response_time'], ['Maximum', 'max_response_time'],
        ['Median', 'median_response_time'], ['P95', 'p95_response_time'], ['P99', 'p99_response_time']].map(([label, key]) => (
        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, mb: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography sx={{ fontSize: 15 }}>{label}</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 'bold' }}>{data?.[key] ?? 0}s</Typography>
        </Box>
      ))}
    </CardContent>
  </Card>
);

export const DetectionAccuracyChart = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Detection Accuracy by Severity</Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="severity" tick={{ fontSize: 14 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 14 }} />
          <Tooltip formatter={(v) => `${v}%`} /><Legend />
          <Bar dataKey="accuracy" fill="#388e3c" name="Accuracy %" radius={[4, 4, 0, 0]} />
          <Bar dataKey="false_positive_rate" fill="#d32f2f" name="False Positive %" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export const AccuracyRadarChart = ({ data }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Accuracy Radar</Typography>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Accuracy" dataKey="accuracy" stroke="#388e3c" fill="#388e3c" fillOpacity={0.4} />
          <Radar name="False Positive" dataKey="falsePositive" stroke="#d32f2f" fill="#d32f2f" fillOpacity={0.3} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const AnalyticsCharts = ({ severityDist, eventTypes, hourlyTrends, responseMetrics, detectionAccuracy, radarData }) => (
  <>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={5}><SeverityPieChart data={severityDist} /></Grid>
      <Grid item xs={12} md={7}><EventTypesChart data={eventTypes} /></Grid>
    </Grid>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}><ResponseMetricsCard data={responseMetrics} /></Grid>
      <Grid item xs={12} md={4}><DetectionAccuracyChart data={detectionAccuracy} /></Grid>
      <Grid item xs={12} md={4}><AccuracyRadarChart data={radarData} /></Grid>
    </Grid>
  </>
);

export default AnalyticsCharts;
