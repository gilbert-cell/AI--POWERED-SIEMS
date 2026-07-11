import React from 'react';
import { Box, Container, Typography, Alert, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useAdmin, buildAuditLogs } from '../components/Admin/useAdmin';
import AccessOverviewTab from '../components/Admin/AccessOverviewTab';
import SystemHealthTab from '../components/Admin/SystemHealthTab';
import UserManagementTab from '../components/Admin/UserManagementTab';
import PermissionMatrixTab from '../components/Admin/PermissionMatrixTab';
import AuditLogsTab from '../components/Admin/AuditLogsTab';
import SystemSettingsTab from '../components/Admin/SystemSettingsTab';
import { useState } from 'react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { sessionUser, currentRole, users, systemHealth, lastRefresh, userLoadError, handleActiveRoleChange, handleRefresh, saveUser, removeUser } = useAdmin();
  const auditLogs = buildAuditLogs(users, sessionUser);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>RBAC Dashboard</Typography>
          <Typography color="textSecondary">Manage role-based access for SIEM users, dashboards, and security workflows.</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography color="textSecondary" variant="body2">Updated at {lastRefresh}</Typography>
          <Tooltip title="Refresh system health metrics">
            <IconButton sx={{ color: '#1a237e' }} onClick={handleRefresh}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {userLoadError && <Alert severity="error" sx={{ mb: 3 }}>{userLoadError}</Alert>}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}>
        {['Access Overview', 'System Health', 'User Management', 'Permission Matrix', 'Audit Logs', 'System Settings'].map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {activeTab === 0 && <AccessOverviewTab currentRole={currentRole} onRoleChange={handleActiveRoleChange} />}
      {activeTab === 1 && <SystemHealthTab systemHealth={systemHealth} />}
      {activeTab === 2 && <UserManagementTab users={users} onSave={saveUser} onDelete={removeUser} />}
      {activeTab === 3 && <PermissionMatrixTab />}
      {activeTab === 4 && <AuditLogsTab auditLogs={auditLogs} />}
      {activeTab === 5 && <SystemSettingsTab />}
    </Container>
  );
};

export default AdminDashboard;
