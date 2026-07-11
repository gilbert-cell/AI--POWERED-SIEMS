import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import AppRoutes from './routes/AppRoutes';
import AuthPage from './pages/AuthPage';
import './App.css';

const AuthGate = () => {
  const { authenticated } = useAuth();

  if (!authenticated) {
    return (
      <Routes>
        <Route path="/login"           element={<AuthPage mode="login"  />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AuthGate />
          <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
