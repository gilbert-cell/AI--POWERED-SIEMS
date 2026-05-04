import React, { useState } from 'react';
import { HashRouter as Router, Link as RouterLink, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Container, Drawer, Typography } from '@mui/material';
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
import LogViewerDashboard from './pages/LogViewerDashboard';
import AuthPage from './pages/AuthPage';
import { canAccessPath, getStoredRole, ROLE_CHANGE_EVENT } from './utils/rbac';
import { AUTH_CHANGE_EVENT, isAuthenticated, logoutUser } from './utils/auth';

// Styles
import './App.css';

const DRAWER_WIDTH = 260;

const AccessDenied = ({ role }) => (
  <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }}>
          Access Restricted
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 3 }}>
          The current role, {role}, does not have permission to view this area.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/dashboard" sx={{ backgroundColor: '#1a237e' }}>
          Return to Dashboard
        </Button>
      </CardContent>
    </Card>
  </Container>
);

const ProtectedRoute = ({ role, path, children }) => (
  canAccessPath(role, path) ? children : <AccessDenied role={role} />
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(getStoredRole());
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  React.useEffect(() => {
    const handleRoleChange = (event) => {
      setCurrentRole(event.detail || getStoredRole());
    };
    const handleAuthChange = () => {
      setAuthenticated(isAuthenticated());
      setCurrentRole(getStoredRole());
    };
    const handleStorageChange = () => {
      handleRoleChange({});
      handleAuthChange();
    };

    window.addEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    window.location.hash = '/login';
  };

  if (!authenticated) {
    return (
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={5000} theme="light" />
      </Router>
    );
  }

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
          <Navbar onLogout={handleLogout} onMenuClick={() => setSidebarOpen(true)} />

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
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute role={currentRole} path="/dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute role={currentRole} path="/logs"><LogsPage /></ProtectedRoute>} />
              <Route path="/log-viewer" element={<ProtectedRoute role={currentRole} path="/log-viewer"><LogViewerDashboard /></ProtectedRoute>} />
              <Route path="/logs/:source" element={<ProtectedRoute role={currentRole} path="/logs"><LogDetailsPage /></ProtectedRoute>} />
              <Route path="/behavior" element={<ProtectedRoute role={currentRole} path="/behavior"><BehaviorAnalysisPage /></ProtectedRoute>} />
              <Route path="/rules" element={<ProtectedRoute role={currentRole} path="/rules"><RulesPage /></ProtectedRoute>} />
              <Route path="/ai-decisions" element={<ProtectedRoute role={currentRole} path="/ai-decisions"><AIDecisionsPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute role={currentRole} path="/analytics"><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute role={currentRole} path="/profile"><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute role={currentRole} path="/settings"><SettingsPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute role={currentRole} path="/admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
