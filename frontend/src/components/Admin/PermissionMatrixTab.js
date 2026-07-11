import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { allPermissions, hasPermission, roleDefinitions } from '../../utils/rbac';

const roleOptions = Object.keys(roleDefinitions);

const PermissionMatrixTab = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Role Permission Matrix</Typography>
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 260 }}>Capability</TableCell>
              {roleOptions.map((r) => <TableCell key={r} align="center" sx={{ fontWeight: 'bold', minWidth: 160 }}>{r}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {allPermissions.map((permission) => (
              <TableRow key={permission} hover>
                <TableCell>{permission}</TableCell>
                {roleOptions.map((role) => (
                  <TableCell key={role} align="center">
                    {hasPermission(role, permission)
                      ? <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                      : <Box component="span" sx={{ color: 'text.secondary' }}>-</Box>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

export default PermissionMatrixTab;
