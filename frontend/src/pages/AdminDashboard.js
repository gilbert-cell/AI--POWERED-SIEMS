import React, { useState } from 'react';
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
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  ROLES,
  allPermissions,
  getStoredRole,
  hasPermission,
  roleDefinitions,
  setStoredRole,
} from '../utils/rbac';
import { deleteUser, getCurrentUser, getRegisteredUsers, registerUser, updateUser } from '../utils/auth';

const roleOptions = Object.keys(roleDefinitions);

const formatShortDate = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
};

const createSystemHealthSnapshot = (userCount) => ({
  status: 'healthy',
  uptime: `${14 + userCount}d ${8 + (userCount % 5)}h ${12 + (userCount % 40)}m`,
  cpuUsage: Math.min(72, 24 + userCount * 3),
  memoryUsage: Math.min(78, 38 + userCount * 4),
  diskUsage: Math.min(68, 28 + userCount * 2),
  activeConnections: Math.max(6, userCount * 4),
});

const buildAuditLogs = (users, sessionUser) => {
  const now = Date.now();
  return users.slice(0, 4).map((user, index) => ({
    id: user.id,
    user: user.email,
    action: index === 0
      ? 'Signed in to RBAC dashboard'
      : index === 1
      ? 'Reviewed permissions matrix'
      : index === 2
      ? 'Viewed audit history'
      : 'Validated account status',
    resource: index === 0
      ? 'Admin Console'
      : index === 1
      ? (user.role || ROLES.SECURITY_ADMINISTRATOR)
      : index === 2
      ? 'Audit Logs'
      : 'User Directory',
    timestamp: new Date(now - index * 20 * 60000).toLocaleString(),
    status: user.email === sessionUser?.email || index < 3 ? 'success' : 'info',
  }));
};

