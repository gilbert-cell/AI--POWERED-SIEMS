import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Slider, Switch,
  FormControlLabel, Chip, Tooltip, IconButton, Alert,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { rulesService, thresholdsService } from '../services/api';
import { toast } from 'react-toastify';

const SEVERITY_COLORS = {
  critical: { bg: '#ffebee', color: '#d32f2f' },
  high:     { bg: '#fff3e0', color: '#f57c00' },
  medium:   { bg: '#fffde7', color: '#f9a825' },
  low:      { bg: '#e8f5e9', color: '#388e3c' },
};

const RULE_DEFAULTS = {
  name: '', description: '', enabled: true,
  rule_type: 'pattern', condition: '', severity: 'medium', action: 'alert', time_window: 0,
};

const THRESHOLD_DEFAULTS = {
  name: '', description: '', metric: '',
  value: 50, min_value: 0, max_value: 100,
  unit: '', enabled: true, alert_on: 'exceed',
};

const SeverityChip = ({ severity }) => {
  const c = SEVERITY_COLORS[severity] || { bg: '#f5f5f5', color: '#666' };
  return (
    <Box sx={{ display: 'inline-block', backgroundColor: c.bg, color: c.color,
      px: 1.5, py: 0.4, borderRadius: 1, fontSize: '0.8rem', fontWeight: 'bold' }}>
      {severity?.toUpperCase()}
    </Box>
  );
};

const StatusChip = ({ enabled }) => (
  <Box sx={{ display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 1,
    fontSize: '0.8rem', fontWeight: 'bold',
    backgroundColor: enabled ? '#e8f5e9' : '#ffebee',
    color: enabled ? '#388e3c' : '#d32f2f' }}>
    {enabled ? 'Enabled' : 'Disabled'}
  </Box>
);

