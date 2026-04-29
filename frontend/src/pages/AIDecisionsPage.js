import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Card, CardContent, Typography, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, CircularProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Slider, Alert, Tabs, Tab,
} from '@mui/material';
import { Refresh as RefreshIcon, Edit as EditIcon } from '@mui/icons-material';
import { aiService } from '../services/api';
import { toast } from 'react-toastify';

const ACTION_COLORS = {
  BLOCK: '#d32f2f', INVESTIGATE: '#f57c00', MONITOR: '#1565c0',
  ESCALATE: '#6a1b9a', QUARANTINE: '#880e4f',
};

const AIDecisionsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [models, setModels] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editModelOpen, setEditModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [weights, setWeights] = useState({});
  const [advancedData, setAdvancedData] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aiService.getDecisions();
      setDecisions(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch AI decisions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aiService.getModels();
      setModels(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch AI models');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccuracy = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aiService.getAccuracy();
      setAccuracy(response.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      toast.error('Failed to fetch accuracy metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdvanced = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setAdvancedLoading(true);
      const response = await aiService.getAdvancedDecisions();
      setAdvancedData(response.data);
    } catch (error) {
      toast.error('Failed to fetch advanced decisions');
    } finally {
      setAdvancedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchDecisions();
    } else if (activeTab === 1) {
      fetchAdvanced(true);
      const interval = setInterval(() => fetchAdvanced(false), 30000);
      return () => clearInterval(interval);
    } else if (activeTab === 2) {
      fetchModels();
    } else {
      fetchAccuracy();
      const interval = setInterval(fetchAccuracy, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchAccuracy, fetchAdvanced, fetchDecisions, fetchModels]);

  useEffect(() => { fetchAccuracy(); }, [fetchAccuracy]);

  const handleEditModel = (model) => {
    setSelectedModel(model);
    setWeights(model.weights || {});
    setEditModelOpen(true);
  };

  const handleSaveWeights = async () => {
    try {
      await aiService.updateModelWeights(selectedModel.id, { weights });
      toast.success('Model weights updated successfully');
      setEditModelOpen(false);
      fetchModels();
    } catch (error) {
      toast.error('Failed to update model weights');
    }
  };

  // ── Tab 0: AI Decisions ──────────────────────────────────────────────────
  const renderDecisionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button startIcon={<RefreshIcon />} onClick={fetchDecisions} sx={{ color: '#1a237e' }}>
          Refresh
        </Button>
      </Box>
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Event</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Decision</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {decisions.length > 0 ? decisions.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>{new Date(d.timestamp).toLocaleString()}</TableCell>
                      <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.event_description}
                      </TableCell>
                      <TableCell>
                        <Chip label={d.source || '—'} size="small" variant="outlined"
                          sx={{ borderColor: '#1a237e', color: '#1a237e' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={d.score != null ? d.score.toFixed(2) : (d.confidence / 100).toFixed(2)}
                          size="small"
                          sx={{
                            backgroundColor: d.score >= 0.9 ? '#d32f2f' : d.score >= 0.75 ? '#f57c00' : d.score > 0 ? '#388e3c' : '#9e9e9e',
                            color: 'white', fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={d.secondary_decision || d.decision}
                          color={d.decision === 'threat' ? 'error' : 'success'}
                          size="small" sx={{ textTransform: 'uppercase' }}
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>No AI decisions available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  // ── Tab 1: Advanced AI Decision ──────────────────────────────────────────
  const renderAdvancedTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button startIcon={<RefreshIcon />} onClick={() => fetchAdvanced(true)} sx={{ color: '#1a237e' }}>
          Refresh
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {advancedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type of Attack</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Remediation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {advancedData?.results?.length > 0 ? advancedData.results.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={row.attack_type} size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1a237e', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={row.action} size="small"
                          sx={{ backgroundColor: ACTION_COLORS[row.action] || '#666', color: 'white', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#444' }}>{row.remediation}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>No advanced decisions available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Attack Count Summary — bottom centre */}
      {advancedData?.attack_counts && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1.5 }}>
            Total Attacks by Type (Live)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 1 }}>
            {Object.entries(advancedData.attack_counts).map(([type, count]) => (
              <Chip
                key={type}
                label={`${type} = ${count}`}
                sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: 13, px: 1 }}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: '#888' }}>
            Total: {advancedData.total} events analyzed
          </Typography>
        </Box>
      )}
    </Box>
  );

  // ── Tab 2: Models & Tuning ───────────────────────────────────────────────
  const renderModelsTab = () => (
    <Box>
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Model Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Accuracy</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.length > 0 ? models.map((model) => (
                    <TableRow key={model.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{model.name}</Typography>
                        <Typography variant="caption" color="textSecondary">Version: {model.version}</Typography>
                      </TableCell>
                      <TableCell>{model.model_type}</TableCell>
                      <TableCell>
                        <Chip label={model.is_active ? 'Active' : 'Inactive'}
                          color={model.is_active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 60, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${model.accuracy || 0}%`, backgroundColor: model.accuracy > 80 ? '#388e3c' : '#f57c00' }} />
                          </Box>
                          <Typography variant="body2">{model.accuracy}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(model.last_updated).toLocaleString(undefined, { 
                        year: 'numeric', 
                        month: 'numeric', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditModel(model)} sx={{ color: '#1a237e' }}>
                          Tune
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>No AI models available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={editModelOpen} onClose={() => setEditModelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>
          Tune Model: {selectedModel?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">Adjust model weights to fine-tune detection sensitivity and accuracy.</Alert>
          {selectedModel?.weights && Object.entries(selectedModel.weights).map(([key, value]) => (
            <Box key={key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{key}</Typography>
                <Typography variant="body2">{weights[key] || value}</Typography>
              </Box>
              <Slider value={weights[key] || value}
                onChange={(e, v) => setWeights({ ...weights, [key]: v })}
                min={0} max={1} step={0.1} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModelOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={handleSaveWeights} variant="contained" sx={{ backgroundColor: '#1a237e' }}>Save Weights</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // ── Tab 3: Accuracy Metrics ──────────────────────────────────────────────
  const renderAccuracyTab = () => (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : accuracy ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Overall Accuracy Metrics</Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {accuracy.total_logs_analyzed?.toLocaleString() ?? 0} logs analyzed
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                      ⟳ Live · Updated {lastUpdated}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[['Overall Accuracy', accuracy.overall_accuracy], ['Precision', accuracy.precision], ['Recall', accuracy.recall], ['F1 Score', accuracy.f1_score]].map(([label, val]) => (
                    <Box key={label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{label}</Typography>
                        <Typography variant="body2">{val}%</Typography>
                      </Box>
                      <Box sx={{ height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${val || 0}%`, backgroundColor: label === 'Overall Accuracy' ? '#388e3c' : '#1a237e', transition: 'width 0.6s ease' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Confusion Matrix</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'True Positives', value: accuracy.true_positives, bg: '#e8f5e9', color: '#388e3c' },
                    { label: 'False Positives', value: accuracy.false_positives, bg: '#ffebee', color: '#d32f2f' },
                    { label: 'False Negatives', value: accuracy.false_negatives, bg: '#fff3e0', color: '#f57c00' },
                    { label: 'True Negatives', value: accuracy.true_negatives, bg: '#f3e5f5', color: '#7b1fa2' },
                  ].map(({ label, value, bg, color }) => (
                    <Grid item xs={6} key={label}>
                      <Box sx={{ p: 2, backgroundColor: bg, borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="textSecondary">{label}</Typography>
                        <Typography variant="h5" sx={{ color, fontWeight: 'bold', transition: 'all 0.4s' }}>
                          {value?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="textSecondary">No accuracy metrics available</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        AI Decisions & Model Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="AI Decisions" />
          <Tab label="Advanced AI Decision" />
          <Tab label="Models & Tuning" />
          <Tab label="Accuracy Metrics" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderDecisionsTab()}
      {activeTab === 1 && renderAdvancedTab()}
      {activeTab === 2 && renderModelsTab()}
      {activeTab === 3 && renderAccuracyTab()}
    </Container>
  );
};

export default AIDecisionsPage;
