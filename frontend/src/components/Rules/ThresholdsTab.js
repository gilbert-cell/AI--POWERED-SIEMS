import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Chip, Tooltip, IconButton, Typography, Alert, Slider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, RestartAlt as ResetIcon } from '@mui/icons-material';
import { thresholdsService } from '../../services/api';
import { toast } from 'react-toastify';
import { StatusChip } from './RuleChips';
import ProgressBar from '../shared/ProgressBar';

const DEFAULTS = { name: '', description: '', metric: '', value: 50, min_value: 0, max_value: 100, unit: '', enabled: true, alert_on: 'exceed' };

const ThresholdsTab = () => {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchThresholds = useCallback(async () => {
    setLoading(true);
    try { const res = await thresholdsService.getThresholds(); setThresholds(res.data.results || []); }
    catch { toast.error('Failed to load thresholds'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const openAdd = () => { setEditing(null); setForm(DEFAULTS); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setDialogOpen(true); };
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Threshold name is required'); return; }
    setSaving(true);
    try {
      editing ? await thresholdsService.updateThreshold(editing.id, form) : await thresholdsService.createThreshold(form);
      toast.success(editing ? 'Threshold updated' : 'Threshold created');
      setDialogOpen(false); fetchThresholds();
    } catch { toast.error('Failed to save threshold'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete threshold "${name}"?`)) return;
    try { await thresholdsService.deleteThreshold(id); toast.success('Threshold deleted'); fetchThresholds(); }
    catch { toast.error('Failed to delete threshold'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await thresholdsService.toggleThreshold(id);
      setThresholds((prev) => prev.map((t) => t.id === id ? { ...t, enabled: res.data.enabled } : t));
      toast.success(`Threshold ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed to toggle threshold'); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all thresholds to system defaults? This will delete existing thresholds.')) return;
    setResetting(true);
    try { await thresholdsService.resetThresholds(); toast.success('Thresholds reset to defaults'); fetchThresholds(); }
    catch { toast.error('Failed to reset thresholds'); }
    finally { setResetting(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">{thresholds.length} threshold{thresholds.length !== 1 ? 's' : ''} configured</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetchThresholds} size="small"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset} disabled={resetting} size="small" color="warning">Reset Defaults</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ backgroundColor: '#1a237e' }}>Add Threshold</Button>
        </Box>
      </Box>

      {thresholds.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>No thresholds configured. Click "Reset Defaults" to load system defaults or "Add Threshold" to create one.</Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
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
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>No thresholds configured.</TableCell></TableRow>
                  ) : thresholds.map((t) => {
                    const pct = ((t.value - t.min_value) / ((t.max_value - t.min_value) || 1)) * 100;
                    const barColor = pct > 80 ? '#d32f2f' : pct > 60 ? '#f57c00' : '#388e3c';
                    return (
                      <TableRow key={t.id} hover sx={{ opacity: t.enabled ? 1 : 0.6 }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t.name}</Typography>
                          {t.description && <Typography variant="caption" color="textSecondary">{t.description}</Typography>}
                        </TableCell>
                        <TableCell><Chip label={t.metric || '—'} size="small" variant="outlined" /></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold', color: barColor }}>{t.value}{t.unit}</Typography></TableCell>
                        <TableCell><Chip label={t.alert_on} size="small" sx={{ backgroundColor: '#fff3e0', color: '#f57c00' }} /></TableCell>
                        <TableCell sx={{ minWidth: 140 }}><ProgressBar value={pct} color={barColor} /></TableCell>
                        <TableCell>
                          <Tooltip title={t.enabled ? 'Click to disable' : 'Click to enable'}>
                            <Box sx={{ cursor: 'pointer' }} onClick={() => handleToggle(t.id)}><StatusChip enabled={t.enabled} /></Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)} sx={{ color: '#1a237e' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(t.id, t.name)} sx={{ color: '#d32f2f' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>{editing ? 'Edit Threshold' : 'Create New Threshold'}</DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Threshold Name *" fullWidth value={form.name} onChange={f('name')} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={f('description')} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Metric" fullWidth value={form.metric} onChange={f('metric')} placeholder="e.g. failed_logins, cpu_usage" />
            <TextField label="Unit" fullWidth value={form.unit} onChange={f('unit')} placeholder="e.g. %, /min, Mbps" />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Min Value" type="number" fullWidth value={form.min_value} onChange={(e) => setForm((p) => ({ ...p, min_value: Number(e.target.value) }))} />
            <TextField label="Max Value" type="number" fullWidth value={form.max_value} onChange={(e) => setForm((p) => ({ ...p, max_value: Number(e.target.value) }))} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>Threshold Value: <span style={{ color: '#1a237e' }}>{form.value}{form.unit}</span></Typography>
            <Slider value={Number(form.value)} onChange={(_, v) => setForm((p) => ({ ...p, value: v }))}
              min={Number(form.min_value) || 0} max={Number(form.max_value) || 100} step={1} valueLabelDisplay="auto" sx={{ color: '#1a237e' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="textSecondary">{form.min_value}{form.unit}</Typography>
              <Typography variant="caption" color="textSecondary">{form.max_value}{form.unit}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth><InputLabel>Alert When</InputLabel>
              <Select value={form.alert_on} label="Alert When" onChange={f('alert_on')}>
                <MenuItem value="exceed">Exceeds Value</MenuItem>
                <MenuItem value="drop">Below Value</MenuItem>
                <MenuItem value="deviation">Deviation</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel control={<Switch checked={form.enabled} onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} />} label="Enabled" sx={{ minWidth: 110 }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ backgroundColor: '#1a237e' }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Threshold'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThresholdsTab;
