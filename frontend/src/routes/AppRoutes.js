import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/shared/ErrorBoundary';

const Dashboard           = lazy(() => import('../pages/Dashboard'));
const LogsPage            = lazy(() => import('../pages/LogsPage'));
const LogViewerDashboard  = lazy(() => import('../pages/LogViewerDashboard'));
const LogDetailsPage      = lazy(() => import('../pages/LogDetailsPage'));
const BehaviorAnalysisPage= lazy(() => import('../pages/BehaviorAnalysisPage'));
const RulesPage           = lazy(() => import('../pages/RulesPage'));
const AIDecisionsPage     = lazy(() => import('../pages/AIDecisionsPage'));
const AnalyticsPage       = lazy(() => import('../pages/AnalyticsPage'));
const EvaluationPage      = lazy(() => import('../pages/EvaluationPage'));
const ProfilePage         = lazy(() => import('../pages/ProfilePage'));
const SettingsPage        = lazy(() => import('../pages/SettingsPage'));
const AdminDashboard      = lazy(() => import('../pages/AdminDashboard'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <CircularProgress />
  </Box>
);

const ROUTES = [
  { path: '/dashboard',   Page: Dashboard,            guard: '/dashboard'    },
  { path: '/logs',        Page: LogsPage,             guard: '/logs'         },
  { path: '/log-viewer',  Page: LogViewerDashboard,   guard: '/log-viewer'   },
  { path: '/logs/:source',Page: LogDetailsPage,       guard: '/logs'         },
  { path: '/behavior',    Page: BehaviorAnalysisPage, guard: '/behavior'     },
  { path: '/rules',       Page: RulesPage,            guard: '/rules'        },
  { path: '/ai-decisions',Page: AIDecisionsPage,      guard: '/ai-decisions' },
  { path: '/analytics',   Page: AnalyticsPage,        guard: '/analytics'    },
  { path: '/evaluation',  Page: EvaluationPage,       guard: '/evaluation'   },
  { path: '/profile',     Page: ProfilePage,          guard: '/profile'      },
  { path: '/settings',    Page: SettingsPage,         guard: '/settings'     },
  { path: '/admin',       Page: AdminDashboard,       guard: '/admin'        },
];

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login"           element={<Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
      {ROUTES.map(({ path, Page, guard }) => (
        <Route key={path} path={path} element={
          <ProtectedRoute path={guard}>
            <ErrorBoundary>
              <Page />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
      ))}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
