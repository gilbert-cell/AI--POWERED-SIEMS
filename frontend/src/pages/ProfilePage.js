import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Container, Typography, Avatar, Grid, Chip, Card, CardContent,
  Divider, Button, TextField, IconButton, Tooltip, Alert,
  Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon,
  Shield as ShieldIcon, Email as EmailIcon, AccessTime as TimeIcon,
  VerifiedUser as VerifiedIcon, Security as SecurityIcon,
  Notifications as NotifIcon, Key as KeyIcon, Phone as PhoneIcon,
  Business as BusinessIcon, Brightness4 as DarkIcon, Brightness7 as LightIcon,
  Refresh as RefreshIcon, Lock as LockIcon, VpnKey as VpnKeyIcon,
  Sms as SmsIcon, FilterList as FilterIcon, Palette as PaletteIcon,
  Dashboard as DashboardIcon, Timer as TimerIcon,
} from '@mui/icons-material';
import { getStoredRole, roleDefinitions, ROLE_CHANGE_EVENT } from '../utils/rbac';
import { AUTH_CHANGE_EVENT, getCurrentUser } from '../utils/auth';
import { useLocation } from 'react-router-dom';
import { formatDateTime as formatSharedDateTime } from '../utils/helpers';

// ── Permission badge colours ──────────────────────────────────────────────────
const PERM_COLORS = {
  'Manage users and access permissions': { bg: '#fff3e0', color: '#e65100' },
  'Configure SIEM infrastructure and integrations': { bg: '#e8f5e9', color: '#1b5e20' },
  'Manage log aggregation, storage, and backups': { bg: '#e3f2fd', color: '#0d47a1' },
  'Monitor system performance and availability': { bg: '#e0f7fa', color: '#006064' },
  'Maintain server and database security': { bg: '#fce4ec', color: '#b71c1c' },
  'Apply updates, patches, and system maintenance': { bg: '#e0f2f1', color: '#004d40' },
  'Configure system parameters and operational settings': { bg: '#e8eaf6', color: '#283593' },
  'Monitor security events and alerts': { bg: '#e8f5e9', color: '#2e7d32' },
  'Analyse logs using AI and correlation rules': { bg: '#e8eaf6', color: '#283593' },
  'Detect anomalies and suspicious activities': { bg: '#f3e5f5', color: '#6a1b9a' },
  'Investigate and respond to security incidents': { bg: '#ffebee', color: '#c62828' },
  'Tune SIEM rules and detection models': { bg: '#e0f7fa', color: '#00695c' },
  'Conduct threat hunting activities': { bg: '#fce4ec', color: '#c62828' },
  'Generate incident analysis reports': { bg: '#fff3e0', color: '#e65100' },
  'Review audit trails and system activity logs': { bg: '#f9fbe7', color: '#558b2f' },
  'Verify compliance with security policies': { bg: '#e3f2fd', color: '#1565c0' },
  'Evaluate SIEM detection effectiveness': { bg: '#f3e5f5', color: '#4a148c' },
  'Review generated reports and incident records': { bg: '#e8eaf6', color: '#1a237e' },
  'Assess alert handling and response procedures': { bg: '#fffde7', color: '#827717' },
  'Produce audit and compliance reports': { bg: '#e0f2f1', color: '#004d40' },
  'Recommend security and governance improvements': { bg: '#fce4ec', color: '#ad1457' },
};

const StatCard = ({ icon, label, value, bg, color }) => (
  <Box sx={{ flex: 1, p: 2.5, borderRadius: 2, backgroundColor: bg, textAlign: 'center', minWidth: 100 }}>
    <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
    <Typography sx={{ fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.5 }}>{label}</Typography>
  </Box>
);

const formatDateTime = (value) => {
  return formatSharedDateTime(value, 'No login recorded');
};

const formatRelativeTime = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

