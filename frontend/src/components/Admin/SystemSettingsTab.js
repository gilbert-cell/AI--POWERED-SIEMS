import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, TextField, FormControl,
  InputLabel, Select, MenuItem, Button, Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { formatTime } from '../../utils/helpers';
import { adminService } from '../../services/api';

const STORAGE_KEY = 'siem_system_settings';

const DEFAULT_SETTINGS = {
  general: {
    systemName: 'AI SIEM System',
    logRetentionDays: '90',
    alertBatchSize: '100',
    alertSeverityLevel: 'medium',
  },
  security: {
    sessionTimeoutMinutes: '30',
    maxLoginAttempts: '5',
    requireMfa: 'enabled',
  },
};

const loadSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      general: { ...DEFAULT_SETTINGS.general, ...(saved?.general || {}) },
      security: { ...DEFAULT_SETTINGS.security, ...(saved?.security || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const validatePositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const SystemSettingsTab = () => {
  const initialSettings = useMemo(loadSettings, []);
  const [general, setGeneral] = useState(initialSettings.general);
  const [security, setSecurity] = useState(initialSettings.security);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState('');

  useEffect(() => {
    let active = true;
    adminService.getSystemSettings()
      .then((response) => {
        if (!active) return;
        const settings = response.data?.settings || {};
        setGeneral({ ...DEFAULT_SETTINGS.general, ...(settings.general || {}) });
        setSecurity({ ...DEFAULT_SETTINGS.security, ...(settings.security || {}) });
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.error || 'Unable to load system settings from the server.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const cacheSettings = (nextSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    } catch {
      // Browser cache is optional; the server remains the source of truth.
    }
  };

  const persistSettings = async (sectionName, nextSettings) => {
    setSavingSection(sectionName);
    try {
      const response = await adminService.saveSystemSettings(nextSettings);
      const saved = response.data?.settings || nextSettings;
      setGeneral({ ...DEFAULT_SETTINGS.general, ...(saved.general || {}) });
      setSecurity({ ...DEFAULT_SETTINGS.security, ...(saved.security || {}) });
      cacheSettings(saved);
      setError('');
      setMessage(`${sectionName} saved at ${formatTime(new Date())}`);
      return true;
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.error || 'Unable to save settings on the server.');
      return false;
    } finally {
      setSavingSection('');
    }
  };

  const saveGeneral = async () => {
    if (!general.systemName.trim()) {
      setMessage('');
      setError('System name is required.');
      return;
    }
    if (!validatePositiveNumber(general.logRetentionDays) || !validatePositiveNumber(general.alertBatchSize)) {
      setMessage('');
      setError('Log retention days and alert batch size must be greater than 0.');
      return;
    }
    await persistSettings('General settings', { general, security });
  };

  const saveSecurity = async () => {
    if (!validatePositiveNumber(security.sessionTimeoutMinutes) || !validatePositiveNumber(security.maxLoginAttempts)) {
      setMessage('');
      setError('Session timeout and max login attempts must be greater than 0.');
      return;
    }
    await persistSettings('Security settings', { general, security });
  };

  return (
    <Grid container spacing={3}>
      {(message || error) && (
        <Grid item xs={12}>
          <Alert severity={error ? 'error' : 'success'} onClose={() => { setMessage(''); setError(''); }}>
            {error || message}
          </Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>General Settings</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth label="System Name" value={general.systemName} variant="outlined"
                onChange={(e) => setGeneral((prev) => ({ ...prev, systemName: e.target.value }))} />
              <TextField fullWidth label="Log Retention Days" value={general.logRetentionDays} variant="outlined" type="number"
                inputProps={{ min: 1 }}
                onChange={(e) => setGeneral((prev) => ({ ...prev, logRetentionDays: e.target.value }))} />
              <TextField fullWidth label="Alert Batch Size" value={general.alertBatchSize} variant="outlined" type="number"
                inputProps={{ min: 1 }}
                onChange={(e) => setGeneral((prev) => ({ ...prev, alertBatchSize: e.target.value }))} />
              <FormControl fullWidth>
                <InputLabel>Alert Severity Level</InputLabel>
                <Select value={general.alertSeverityLevel} label="Alert Severity Level"
                  onChange={(e) => setGeneral((prev) => ({ ...prev, alertSeverityLevel: e.target.value }))}>
                  {['low', 'medium', 'high', 'critical'].map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveGeneral}
                disabled={loading || Boolean(savingSection)}
                sx={{ backgroundColor: '#1a237e', alignSelf: 'flex-start' }}>
                {savingSection === 'General settings' ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Security Settings</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth label="Session Timeout (minutes)" value={security.sessionTimeoutMinutes} variant="outlined" type="number"
                inputProps={{ min: 1 }}
                onChange={(e) => setSecurity((prev) => ({ ...prev, sessionTimeoutMinutes: e.target.value }))} />
              <TextField fullWidth label="Max Login Attempts" value={security.maxLoginAttempts} variant="outlined" type="number"
                inputProps={{ min: 1 }}
                onChange={(e) => setSecurity((prev) => ({ ...prev, maxLoginAttempts: e.target.value }))} />
              <FormControl fullWidth>
                <InputLabel>Require MFA</InputLabel>
                <Select value={security.requireMfa} label="Require MFA"
                  onChange={(e) => setSecurity((prev) => ({ ...prev, requireMfa: e.target.value }))}>
                  {['enabled', 'disabled', 'optional'].map((v) => <MenuItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveSecurity}
                disabled={loading || Boolean(savingSection)}
                sx={{ backgroundColor: '#1a237e', alignSelf: 'flex-start' }}>
                {savingSection === 'Security settings' ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SystemSettingsTab;
