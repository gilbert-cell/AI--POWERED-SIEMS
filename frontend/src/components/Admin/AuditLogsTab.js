import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

const AuditLogsTab = ({ auditLogs }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Audit Logs</Typography>
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              {['Timestamp', 'User', 'Action', 'Resource', 'Status'].map((h) => <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.resource}</TableCell>
                <TableCell><Chip label={log.status} color={log.status === 'success' ? 'success' : 'error'} size="small" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

export default AuditLogsTab;
