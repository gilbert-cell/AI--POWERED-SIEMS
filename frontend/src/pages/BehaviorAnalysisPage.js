import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { behaviorService } from '../services/api';
import { toast } from 'react-toastify';

const BehaviorAnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const liveRef = React.useRef(null);

  const fetchBehaviorData = useCallback(async () => {
    try {
      setLoading(true);
      const [analysisRes, anomaliesRes] = await Promise.all([
        behaviorService.getAnalysis({ time_range: timeRange }),
        behaviorService.getAnomalies({ time_range: timeRange }),
      ]);

      setAnalysis(analysisRes.data);
      setAnomalies(anomaliesRes.data);
    } catch (error) {
      console.error('Failed to fetch behavior data:', error);
      toast.error('Failed to fetch behavior analysis data');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [timeRange]);

  useEffect(() => {
    fetchBehaviorData();
  }, [fetchBehaviorData]);

  const handleTimeRange = (range) => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setIsLive(range === 'live');
    setTimeRange(range === 'live' ? '1h' : range);
    if (range === 'live') {
      liveRef.current = setInterval(fetchBehaviorData, 5000);
    }
  };

  useEffect(() => () => { if (liveRef.current) clearInterval(liveRef.current); }, []);

  const handleViewDetails = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedAnomaly(null);
  };

  const getRiskColor = (riskLevel) => {
    const colors = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    return colors[riskLevel?.toLowerCase()] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            Behavior Analysis
          </Typography>
          {isLive && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#ffebee', px: 1.5, py: 0.5, borderRadius: 2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d32f2f', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } } }} />
              <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>LIVE</Typography>
              {lastUpdated && <Typography variant="caption" sx={{ color: '#999', ml: 0.5 }}>· {lastUpdated.toLocaleTimeString()}</Typography>}
            </Box>
          )}
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: '#1a237e' }}>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => handleTimeRange(e.target.value)}
            sx={{ color: '#1a237e', borderColor: '#1a237e', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1a237e' } }}
          >
            <MenuItem value="live"><span style={{ color: '#b71c1c', fontWeight: 'bold' }}>● Live</span></MenuItem>
            <MenuItem value="30min">30 Min</MenuItem>
            <MenuItem value="1h">1 Hour</MenuItem>
            <MenuItem value="24h">24 Hours</MenuItem>
            <MenuItem value="7d">7 Days</MenuItem>
            <MenuItem value="30d">30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Anomalies Detected
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {analysis?.total_anomalies || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Risk
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                {analysis?.high_risk_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Suspicious Users
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                {analysis?.suspicious_users || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Baseline Deviations
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                {analysis?.baseline_deviations || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Behavioral Pattern */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Behavioral Pattern Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysis?.pattern_data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="baseline" stroke="#388e3c" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="#d32f2f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Anomaly Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Anomaly Distribution by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis?.anomaly_types || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" stroke="#666" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a237e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Anomalies Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Detected Anomalies
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>User/Entity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Anomaly Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Risk Level</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {anomalies.length > 0 ? (
                  anomalies.map((anomaly) => (
                    <TableRow key={anomaly.id} hover>
                      <TableCell>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{anomaly.entity_name || 'N/A'}</TableCell>
                      <TableCell>{anomaly.anomaly_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={anomaly.risk_level}
                          color={getRiskColor(anomaly.risk_level)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 8,
                              backgroundColor: '#e0e0e0',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${anomaly.confidence || 0}%`,
                                backgroundColor: anomaly.confidence > 80 ? '#d32f2f' : anomaly.confidence > 50 ? '#f57c00' : '#388e3c',
                              }}
                            />
                          </Box>
                          <Typography variant="body2">{anomaly.confidence || 0}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleViewDetails(anomaly)}
                          sx={{ color: '#1a237e' }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                      No anomalies detected
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>
          Anomaly Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedAnomaly && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Entity
                </Typography>
                <Typography>{selectedAnomaly.entity_name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Anomaly Type
                </Typography>
                <Typography>{selectedAnomaly.anomaly_type}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Description
                </Typography>
                <Typography>{selectedAnomaly.description || selectedAnomaly.summary}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Risk Level
                </Typography>
                <Chip label={selectedAnomaly.risk_level} color={getRiskColor(selectedAnomaly.risk_level)} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Confidence Score
                </Typography>
                <Typography>{selectedAnomaly.confidence}%</Typography>
              </Box>
              {selectedAnomaly.details && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Additional Details
                  </Typography>
                  <Typography sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {typeof selectedAnomaly.details === 'string' ? selectedAnomaly.details : JSON.stringify(selectedAnomaly.details, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} sx={{ color: '#1a237e' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BehaviorAnalysisPage;
