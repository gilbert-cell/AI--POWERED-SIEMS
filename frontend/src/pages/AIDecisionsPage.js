import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Chip,
  CircularProgress, LinearProgress, Divider, Alert, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Button, Tooltip,
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Security as SecurityIcon,
  BugReport as ThreatIcon,
  Timeline as TimelineIcon,
  TrendingUp as RiskIcon,
  Lightbulb as RecoIcon,
  CheckCircle as CheckIcon,
  Warning as WarnIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import { aiService } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEV_COLOR = { critical: '#d32f2f', high: '#e65100', medium: '#f9a825', low: '#388e3c' };
const SEV_BG    = { critical: '#ffebee', high: '#fff3e0', medium: '#fffde7', low:  '#e8f5e9' };
const PRIORITY_ICON = {
  critical: <ErrorIcon sx={{ fontSize: 18, color: '#d32f2f' }} />,
  high:     <WarnIcon  sx={{ fontSize: 18, color: '#e65100' }} />,
  medium:   <WarnIcon  sx={{ fontSize: 18, color: '#f9a825' }} />,
  low:      <CheckIcon sx={{ fontSize: 18, color: '#388e3c' }} />,
};

const RiskGauge = ({ score, level }) => {
  const pct   = Math.round(score * 100);
  const color = SEV_COLOR[level] || '#1976d2';
  return (
    <Box sx={{ textAlign: 'center', py: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={pct} size={120}
          thickness={6} sx={{ color }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 900, fontSize: 26, color }}>{pct}</Typography>
          <Typography sx={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>risk</Typography>
        </Box>
      </Box>
      <Chip label={level.toUpperCase()} size="small"
        sx={{ mt: 1, backgroundColor: color, color: '#fff', fontWeight: 800, fontSize: 12 }} />
    </Box>
  );
};

const StatBox = ({ label, value, color = '#1a237e', bg = '#e8eaf6', icon }) => (
  <Box sx={{ flex: 1, p: 2, borderRadius: 2, backgroundColor: bg, textAlign: 'center', minWidth: 80 }}>
    {icon && <Box sx={{ color, mb: 0.5 }}>{icon}</Box>}
    <Typography sx={{ fontWeight: 900, fontSize: 22, color, lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.5 }}>{label}</Typography>
  </Box>
);

// ── Tab panels ────────────────────────────────────────────────────────────────

const ThreatClassification = ({ data }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={7}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            Detected Threat Classes — Last 24 h
          </Typography>
          {data.length === 0 ? (
            <Alert severity="success">No threats classified in the last 24 hours.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Threat Type', 'Count', 'Confidence', 'Severity', 'ML Score'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 15, color: '#475569' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((t, i) => (
                    <TableRow key={i} sx={{ '&:hover': { backgroundColor: '#f8faff' } }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>{t.type}</TableCell>
                      <TableCell>
                        <Chip label={t.count} size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={t.confidence}
                            sx={{ flex: 1, height: 6, borderRadius: 3,
                              '& .MuiLinearProgress-bar': { backgroundColor: SEV_COLOR[t.severity] } }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 700, minWidth: 36 }}>
                            {t.confidence}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={t.severity.toUpperCase()} size="small"
                          sx={{ backgroundColor: SEV_BG[t.severity], color: SEV_COLOR[t.severity], fontWeight: 800, fontSize: 11 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: SEV_COLOR[t.severity] }}>
                        {t.max_score.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={5}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            Threat Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 14 }} />
              <YAxis dataKey="type" type="category" width={150} tick={{ fontSize: 14 }} />
              <RTooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.slice(0, 8).map((t, i) => (
                  <Cell key={i} fill={SEV_COLOR[t.severity] || '#1976d2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

const AnomalyTimeline = ({ timeline }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
    <CardContent sx={{ p: 3 }}>
      <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 1 }}>
        Anomaly Detection Timeline — Last 24 h (Hourly)
      </Typography>
      <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3 }}>
        Real-time anomaly count and average ML score per hour. Spikes indicate attack bursts.
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={timeline} margin={{ right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 14 }} interval={2} />
          <YAxis yAxisId="left" tick={{ fontSize: 14 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 14 }} domain={[0, 1]} />
          <RTooltip />
          <Line yAxisId="left" type="monotone" dataKey="anomalies" stroke="#d32f2f"
            strokeWidth={2} dot={false} name="Anomalies" />
          <Line yAxisId="left" type="monotone" dataKey="total_logs" stroke="#1976d2"
            strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Total Logs" />
          <Line yAxisId="right" type="monotone" dataKey="avg_score" stroke="#f57c00"
            strokeWidth={2} dot={false} name="Avg ML Score" />
        </LineChart>
      </ResponsiveContainer>
      <Box sx={{ display: 'flex', gap: 3, mt: 1, justifyContent: 'center' }}>
        {[['#d32f2f','Anomalies'],['#1976d2','Total Logs (dashed)'],['#f57c00','Avg ML Score (right axis)']].map(([c,l]) => (
          <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 3, backgroundColor: c, borderRadius: 2 }} />
            <Typography sx={{ fontSize: 14, color: '#64748b' }}>{l}</Typography>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const RiskPrediction = ({ risk }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={4}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            Current Risk Score
          </Typography>
          <RiskGauge score={risk.risk_score} level={risk.risk_level} />
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontSize: 15, color: '#64748b' }}>
            Trend ratio vs prior period:{' '}
            <strong style={{ color: risk.trend_ratio > 1 ? '#d32f2f' : '#388e3c' }}>
              {risk.trend_ratio > 1 ? '▲' : '▼'} {risk.trend_ratio}×
            </strong>
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={4}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            Threat Breakdown — 24 h
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Critical Threats', value: risk.critical_count, color: '#d32f2f', bg: '#ffebee' },
              { label: 'High Threats',     value: risk.high_count,     color: '#e65100', bg: '#fff3e0' },
              { label: 'Medium Threats',   value: risk.medium_count,   color: '#f9a825', bg: '#fffde7' },
            ].map(({ label, value, color, bg }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', p: 1.5, borderRadius: 2, backgroundColor: bg }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color }}>{label}</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={4}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            7-Day Anomaly Trend
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={risk.daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 14 }} />
              <YAxis tick={{ fontSize: 14 }} />
              <RTooltip />
              <Bar dataKey="anomalies" radius={[4, 4, 0, 0]}>
                {(risk.daily_trend || []).map((d, i) => (
                  <Cell key={i} fill={d.anomalies > 10 ? '#d32f2f' : d.anomalies > 5 ? '#f57c00' : '#1976d2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

const Recommendations = ({ recommendations, performance }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            AI-Generated Security Recommendations
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recommendations.map((r, i) => (
              <Box key={i} sx={{
                p: 2.5, borderRadius: 2,
                backgroundColor: SEV_BG[r.priority] || '#f8faff',
                borderLeft: `4px solid ${SEV_COLOR[r.priority] || '#1976d2'}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {PRIORITY_ICON[r.priority]}
                  <Typography sx={{ fontWeight: 800, fontSize: 16,
                    color: SEV_COLOR[r.priority] || '#1a237e' }}>
                    {r.action}
                  </Typography>
                  <Chip label={r.priority.toUpperCase()} size="small"
                    sx={{ ml: 'auto', backgroundColor: SEV_COLOR[r.priority],
                      color: '#fff', fontWeight: 700, fontSize: 10 }} />
                </Box>
                <Typography sx={{ fontSize: 14, color: '#64748b' }}>
                  <strong>Threat:</strong> {r.threat_type}
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#475569', mt: 0.5 }}>
                  {r.detail}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={4}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0d1b4b', mb: 2 }}>
            Model Performance — 24 h
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { label: 'Total Logs Analyzed', value: performance.total_logs_24h, color: '#1976d2', bg: '#e3f2fd' },
              { label: 'Anomalies Detected',  value: performance.anomalies_detected, color: '#d32f2f', bg: '#ffebee' },
              { label: 'False Positives',     value: performance.false_positives, color: '#f57c00', bg: '#fff3e0' },
            ].map(({ label, value, color, bg }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', p: 1.5, borderRadius: 2, backgroundColor: bg }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>{label}</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 18, color }}>{value}</Typography>
              </Box>
            ))}
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#e8f5e9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>
                  ML Precision
                </Typography>
                <Typography sx={{ fontWeight: 900, color: '#388e3c' }}>
                  {performance.precision}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={performance.precision}
                sx={{ height: 8, borderRadius: 4,
                  '& .MuiLinearProgress-bar': { backgroundColor: '#388e3c' } }} />
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#e8eaf6' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>
                  Detection Rate
                </Typography>
                <Typography sx={{ fontWeight: 900, color: '#1a237e' }}>
                  {performance.detection_rate}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={performance.detection_rate}
                sx={{ height: 8, borderRadius: 4,
                  '& .MuiLinearProgress-bar': { backgroundColor: '#1a237e' } }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { label: 'Threat Classification', icon: <ThreatIcon sx={{ fontSize: 17 }} /> },
  { label: 'Anomaly Timeline',      icon: <TimelineIcon sx={{ fontSize: 17 }} /> },
  { label: 'Risk Prediction',       icon: <RiskIcon sx={{ fontSize: 17 }} /> },
  { label: 'Recommendations',       icon: <RecoIcon sx={{ fontSize: 17 }} /> },
];

const AIDecisionsPage = () => {
  const [tab, setTab]         = useState(0);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await aiService.getAnalysis();
      setData(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError('Failed to load AI analysis. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const risk = data?.risk_prediction;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0d1b4b', lineHeight: 1 }}>
              AI Analysis Engine
            </Typography>
            <Typography sx={{ fontSize: 15, color: '#64748b' }}>
              Threat detection · Anomaly analysis · Risk prediction · Recommendations
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {lastUpdated && (
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
              Updated {lastUpdated}
            </Typography>
          )}
          <Tooltip title="Refresh analysis">
            <Button variant="contained" size="small" startIcon={<RefreshIcon />}
              onClick={load} disabled={loading}
              sx={{ bgcolor: '#1a237e', color: '#fff', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#0d1b4b' } }}>
              Refresh
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Summary KPI strip ──────────────────────────────────────────── */}
      {data && risk && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <StatBox label="Risk Level" value={risk.risk_level.toUpperCase()}
            color={SEV_COLOR[risk.risk_level]} bg={SEV_BG[risk.risk_level]}
            icon={<SecurityIcon sx={{ fontSize: 18 }} />} />
          <StatBox label="Threats 24h" value={risk.total_anomalies_24h}
            color="#d32f2f" bg="#ffebee" icon={<ThreatIcon sx={{ fontSize: 18 }} />} />
          <StatBox label="Critical" value={risk.critical_count}
            color="#b71c1c" bg="#ffcdd2" />
          <StatBox label="High" value={risk.high_count}
            color="#e65100" bg="#fff3e0" />
          <StatBox label="Medium" value={risk.medium_count}
            color="#f57c00" bg="#fffde7" />
          <StatBox label="Detection Rate"
            value={`${data.model_performance.detection_rate}%`}
            color="#1a237e" bg="#e8eaf6" icon={<CheckIcon sx={{ fontSize: 18 }} />} />
          <StatBox label="ML Precision"
            value={`${data.model_performance.precision}%`}
            color="#388e3c" bg="#e8f5e9" />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
        mb: 3,
        '& .MuiTab-root':       { fontWeight: 700, textTransform: 'none', fontSize: 15, minHeight: 44 },
        '& .Mui-selected':      { color: '#1a237e' },
        '& .MuiTabs-indicator': { backgroundColor: '#1a237e', height: 3, borderRadius: 2 },
        borderBottom: '2px solid #e2e8f0',
      }}>
        {TABS.map(({ label, icon }) => (
          <Tab key={label} label={label} icon={icon} iconPosition="start" />
        ))}
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#1a237e' }} />
        </Box>
      ) : data ? (
        <>
          {tab === 0 && <ThreatClassification data={data.threat_classification} />}
          {tab === 1 && <AnomalyTimeline timeline={data.anomaly_timeline} />}
          {tab === 2 && <RiskPrediction risk={data.risk_prediction} />}
          {tab === 3 && (
            <Recommendations
              recommendations={data.recommendations}
              performance={data.model_performance}
            />
          )}
        </>
      ) : null}
    </Container>
  );
};

export default AIDecisionsPage;