// ─── Rules Tab ────────────────────────────────────────────────────────────────
const RulesTab = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(RULE_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rulesService.getRules();
      setRules(res.data.results || []);
    } catch {
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openAdd = () => { setEditing(null); setForm(RULE_DEFAULTS); setDialogOpen(true); };
  const openEdit = (rule) => { setEditing(rule); setForm({ ...rule }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Rule name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await rulesService.updateRule(editing.id, form);
        toast.success('Rule updated');
      } else {
        await rulesService.createRule(form);
        toast.success('Rule created');
      }
      setDialogOpen(false);
      fetchRules();
    } catch {
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete rule "${name}"?`)) return;
    try {
      await rulesService.deleteRule(id);
      toast.success('Rule deleted');
      fetchRules();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all rules to system defaults? This will delete existing rules.')) return;
    setResetting(true);
    try {
      await rulesService.resetRules();
      toast.success('Rules reset to defaults');
      fetchRules();
    } catch {
      toast.error('Failed to reset rules');
    } finally {
      setResetting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await rulesService.toggleRule(id);
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: res.data.enabled } : r));
      toast.success(`Rule ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle rule');
    }
  };

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetchRules} size="small"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset}
            disabled={resetting} size="small" color="warning">
            Reset Defaults
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ backgroundColor: '#1a237e' }}>
            Add Rule
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#1a237e' }}>
                  <TableRow>
                    {['Rule Name', 'Type', 'Severity', 'Action', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>
                        No rules configured. Click "Reset Defaults" to load system defaults.
                      </TableCell>
                    </TableRow>
                  ) : rules.map((rule) => (
                    <TableRow key={rule.id} hover sx={{ opacity: rule.enabled ? 1 : 0.6 }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{rule.name}</Typography>
                        {rule.description && (
                          <Typography variant="caption" color="textSecondary">{rule.description}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.rule_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell><SeverityChip severity={rule.severity} /></TableCell>
                      <TableCell>
                        <Chip label={rule.action} size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1a237e' }} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={rule.enabled ? 'Click to disable' : 'Click to enable'}>
                          <Box sx={{ cursor: 'pointer' }} onClick={() => handleToggle(rule.id)}>
                            <StatusChip enabled={rule.enabled} />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(rule)} sx={{ color: '#1a237e' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(rule.id, rule.name)} sx={{ color: '#d32f2f' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>
          {editing ? 'Edit Rule' : 'Create New Rule'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Rule Name *" fullWidth value={form.name} onChange={f('name')} />
          <TextField label="Description" fullWidth multiline rows={2}
            value={form.description} onChange={f('description')} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Rule Type</InputLabel>
              <Select value={form.rule_type} label="Rule Type" onChange={f('rule_type')}>
                <MenuItem value="pattern">Pattern Matching</MenuItem>
                <MenuItem value="threshold">Threshold</MenuItem>
                <MenuItem value="behavior">Behavioral</MenuItem>
                <MenuItem value="ml">ML-Based</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select value={form.severity} label="Severity" onChange={f('severity')}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField label="Condition" fullWidth multiline rows={3}
            value={form.condition} onChange={f('condition')}
            placeholder='e.g. anomaly_score > 0.8'
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select value={form.action} label="Action" onChange={f('action')}>
                <MenuItem value="alert">Alert</MenuItem>
                <MenuItem value="block">Block</MenuItem>
                <MenuItem value="notify">Notify</MenuItem>
                <MenuItem value="log">Log Only</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Time Window (min)" type="number" fullWidth
              value={form.time_window}
              onChange={(e) => setForm((p) => ({ ...p, time_window: Math.max(0, Number(e.target.value)) }))}
              helperText="0 = no time window" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel
              control={<Switch checked={form.enabled}
                onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} />}
              label="Enabled" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ backgroundColor: '#1a237e' }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Thresholds Tab ───────────────────────────────────────────────────────────
const ThresholdsTab = () => {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(THRESHOLD_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchThresholds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await thresholdsService.getThresholds();
      setThresholds(res.data.results || []);
    } catch {
      toast.error('Failed to load thresholds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const openAdd = () => { setEditing(null); setForm(THRESHOLD_DEFAULTS); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Threshold name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await thresholdsService.updateThreshold(editing.id, form);
        toast.success('Threshold updated');
      } else {
        await thresholdsService.createThreshold(form);
        toast.success('Threshold created');
      }
      setDialogOpen(false);
      fetchThresholds();
    } catch {
      toast.error('Failed to save threshold');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete threshold "${name}"?`)) return;
    try {
      await thresholdsService.deleteThreshold(id);
      toast.success('Threshold deleted');
      fetchThresholds();
    } catch {
      toast.error('Failed to delete threshold');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await thresholdsService.toggleThreshold(id);
      setThresholds((prev) => prev.map((t) => t.id === id ? { ...t, enabled: res.data.enabled } : t));
      toast.success(`Threshold ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle threshold');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all thresholds to system defaults? This will delete existing thresholds.')) return;
    setResetting(true);
    try {
      await thresholdsService.resetThresholds();
      toast.success('Thresholds reset to defaults');
      fetchThresholds();
    } catch {
      toast.error('Failed to reset thresholds');
    } finally {
      setResetting(false);
    }
  };

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          {thresholds.length} threshold{thresholds.length !== 1 ? 's' : ''} configured
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetchThresholds} size="small"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset}
            disabled={resetting} size="small" color="warning">
            Reset Defaults
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ backgroundColor: '#1a237e' }}>
            Add Threshold
          </Button>
        </Box>
      </Box>

      {thresholds.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No thresholds configured. Click "Reset Defaults" to load system defaults or "Add Threshold" to create one.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#1a237e' }}>
                  <TableRow>
                    {['Threshold Name', 'Metric', 'Value', 'Alert When', 'Visual', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {thresholds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                        No thresholds configured.
                      </TableCell>
                    </TableRow>
                  ) : thresholds.map((t) => {
                    const pct = ((t.value - t.min_value) / ((t.max_value - t.min_value) || 1)) * 100;
                    const barColor = pct > 80 ? '#d32f2f' : pct > 60 ? '#f57c00' : '#388e3c';
                    return (
                      <TableRow key={t.id} hover sx={{ opacity: t.enabled ? 1 : 0.6 }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t.name}</Typography>
                          {t.description && (
                            <Typography variant="caption" color="textSecondary">{t.description}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={t.metric || '—'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: barColor }}>
                            {t.value}{t.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={t.alert_on} size="small"
                            sx={{ backgroundColor: '#fff3e0', color: '#f57c00' }} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 }}>
                              <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%',
                                backgroundColor: barColor, borderRadius: 4,
                                transition: 'width 0.3s ease' }} />
                            </Box>
                            <Typography variant="caption" sx={{ minWidth: 32 }}>
                              {Math.round(pct)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={t.enabled ? 'Click to disable' : 'Click to enable'}>
                            <Box sx={{ cursor: 'pointer' }} onClick={() => handleToggle(t.id)}>
                              <StatusChip enabled={t.enabled} />
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(t)} sx={{ color: '#1a237e' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(t.id, t.name)} sx={{ color: '#d32f2f' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Threshold Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>
          {editing ? 'Edit Threshold' : 'Create New Threshold'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Threshold Name *" fullWidth value={form.name} onChange={f('name')} />
          <TextField label="Description" fullWidth multiline rows={2}
            value={form.description} onChange={f('description')} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Metric" fullWidth value={form.metric} onChange={f('metric')}
              placeholder="e.g. failed_logins, cpu_usage" />
            <TextField label="Unit" fullWidth value={form.unit} onChange={f('unit')}
              placeholder="e.g. %, /min, Mbps" />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Min Value" type="number" fullWidth value={form.min_value}
              onChange={(e) => setForm((p) => ({ ...p, min_value: Number(e.target.value) }))} />
            <TextField label="Max Value" type="number" fullWidth value={form.max_value}
              onChange={(e) => setForm((p) => ({ ...p, max_value: Number(e.target.value) }))} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Threshold Value: <span style={{ color: '#1a237e' }}>{form.value}{form.unit}</span>
            </Typography>
            <Slider
              value={Number(form.value)}
              onChange={(_, v) => setForm((p) => ({ ...p, value: v }))}
              min={Number(form.min_value) || 0}
              max={Number(form.max_value) || 100}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: '#1a237e' }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="textSecondary">{form.min_value}{form.unit}</Typography>
              <Typography variant="caption" color="textSecondary">{form.max_value}{form.unit}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>Alert When</InputLabel>
              <Select value={form.alert_on} label="Alert When" onChange={f('alert_on')}>
                <MenuItem value="exceed">Exceeds Value</MenuItem>
                <MenuItem value="drop">Below Value</MenuItem>
                <MenuItem value="deviation">Deviation</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.enabled}
                onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} />}
              label="Enabled" sx={{ minWidth: 110 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ backgroundColor: '#1a237e' }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Threshold'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RulesPage = () => {
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Rules & Thresholds
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {[{ key: 'rules', label: 'Detection Rules' }, { key: 'thresholds', label: 'Alert Thresholds' }].map(({ key, label }) => (
          <Button key={key}
            variant={activeTab === key ? 'contained' : 'outlined'}
            onClick={() => setActiveTab(key)}
            sx={{
              backgroundColor: activeTab === key ? '#1a237e' : 'transparent',
              color: activeTab === key ? 'white' : '#1a237e',
              borderColor: '#1a237e',
              '&:hover': { backgroundColor: activeTab === key ? '#283593' : '#e8eaf6' },
            }}>
            {label}
          </Button>
        ))}
      </Box>

      {activeTab === 'rules' ? <RulesTab /> : <ThresholdsTab />}
    </Container>
  );
};

export default RulesPage;
