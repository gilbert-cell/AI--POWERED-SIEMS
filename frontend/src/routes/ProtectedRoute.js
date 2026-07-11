import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Container, Typography } from '@mui/material';
import { canAccessPath } from '../utils/rbac';
import { useAuth } from '../contexts/AuthContext';

const AccessDenied = ({ role }) => (
  <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#1a237e' }}>Access Restricted</Typography>
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

const ProtectedRoute = ({ path, children }) => {
  const { currentRole } = useAuth();
  return canAccessPath(currentRole, path) ? children : <AccessDenied role={currentRole} />;
};

export default ProtectedRoute;
