import React, { useState } from 'react';
import { Box, Drawer } from '@mui/material';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 260;

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Desktop sidebar */}
      <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0, display: { xs: 'none', md: 'block' }, position: 'fixed', height: '100vh', overflow: 'auto', backgroundColor: '#f5f5f5', borderRight: '1px solid #e0e0e0' }}>
        <Sidebar open={true} onClose={() => {}} />
      </Box>

      <Box sx={{ flexGrow: 1, ml: { xs: 0, md: `${DRAWER_WIDTH}px` }, display: 'flex', flexDirection: 'column' }}>
        <Navbar onLogout={logout} onMenuClick={() => setSidebarOpen(true)} />

        {/* Mobile sidebar */}
        <Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}>
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </Drawer>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
