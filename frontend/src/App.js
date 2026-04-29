import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Drawer, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import LogsPage from './pages/LogsPage';
import BehaviorAnalysisPage from './pages/BehaviorAnalysisPage';
import RulesPage from './pages/RulesPage';
import AIDecisionsPage from './pages/AIDecisionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import LogDetailsPage from './pages/LogDetailsPage';

// Styles
import './App.css';

const DRAWER_WIDTH = 260;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('auth_token');
    // Redirect to login (implement as needed)
    window.location.href = '/login';
  };

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
        {/* Desktop Sidebar */}
        <Box
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            position: 'fixed',
            height: '100vh',
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          <Sidebar open={true} onClose={() => {}} />
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Navbar */}
          <Navbar onLogout={handleLogout} />

          {/* Mobile Drawer Toggle */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              p: 1,
              backgroundColor: 'white',
              borderBottom: '1px solid #e0e0e0',
              justifyContent: 'flex-start',
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setSidebarOpen(true)}
              sx={{ color: '#1a237e' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Mobile Sidebar */}
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </Drawer>

          {/* Pages */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/logs/:source" element={<LogDetailsPage />} />
              <Route path="/behavior" element={<BehaviorAnalysisPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/ai-decisions" element={<AIDecisionsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>

        {/* Toast Notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Box>
    </Router>
  );
}

export default App;