const AdminDashboard = () => {
  const storedUsers = getRegisteredUsers();
  const sessionUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState(0);
  const [currentRole, setCurrentRole] = useState(getStoredRole());
  const [users, setUsers] = useState(() => storedUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || ROLES.SECURITY_ADMINISTRATOR,
    status: user.status || 'active',
    lastLogin: formatShortDate(user.lastLoginAt),
  })));
  const [systemHealth, setSystemHealth] = useState(() => createSystemHealthSnapshot(storedUsers.length));
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());
  const [auditLogs] = useState(() => buildAuditLogs(storedUsers, sessionUser));

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: ROLES.SECURITY_ADMINISTRATOR, password: '', confirmPassword: '' });
  const [formErrors, setFormErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateUserForm = (data) => {
    const errors = { name: '', email: '', password: '', confirmPassword: '' };
    if (!data.name.trim()) errors.name = 'Name is required';
    if (!data.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(data.email)) errors.email = 'Enter a valid email address';
    if (!selectedUser) {
      if (!data.password) errors.password = 'Password is required';
      else if (data.password.length < 8) errors.password = 'Password must be at least 8 characters';
      if (!data.confirmPassword) errors.confirmPassword = 'Please confirm password';
      else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return !errors.name && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleActiveRoleChange = (role) => {
    setCurrentRole(setStoredRole(role));
  };

  const handleRefresh = () => {
    setSystemHealth((prev) => ({
      ...prev,
      cpuUsage: Math.min(99, Math.max(5, prev.cpuUsage + (Math.random() * 10 - 5))),
      memoryUsage: Math.min(99, Math.max(10, prev.memoryUsage + (Math.random() * 12 - 6))),
      diskUsage: Math.min(99, Math.max(15, prev.diskUsage + (Math.random() * 8 - 4))),
      activeConnections: Math.max(1, Math.round(prev.activeConnections + (Math.random() * 8 - 4))),
    }));
    setLastRefresh(new Date().toLocaleTimeString());
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({ name: '', email: '', role: ROLES.SECURITY_ADMINISTRATOR, password: '', confirmPassword: '' });
    setFormErrors({ name: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setUserDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, password: '', confirmPassword: '' });
    setFormErrors({ name: '', email: '', password: '', confirmPassword: '' });
    setUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!validateUserForm(formData)) return;

    if (selectedUser) {
      try {
        const updatedUser = updateUser(selectedUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined,
        });
        setUsers(users.map((u) => (u.id === selectedUser.id ? {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status || 'active',
          lastLogin: formatShortDate(updatedUser.lastLoginAt),
        } : u)));
      } catch (err) {
        setFormErrors((prev) => ({ ...prev, email: err.message }));
        return;
      }
    } else {
      let createdUser;
      try {
        createdUser = registerUser({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
      } catch (err) {
        setFormErrors((prev) => ({ ...prev, email: err.message }));
        return;
      }
      setUsers([
        ...users,
        {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          status: createdUser.status,
          lastLogin: formatShortDate(createdUser.lastLoginAt),
        },
      ]);
    }
    setUserDialogOpen(false);
  };

  const handleDeleteUser = (user) => {
    setPendingDeleteUser(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = () => {
    if (pendingDeleteUser) {
      deleteUser(pendingDeleteUser.id);
      setUsers(users.filter((u) => u.id !== pendingDeleteUser.id));
      setPendingDeleteUser(null);
    }
    setDeleteConfirmOpen(false);
  };

  const getRoleColor = (role) => {
    return roleDefinitions[role]?.color || 'default';
  };

  const getStatusColor = (status) => status === 'active' ? 'success' : 'default';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            RBAC Dashboard
          </Typography>
          <Typography color="textSecondary">
            Manage role-based access for SIEM users, dashboards, and security workflows.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography color="textSecondary" variant="body2">
          Updated at {lastRefresh}
        </Typography>
        <Tooltip title="Refresh system health metrics">
          <IconButton sx={{ color: '#1a237e' }} onClick={handleRefresh} aria-label="Refresh system metrics">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>

      <Tabs
        value={activeTab}
        onChange={(e, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}
      >
        <Tab label="Access Overview" />
        <Tab label="System Health" />
        <Tab label="User Management" />
        <Tab label="Permission Matrix" />
        <Tab label="Audit Logs" />
        <Tab label="System Settings" />
      </Tabs>

      {/* Access Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Active Role Simulation
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Switch roles to preview navigation and protected route access in this SIEM dashboard.
                    </Typography>
                  </Box>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
                    <InputLabel>Current Role</InputLabel>
                    <Select
                      value={currentRole}
                      label="Current Role"
                      onChange={(event) => handleActiveRoleChange(event.target.value)}
                    >
                      {roleOptions.map((role) => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {roleOptions.map((role) => {
            const definition = roleDefinitions[role];
            return (
              <Grid item xs={12} md={4} key={role}>
                <Card sx={{ height: '100%', borderTop: role === currentRole ? '4px solid #1a237e' : '4px solid transparent' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                        {role}
                      </Typography>
                      <Chip label={`${definition.permissions.length} permissions`} color={definition.color} size="small" />
                    </Box>
                    <Typography color="textSecondary" variant="body2" sx={{ minHeight: { md: 60 }, mb: 2 }}>
                      {definition.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {definition.permissions.slice(0, 5).map((permission) => (
                        <Box key={permission} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                          <Typography variant="body2">{permission}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* System Health Tab */}
      {activeTab === 1 && (
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
      {activeTab === 2 && (
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
                          <IconButton size="small" onClick={() => handleDeleteUser(user)} sx={{ color: '#d32f2f' }}>
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

      {/* Permission Matrix Tab */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Role Permission Matrix
            </Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 260 }}>Capability</TableCell>
                    {roleOptions.map((role) => (
                      <TableCell key={role} align="center" sx={{ fontWeight: 'bold', minWidth: 160 }}>
                        {role}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPermissions.map((permission) => (
                    <TableRow key={permission} hover>
                      <TableCell>{permission}</TableCell>
                      {roleOptions.map((role) => (
                        <TableCell key={role} align="center">
                          {hasPermission(role, permission) ? (
                            <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                          ) : (
                            <Typography component="span" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 4 && (
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
      {activeTab === 5 && (
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
            error={Boolean(formErrors.name)}
            helperText={formErrors.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) {
                setFormErrors({ ...formErrors, name: '' });
              }
            }}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            value={formData.email}
            error={Boolean(formErrors.email)}
            helperText={formErrors.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (formErrors.email) {
                setFormErrors({ ...formErrors, email: '' });
              }
            }}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {!selectedUser && (
            <>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                error={Boolean(formErrors.password)}
                helperText={formErrors.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                }}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                error={Boolean(formErrors.confirmPassword)}
                helperText={formErrors.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                }}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ backgroundColor: '#1a237e' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {pendingDeleteUser?.name || 'this user'}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteUser} variant="contained" sx={{ backgroundColor: '#d32f2f' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
