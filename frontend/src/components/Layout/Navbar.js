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
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const Navbar = ({ onLogout, onMenuClick }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

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

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#1a237e' }}>
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
          <IconButton color="inherit" title="Notifications">
            <NotificationsIcon />
          </IconButton>

          <IconButton color="inherit" title="Settings" onClick={handleSettings}>
            <SettingsIcon />
          </IconButton>

          <IconButton
            onClick={handleMenuOpen}
            sx={{
              padding: 0,
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Avatar sx={{ width: { xs: 32, sm: 35 }, height: { xs: 32, sm: 35 }, backgroundColor: '#42a5f5' }}>
              AD
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleSettings}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
