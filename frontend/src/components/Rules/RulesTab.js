import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Chip, Tooltip, IconButton, Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, RestartAlt as ResetIcon } from '@mui/icons-material';
import { rulesService } from '../../services/api';
import { toast } from 'react-toastify';
import { SeverityChip, StatusChip } from './RuleChips';

const DEFAULTS = { name: '', description: '', enabled: true, rule_type: 'pattern', condition: '', severity: 'medium', action: 'alert', time_window: 0 };

const RulesTab = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try { const res = await rulesService.getRules(); setRules(res.data.results || []); }
    catch { toast.error('Failed to load rules'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openAdd = () => { setEditing(null); setForm(DEFAULTS); setDialogOpen(true); };
  const openEdit = (rule) => { setEditing(rule); setForm({ ...rule }); setDialogOpen(true); };
  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Rule name is required'); return; }
    setSaving(true);
    try {
      editing ? await rulesService.updateRule(editing.id, form) : await rulesService.createRule(form);
      toast.success(editing ? 'Rule updated' : 'Rule created');
      setDialogOpen(false); fetchRules();
    } catch { toast.error('Failed to save rule'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete rule "${name}"?`)) return;
    try { await rulesService.deleteRule(id); toast.success('Rule deleted'); fetchRules(); }
    catch { toast.error('Failed to delete rule'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await rulesService.toggleRule(id);
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: res.data.enabled } : r));
      toast.success(`Rule ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed to toggle rule'); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all rules to system defaults? This will delete existing rules.')) return;
    setResetting(true);
    try { await rulesService.resetRules(); toast.success('Rules reset to defaults'); fetchRules(); }
    catch { toast.error('Failed to reset rules'); }
    finally { setResetting(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">{rules.length} rule{rules.length !== 1 ? 's' : ''} configured</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetchRules} size="small"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset} disabled={resetting} size="small" color="warning">Reset Defaults</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ backgroundColor: '#1a237e' }}>Add Rule</Button>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
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
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>No rules configured. Click "Reset Defaults" to load system defaults.</TableCell></TableRow>
                  ) : rules.map((rule) => (
                    <TableRow key={rule.id} hover sx={{ opacity: rule.enabled ? 1 : 0.6 }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{rule.name}</Typography>
                        {rule.description && <Typography variant="caption" color="textSecondary">{rule.description}</Typography>}
                      </TableCell>
                      <TableCell><Chip label={rule.rule_type} size="small" variant="outlined" /></TableCell>
                      <TableCell><SeverityChip severity={rule.severity} /></TableCell>
                      <TableCell><Chip label={rule.action} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1a237e' }} /></TableCell>
                      <TableCell>
                        <Tooltip title={rule.enabled ? 'Click to disable' : 'Click to enable'}>
                          <Box sx={{ cursor: 'pointer' }} onClick={() => handleToggle(rule.id)}><StatusChip enabled={rule.enabled} /></Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(rule)} sx={{ color: '#1a237e' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(rule.id, rule.name)} sx={{ color: '#d32f2f' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>{editing ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Rule Name *" fullWidth value={form.name} onChange={f('name')} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={f('description')} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth><InputLabel>Rule Type</InputLabel>
              <Select value={form.rule_type} label="Rule Type" onChange={f('rule_type')}>
                {[['pattern','Pattern Matching'],['threshold','Threshold'],['behavior','Behavioral'],['ml','ML-Based']].map(([v,l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth><InputLabel>Severity</InputLabel>
              <Select value={form.severity} label="Severity" onChange={f('severity')}>
                {['low','medium','high','critical'].map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Condition" fullWidth multiline rows={3} value={form.condition} onChange={f('condition')}
            placeholder="e.g. anomaly_score > 0.8" InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth><InputLabel>Action</InputLabel>
              <Select value={form.action} label="Action" onChange={f('action')}>
                {[['alert','Alert'],['block','Block'],['notify','Notify'],['log','Log Only']].map(([v,l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Time Window (min)" type="number" fullWidth value={form.time_window}
              onChange={(e) => setForm((p) => ({ ...p, time_window: Math.max(0, Number(e.target.value)) }))} helperText="0 = no time window" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel control={<Switch checked={form.enabled} onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} />} label="Enabled" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ backgroundColor: '#1a237e' }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RulesTab;
