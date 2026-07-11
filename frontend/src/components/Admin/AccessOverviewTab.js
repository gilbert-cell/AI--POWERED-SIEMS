import React from 'react';
import { Grid, Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { roleDefinitions } from '../../utils/rbac';

const roleOptions = Object.keys(roleDefinitions);

const AccessOverviewTab = ({ currentRole, onRoleChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Active Role Simulation</Typography>
              <Typography color="textSecondary" variant="body2">Switch roles to preview navigation and protected route access in this SIEM dashboard.</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
              <InputLabel>Current Role</InputLabel>
              <Select value={currentRole} label="Current Role" onChange={(e) => onRoleChange(e.target.value)}>
                {roleOptions.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    {roleOptions.map((role) => {
      const def = roleDefinitions[role];
      return (
        <Grid item xs={12} md={4} key={role}>
          <Card sx={{ height: '100%', borderTop: role === currentRole ? '4px solid #1a237e' : '4px solid transparent' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>{role}</Typography>
                <Chip label={`${def.permissions.length} permissions`} color={def.color} size="small" />
              </Box>
              <Typography color="textSecondary" variant="body2" sx={{ minHeight: { md: 60 }, mb: 2 }}>{def.description}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {def.permissions.slice(0, 5).map((p) => (
                  <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                    <Typography variant="body2">{p}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      );
    })}
  </Grid>
);

export default AccessOverviewTab;
