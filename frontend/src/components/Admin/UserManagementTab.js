import React, { useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Chip, IconButton, Tooltip, Typography, InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { ROLES, normalizeRole, roleDefinitions } from '../../utils/rbac';

const roleOptions = Object.keys(roleDefinitions);
const EMPTY_FORM = { name: '', email: '', role: ROLES.SECURITY_ANALYST, password: '', confirmPassword: '' };
const EMPTY_ERRORS = { name: '', email: '', password: '', confirmPassword: '' };

const validate = (data, isNew) => {
  const e = { ...EMPTY_ERRORS };
  if (!data.name.trim()) e.name = 'Name is required';
  if (!data.email.trim()) e.email = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = 'Enter a valid email address';
  if (isNew) {
    if (!data.password) e.password = 'Password is required';
    else if (data.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!data.confirmPassword) e.confirmPassword = 'Please confirm password';
    else if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match';
  }
  return e;
};

const UserManagementTab = ({ users, onSave, onDelete }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const openAdd = () => { setSelected(null); setForm(EMPTY_FORM); setErrors(EMPTY_ERRORS); setShowPw(false); setShowConfirm(false); setDialogOpen(true); };
  const openEdit = (u) => { setSelected(u); setForm({ name: u.name, email: u.email, role: normalizeRole(u.role), password: '', confirmPassword: '' }); setErrors(EMPTY_ERRORS); setDialogOpen(true); };

  const handleSave = async () => {
    const e = validate(form, !selected);
    if (Object.values(e).some(Boolean)) { setErrors(e); return; }
    const ok = await onSave(form, selected, (msg) => setErrors((prev) => ({ ...prev, email: msg })));
    if (ok) setDialogOpen(false);
  };

  const f = (key) => (ev) => { setForm((p) => ({ ...p, [key]: ev.target.value })); if (errors[key]) setErrors((p) => ({ ...p, [key]: '' })); };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Users ({users.length})</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ backgroundColor: '#1a237e' }}>Add User</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Chip label={normalizeRole(u.role)} color={roleDefinitions[normalizeRole(u.role)]?.color || 'default'} size="small" /></TableCell>
                    <TableCell><Chip label={u.status} color={u.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell>{u.lastLogin}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(u)} sx={{ color: '#1a237e' }}><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => { setPending(u); setDeleteOpen(true); }} sx={{ color: '#d32f2f' }}><DeleteIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Full Name" value={form.name} error={!!errors.name} helperText={errors.name} onChange={f('name')} margin="normal" />
          <TextField fullWidth label="Email" value={form.email} error={!!errors.email} helperText={errors.email} onChange={f('email')} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              {roleOptions.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          {!selected && (
            <>
              <TextField fullWidth label="Password" type={showPw ? 'text' : 'password'} value={form.password} error={!!errors.password} helperText={errors.password} onChange={f('password')} margin="normal"
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
              <TextField fullWidth label="Confirm Password" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} error={!!errors.confirmPassword} helperText={errors.confirmPassword} onChange={f('confirmPassword')} margin="normal"
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">{showConfirm ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#1a237e' }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete {pending?.name || 'this user'}? This action cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={async () => { await onDelete(pending); setDeleteOpen(false); }} variant="contained" sx={{ backgroundColor: '#d32f2f' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagementTab;
