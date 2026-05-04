import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  PersonOutline as ProfileIcon,
  AdminPanelSettings as SecurityIcon,
  LogoutRounded as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ShieldOutlined as ShieldIcon,
} from '@mui/icons-material';
import { getStoredRole, roleDefinitions, ROLE_CHANGE_EVENT } from '../../utils/rbac';
import { AUTH_CHANGE_EVENT, getCurrentUser } from '../../utils/auth';

const Navbar = ({ onLogout, onMenuClick }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [currentRole, setCurrentRole] = React.useState(getStoredRole());
  const [currentUser, setCurrentUser] = React.useState(getCurrentUser());

  React.useEffect(() => {
    const handleRoleChange = (event) => {
      setCurrentRole(event.detail || getStoredRole());
    };
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleSecuritySettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleNotifications = () => {
    handleMenuClose();
    navigate('/profile', { state: { scrollTo: 'notifications' } });
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const displayName = currentUser?.name || 'Admin User';
  const displayInitials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = roleDefinitions[currentRole]?.label || currentRole || 'Security Administrator';

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(90deg, #12205f 0%, #1a237e 55%, #2842a0 100%)',
        boxShadow: '0 10px 24px rgba(17, 24, 39, 0.16)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1.5, sm: 3 },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <IconButton
          color="inherit"
          aria-label="Open navigation"
          onClick={onMenuClick}
          sx={{ display: { xs: 'inline-flex', md: 'none' }, flexShrink: 0 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: { xs: 'left', md: 'center' },
            fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            AI SIEM
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            AI-POWERED SECURITY INFORMATION AND EVENT MANAGEMENT SYSTEM
          </Box>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, flexShrink: 0 }}>
          <IconButton
            color="inherit"
            title="Notifications"
            sx={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
            }}
          >
            <NotificationsIcon />
          </IconButton>

          <IconButton
            color="inherit"
            title="Settings"
            onClick={handleSettings}
            sx={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
            }}
          >
            <SettingsIcon />
          </IconButton>

          <IconButton
            onClick={handleMenuOpen}
            sx={{
              px: 0.75,
              py: 0.5,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
            }}
          >
            <Avatar
              sx={{
                width: { xs: 32, sm: 35 },
                height: { xs: 32, sm: 35 },
                background: 'linear-gradient(135deg, #4fc3f7 0%, #1e88e5 100%)',
                fontWeight: 700,
                boxShadow: '0 4px 10px rgba(10, 37, 64, 0.24)',
              }}
            >
              {displayInitials}
            </Avatar>
            <ArrowDownIcon sx={{ fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1.25,
                  minWidth: 260,
                  overflow: 'visible',
                  borderRadius: 2,
                  border: '1px solid #d7deee',
                  boxShadow: '0 18px 38px rgba(15, 23, 42, 0.18)',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -6,
                    right: 18,
                    width: 12,
                    height: 12,
                    bgcolor: '#ffffff',
                    borderTop: '1px solid #d7deee',
                    borderLeft: '1px solid #d7deee',
                    transform: 'rotate(45deg)',
                  },
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    background: 'linear-gradient(135deg, #42a5f5 0%, #1565c0 100%)',
                    fontWeight: 700,
                  }}
                >
                  {displayInitials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', letterSpacing: 0.2 }}>
                    Current Role
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#162252', lineHeight: 1.2 }}>
                    {displayName}
                  </Typography>
                  <Chip
                    icon={<ShieldIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={roleLabel}
                    size="small"
                    sx={{
                      mt: 0.75,
                      height: 24,
                      backgroundColor: '#eef4ff',
                      color: '#23408e',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: '#23408e' },
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfile} sx={{ py: 1.25, px: 2, gap: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, color: '#44506a' }}>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Profile"
                primaryTypographyProps={{ fontWeight: 500, color: '#14213d' }}
              />
            </MenuItem>
            <MenuItem onClick={handleSecuritySettings} sx={{ py: 1.25, px: 2, gap: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, color: '#44506a' }}>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Security Settings"
                primaryTypographyProps={{ fontWeight: 500, color: '#14213d' }}
              />
            </MenuItem>
            <MenuItem onClick={handleNotifications} sx={{ py: 1.25, px: 2, gap: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, color: '#44506a' }}>
                <NotificationsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Notifications"
                primaryTypographyProps={{ fontWeight: 500, color: '#14213d' }}
              />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.25, px: 2, gap: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, color: '#c62828' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontWeight: 600, color: '#b42318' }}
              />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
