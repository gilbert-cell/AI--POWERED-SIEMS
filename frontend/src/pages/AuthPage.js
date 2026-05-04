import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress,
  IconButton, InputAdornment, TextField, Typography,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Shield as ShieldIcon,
  Security as SecurityIcon, Analytics as AnalyticsIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import { loginUser, resetPassword } from '../utils/auth';

// ── Left panel feature bullets ────────────────────────────────────────────────
const FEATURES = [
  { icon: <ShieldIcon sx={{ fontSize: 20 }} />,    label: 'Real-time Threat Detection' },
  { icon: <AnalyticsIcon sx={{ fontSize: 20 }} />, label: 'AI-Powered Analytics' },
  { icon: <SecurityIcon sx={{ fontSize: 20 }} />,  label: 'Behavioral Anomaly Detection' },
  { icon: <BugIcon sx={{ fontSize: 20 }} />,       label: 'Automated Incident Response' },
];

// ── Animated stat badges on left panel ───────────────────────────────────────
const STATS = [
  { value: '99.6%', label: 'Detection Rate' },
  { value: '< 2s',  label: 'Response Time' },
  { value: '24/7',  label: 'Monitoring' },
];

// ── Floating particle dots (purely decorative) ────────────────────────────────
const Particle = ({ style }) => (
  <Box sx={{
    position: 'absolute', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    animation: 'float 6s ease-in-out infinite',
    '@keyframes float': {
      '0%,100%': { transform: 'translateY(0px)' },
      '50%':     { transform: 'translateY(-20px)' },
    },
    ...style,
  }} />
);

// ── Main component ────────────────────────────────────────────────────────────
const AuthPage = ({ mode = 'login' }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [form, setForm]         = useState({ email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => { setError(''); setSuccess(''); }, [mode]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser({ email: form.email, password: form.password });
        navigate(location.state?.from || '/dashboard', { replace: true });
        return;
      }
      if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
      if (form.password !== form.confirm) throw new Error('Passwords do not match.');
      await resetPassword({ email: form.email, password: form.password });
      setSuccess('Password updated. You can now sign in.');
      setForm((p) => ({ ...p, password: '', confirm: '' }));
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isForgot   = mode === 'forgot';

  const submitLabel = isForgot ? 'Update Password' : 'Sign In';
  const heading     = isForgot ? 'Reset Password' : 'Welcome Back';
  const subheading  = isForgot ? 'Enter your email and new password' : 'Sign in to your SIEM dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '45%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1b4b 0%, #1a237e 50%, #0d47a1 100%)',
        p: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative particles */}
        <Particle style={{ width: 120, height: 120, top: '10%',  left: '60%' }} />
        <Particle style={{ width: 80,  height: 80,  top: '40%',  left: '10%', animationDelay: '2s' }} />
        <Particle style={{ width: 60,  height: 60,  top: '70%',  left: '70%', animationDelay: '4s' }} />
        <Particle style={{ width: 40,  height: 40,  top: '85%',  left: '30%', animationDelay: '1s' }} />

        {/* Logo */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 15px rgba(66,165,245,0.4)',
            }}>
              <ShieldIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
                AI SIEM
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2 }}>
                SECURITY PLATFORM
              </Typography>
            </Box>
          </Box>

          <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            Intelligent<br />Security<br />Operations
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, mb: 5, lineHeight: 1.7 }}>
            AI-powered threat detection and incident response platform protecting your infrastructure in real time.
          </Typography>

          {/* Feature list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FEATURES.map(({ icon, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  display: 'grid', placeItems: 'center', color: '#90caf9',
                  flexShrink: 0,
                }}>
                  {icon}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          {STATS.map(({ value, label }) => (
            <Box key={label} sx={{
              flex: 1, p: 2, borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}>
              <Typography sx={{ color: '#90caf9', fontWeight: 800, fontSize: 20 }}>{value}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, mt: 0.3 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8faff',
        p: { xs: 3, sm: 6 },
        minHeight: '100vh',
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Heading */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0d1b4b', mb: 0.5 }}>
              {heading}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: 14 }}>{subheading}</Typography>
          </Box>


          {/* Alerts */}
          {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Email Address" type="email" value={form.email} onChange={set('email')} required fullWidth
              sx={inputSx} InputProps={{ sx: { borderRadius: 2 } }} />

            <TextField
              label={isForgot ? 'New Password' : 'Password'}
              type={showPwd ? 'text' : 'password'}
              value={form.password} onChange={set('password')} required fullWidth
              sx={inputSx}
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((p) => !p)} edge="end" size="small">
                      {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {isForgot && (
              <TextField
                label="Confirm Password"
                type={showCfm ? 'text' : 'password'}
                value={form.confirm} onChange={set('confirm')} required fullWidth
                sx={inputSx}
                InputProps={{
                  sx: { borderRadius: 2 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCfm((p) => !p)} edge="end" size="small">
                        {showCfm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {/* Forgot password link */}
            {!isForgot && (
              <Box sx={{ textAlign: 'right', mt: -1 }}>
                <Box component={RouterLink} to="/forgot-password"
                  sx={{ fontSize: 13, color: '#1a237e', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Forgot password?
                </Box>
              </Box>
            )}

            <Button type="submit" variant="contained" size="large" disabled={loading}
              sx={{
                mt: 0.5, py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 15,
                background: 'linear-gradient(135deg, #1a237e, #1565c0)',
                boxShadow: '0 4px 15px rgba(26,35,126,0.35)',
                '&:hover': { background: 'linear-gradient(135deg, #283593, #1976d2)', boxShadow: '0 6px 20px rgba(26,35,126,0.45)' },
                '&:disabled': { background: '#c5cae9' },
              }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : submitLabel}
            </Button>
          </Box>

          {/* Bottom links */}
          {isForgot && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Box component={RouterLink} to="/login"
                sx={{ fontSize: 13, color: '#1a237e', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                ← Back to Sign In
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Shared input style
const inputSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': { borderColor: '#1a237e' },
    '&.Mui-focused fieldset': { borderColor: '#1a237e' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#1a237e' },
};

export default AuthPage;