// ── Main component ────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const location = useLocation();
  const notificationsRef = useRef(null);
  const [currentRole, setCurrentRole] = useState(getStoredRole());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [editing, setEditing]         = useState(false);
  const [saved, setSaved]             = useState(false);
  const [name, setName]               = useState(currentUser?.name || 'Admin User');
  const [email, setEmail]             = useState(currentUser?.email || 'admin@example.com');
  const [phone, setPhone]             = useState(currentUser?.phone || '+1 (555) 123-4567');
  const [department, setDepartment]   = useState(currentUser?.department || 'Security Operations (SOC)');

  // Security settings
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('medium_high');

  // UI preferences
  const [darkMode, setDarkMode] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState('grid');
  const [refreshInterval, setRefreshInterval] = useState(10);

  React.useEffect(() => {
    const onRole = (e) => setCurrentRole(e.detail || getStoredRole());
    const onAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener(ROLE_CHANGE_EVENT, onRole);
    window.addEventListener(AUTH_CHANGE_EVENT, onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, onRole);
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo === 'notifications' && notificationsRef.current) {
      setTimeout(() => notificationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [location.state]);

  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const roleDef  = roleDefinitions[currentRole] || {};
  const perms    = roleDef.permissions || [];
  const lastLoginLabel = formatDateTime(currentUser?.lastLoginAt || currentUser?.sessionStartedAt);
  const activeSessions = currentUser ? 1 : 0;
  const recentActivity = [
    {
      action: 'Signed in to the platform',
      time: formatRelativeTime(currentUser?.sessionStartedAt || currentUser?.lastLoginAt),
      icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
      color: '#388e3c',
    },
    {
      action: 'Viewed role permissions',
      time: 'Current session',
      icon: <ShieldIcon sx={{ fontSize: 16 }} />,
      color: '#6a1b9a',
    },
    {
      action: 'Accessed dashboard and analytics',
      time: 'Current session',
      icon: <SecurityIcon sx={{ fontSize: 16 }} />,
      color: '#1565c0',
    },
  ];

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setName(currentUser?.name || 'Admin User');
    setEmail(currentUser?.email || 'admin@example.com');
    setPhone(currentUser?.phone || '+1 (555) 123-4567');
    setDepartment(currentUser?.department || 'Security Operations (SOC)');
    setEditing(false);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Here you would call API to change password
    alert('Password changed successfully');
    setChangePasswordOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Box sx={{ backgroundColor: '#f8faff', minHeight: '100vh', pb: 6 }}>

      {/* ── Cover + Avatar ─────────────────────────────────────────────────── */}
      <Box sx={{
        height: 180,
        background: 'linear-gradient(135deg, #0d1b4b 0%, #1a237e 55%, #0d47a1 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        {[[120, '70%', '5%'], [80, '15%', '20%'], [50, '85%', '30%']].map(([s, l, t], i) => (
          <Box key={i} sx={{
            position: 'absolute', width: s, height: s, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)', left: l, top: t,
          }} />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ mt: -6 }}>

        {/* ── Avatar row ───────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{
              width: 96, height: 96, fontSize: 32, fontWeight: 800,
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              border: '4px solid white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              {initials}
            </Avatar>
            <Box sx={{ mt: 7 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0d1b4b', lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  icon={<ShieldIcon sx={{ fontSize: 14 }} />}
                  label={currentRole}
                  size="small"
                  sx={{ backgroundColor: '#e8eaf6', color: '#1a237e', fontWeight: 700, fontSize: 12 }}
                />
                <Chip
                  icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                  label="Active"
                  size="small"
                  sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: 12 }}
                />
              </Box>
            </Box>
          </Box>

          <Button
            variant={editing ? 'outlined' : 'contained'}
            startIcon={editing ? <CancelIcon /> : <EditIcon />}
            onClick={editing ? handleCancel : () => setEditing(true)}
            sx={{
              mt: 7, borderRadius: 2, fontWeight: 700,
              ...(editing
                ? { borderColor: '#d32f2f', color: '#d32f2f' }
                : { background: 'linear-gradient(135deg, #1a237e, #1565c0)', boxShadow: '0 4px 12px rgba(26,35,126,0.3)' }),
            }}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        {saved && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Profile updated successfully.</Alert>}

        <Grid container spacing={3}>

          {/* ── Left column ──────────────────────────────────────────────── */}
          <Grid item xs={12} md={4}>

            {/* Info card */}
            <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 15 }}>
                  Account Information
                </Typography>

                {editing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                      size="small" fullWidth sx={inputSx} InputProps={{ sx: { borderRadius: 2 } }} />
                    <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                      size="small" fullWidth sx={inputSx} InputProps={{ sx: { borderRadius: 2 } }} />
                    <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                      size="small" fullWidth sx={inputSx} InputProps={{ sx: { borderRadius: 2 } }} />
                    <TextField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}
                      size="small" fullWidth sx={inputSx} InputProps={{ sx: { borderRadius: 2 } }} />
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}
                      sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg, #1a237e, #1565c0)' }}>
                      Save Changes
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { icon: <EmailIcon sx={{ fontSize: 16, color: '#1565c0' }} />, label: 'Email',      value: email },
                      { icon: <PhoneIcon sx={{ fontSize: 16, color: '#2e7d32' }} />, label: 'Phone',      value: phone },
                      { icon: <BusinessIcon sx={{ fontSize: 16, color: '#e65100' }} />, label: 'Department', value: department },
                      { icon: <ShieldIcon sx={{ fontSize: 16, color: '#6a1b9a' }} />, label: 'Role',       value: currentRole },
                      { icon: <TimeIcon sx={{ fontSize: 16, color: '#e65100' }} />,   label: 'Last Login', value: lastLoginLabel },
                      { icon: <NotifIcon sx={{ fontSize: 16, color: '#2e7d32' }} />,  label: 'Status',     value: currentUser?.status || 'Active' },
                    ].map(({ icon, label, value }) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: 1.5,
                          backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                        }}>
                          {icon}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>{label}</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>{value}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 15 }}>
                  Security Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<KeyIcon />}
                    onClick={() => setChangePasswordOpen(true)}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    Change Password
                  </Button>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5,
                        backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <VpnKeyIcon sx={{ fontSize: 16, color: '#6a1b9a' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>Two-Factor Authentication</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Add an extra layer of security</Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={twoFactorEnabled} onChange={(e) => setTwoFactorEnabled(e.target.checked)} />}
                      label=""
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <TimeIcon sx={{ fontSize: 16, color: '#e65100' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>Last Login</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>{lastLoginLabel}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <SecurityIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>Active Sessions</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>{activeSessions} active session{activeSessions !== 1 ? 's' : ''}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card ref={notificationsRef} sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 15 }}>
                  Notification Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5,
                        backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <EmailIcon sx={{ fontSize: 16, color: '#1565c0' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>Email Alerts</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Receive alerts via email</Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />}
                      label=""
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5,
                        backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <SmsIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>SMS Alerts</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Receive alerts via SMS</Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />}
                      label=""
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <FilterIcon sx={{ fontSize: 16, color: '#e65100' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b', mb: 1 }}>Severity Filter</Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={severityFilter}
                          onChange={(e) => setSeverityFilter(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="all">All alerts</MenuItem>
                          <MenuItem value="medium_high">Medium + High</MenuItem>
                          <MenuItem value="high_only">High only</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 15 }}>
                  Activity Stats
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <StatCard icon={<ShieldIcon />}   label="Permissions" value={perms.length} bg="#e8eaf6" color="#1a237e" />
                  <StatCard icon={<SecurityIcon />} label="2FA"         value={twoFactorEnabled ? 'On' : 'Off'} bg="#fce4ec" color="#c62828" />
                  <StatCard icon={<KeyIcon />}      label="Sessions"    value={activeSessions} bg="#e8f5e9" color="#2e7d32" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <Grid item xs={12} md={8}>

            {/* Permissions */}
            <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <VerifiedIcon sx={{ color: '#1a237e', fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 700, color: '#0d1b4b', fontSize: 15 }}>
                    Role Permissions
                  </Typography>
                  <Chip label={currentRole} size="small"
                    sx={{ ml: 'auto', backgroundColor: '#e8eaf6', color: '#1a237e', fontWeight: 700 }} />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {perms.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {perms.map((p) => {
                      const c = PERM_COLORS[p] || { bg: '#f1f5f9', color: '#475569' };
                      return (
                        <Chip key={p} label={p} size="small" sx={{
                          backgroundColor: c.bg, color: c.color,
                          fontWeight: 600, fontSize: 12, borderRadius: 1.5,
                        }} />
                      );
                    })}
                  </Box>
                ) : (
                  <Typography sx={{ color: '#94a3b8', fontSize: 13 }}>
                    No specific permissions defined for this role.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TimeIcon sx={{ color: '#1a237e', fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 700, color: '#0d1b4b', fontSize: 15 }}>
                    Recent Activity
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {recentActivity.map(({ action, time, icon, color }, i) => (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                        <Box sx={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: `${color}18`, display: 'grid', placeItems: 'center', color,
                        }}>
                          {icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>{action}</Typography>
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{time}</Typography>
                        </Box>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      </Box>
                      {i < recentActivity.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* UI Preferences */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#0d1b4b', mb: 2, fontSize: 15 }}>
                  UI Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5,
                        backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        {darkMode ? <DarkIcon sx={{ fontSize: 16, color: '#6a1b9a' }} /> : <LightIcon sx={{ fontSize: 16, color: '#e65100' }} />}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b' }}>Dark Mode</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Toggle dark/light theme</Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />}
                      label=""
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <DashboardIcon sx={{ fontSize: 16, color: '#1565c0' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b', mb: 1 }}>Dashboard Layout</Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={dashboardLayout}
                          onChange={(e) => setDashboardLayout(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="grid">Grid View</MenuItem>
                          <MenuItem value="list">List View</MenuItem>
                          <MenuItem value="compact">Compact View</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 1.5,
                      backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <TimerIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0d1b4b', mb: 1 }}>Refresh Interval</Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={refreshInterval}
                          onChange={(e) => setRefreshInterval(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value={5}>Every 5 seconds</MenuItem>
                          <MenuItem value={10}>Every 10 seconds</MenuItem>
                          <MenuItem value={30}>Every 30 seconds</MenuItem>
                          <MenuItem value={60}>Every minute</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

          </Grid>
        </Grid>
      </Container>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0d1b4b' }}>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              fullWidth
              size="small"
              sx={inputSx}
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              size="small"
              sx={inputSx}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
              sx={inputSx}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)} sx={{ color: '#d32f2f' }}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #1a237e, #1565c0)' }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': { borderColor: '#1a237e' },
    '&.Mui-focused fieldset': { borderColor: '#1a237e' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#1a237e' },
};

export default ProfilePage;
