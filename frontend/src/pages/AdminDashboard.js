import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Administrator', status: 'active', lastLogin: '2026-04-25' },
    { id: 2, name: 'Security Analyst', email: 'analyst@example.com', role: 'Analyst', status: 'active', lastLogin: '2026-04-25' },
    { id: 3, name: 'Operator', email: 'operator@example.com', role: 'Operator', status: 'inactive', lastLogin: '2026-04-20' },
  ]);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '45d 12h 34m',
    cpuUsage: 32,
    memoryUsage: 58,
    diskUsage: 42,
    activeConnections: 24,
  });
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, user: 'admin@example.com', action: 'Rule modified', resource: 'Rule-001', timestamp: '2026-04-25 15:30', status: 'success' },
    { id: 2, user: 'analyst@example.com', action: 'Alert acknowledged', resource: 'Alert-5678', timestamp: '2026-04-25 15:25', status: 'success' },
    { id: 3, user: 'admin@example.com', action: 'User role changed', resource: 'User-003', timestamp: '2026-04-25 15:20', status: 'success' },
    { id: 4, user: 'operator@example.com', action: 'Login failed', resource: 'Authentication', timestamp: '2026-04-25 15:10', status: 'failure' },
  ]);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Analyst' });

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({ name: '', email: '', role: 'Analyst' });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
    } else {
      setUsers([...users, { id: Math.max(...users.map(u => u.id), 0) + 1, ...formData, status: 'active', lastLogin: new Date().toISOString().split('T')[0] }]);
    }
    setUserDialogOpen(false);
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator': return 'error';
      case 'Analyst': return 'warning';
      case 'Operator': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => status === 'active' ? 'success' : 'default';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
          Admin Dashboard
        </Typography>
        <Tooltip title="Refresh all data">
          <IconButton sx={{ color: '#1a237e' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)} sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label="System Health" />
        <Tab label="User Management" />
        <Tab label="Audit Logs" />
        <Tab label="System Settings" />
      </Tabs>

      {/* System Health Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ backgroundColor: systemHealth.status === 'healthy' ? '#e8f5e9' : '#fff3e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {systemHealth.status === 'healthy' ? (
                    <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                  ) : (
                    <WarningIcon sx={{ color: '#f57c00' }} />
                  )}
                  <Typography color="textSecondary" variant="body2">
                    System Status
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {systemHealth.status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                  Uptime
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {systemHealth.uptime}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                  Active Connections
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {systemHealth.activeConnections}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                  CPU Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{systemHealth.cpuUsage}%</Typography>
                  <Box sx={{ flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ width: `${systemHealth.cpuUsage}%`, height: '100%', backgroundColor: '#ff6b6b' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                  Memory Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{systemHealth.memoryUsage}%</Typography>
                  <Box sx={{ flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ width: `${systemHealth.memoryUsage}%`, height: '100%', backgroundColor: '#ffa500' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                  Disk Usage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{systemHealth.diskUsage}%</Typography>
                  <Box sx={{ flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ width: `${systemHealth.diskUsage}%`, height: '100%', backgroundColor: '#4caf50' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* User Management Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Users ({users.length})
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser} sx={{ backgroundColor: '#1a237e' }}>
                Add User
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Last Login</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditUser(user)} sx={{ color: '#1a237e' }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteUser(user.id)} sx={{ color: '#d32f2f' }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Audit Logs
            </Typography>

            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Resource</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={log.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* System Settings Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  General Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField fullWidth label="System Name" defaultValue="AI SIEM System" variant="outlined" />
                  <TextField fullWidth label="Log Retention Days" defaultValue="90" variant="outlined" type="number" />
                  <TextField fullWidth label="Alert Batch Size" defaultValue="100" variant="outlined" type="number" />
                  <FormControl fullWidth>
                    <InputLabel>Alert Severity Level</InputLabel>
                    <Select defaultValue="medium" label="Alert Severity Level">
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" sx={{ backgroundColor: '#1a237e', alignSelf: 'flex-start' }}>
                    Save Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Security Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField fullWidth label="Session Timeout (minutes)" defaultValue="30" variant="outlined" type="number" />
                  <TextField fullWidth label="Max Login Attempts" defaultValue="5" variant="outlined" type="number" />
                  <FormControl fullWidth>
                    <InputLabel>Require MFA</InputLabel>
                    <Select defaultValue="enabled" label="Require MFA">
                      <MenuItem value="enabled">Enabled</MenuItem>
                      <MenuItem value="disabled">Disabled</MenuItem>
                      <MenuItem value="optional">Optional</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" sx={{ backgroundColor: '#1a237e', alignSelf: 'flex-start' }}>
                    Save Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <MenuItem value="Administrator">Administrator</MenuItem>
              <MenuItem value="Analyst">Analyst</MenuItem>
              <MenuItem value="Operator">Operator</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ backgroundColor: '#1a237e' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
