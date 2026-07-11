import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box } from '@mui/material';

const HEADERS = ['Source', 'Total Events', 'Critical', 'High', 'Medium', 'Low', 'False Positives', 'Duplicates'];

const SourceMetricsTable = ({ sourceMetrics }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: 18 }}>Metrics by Source System</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#1a237e' }}>
            <TableRow>
              {HEADERS.map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', fontSize: 15 }} align={h === 'Source' ? 'left' : 'center'}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(sourceMetrics).length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ color: '#999', py: 3 }}>No data available</TableCell></TableRow>
            ) : Object.entries(sourceMetrics).map(([source, m]) => (
              <TableRow key={source} hover>
                <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 15 }}>{source}</TableCell>
                <TableCell align="center">{m.total}</TableCell>
                <TableCell align="center"><Chip label={m.critical} size="small" sx={{ backgroundColor: '#ffebee', color: '#d32f2f', fontWeight: 'bold' }} /></TableCell>
                <TableCell align="center"><Chip label={m.high} size="small" sx={{ backgroundColor: '#fff3e0', color: '#f57c00', fontWeight: 'bold' }} /></TableCell>
                <TableCell align="center"><Chip label={m.medium} size="small" sx={{ backgroundColor: '#fffde7', color: '#f9a825', fontWeight: 'bold' }} /></TableCell>
                <TableCell align="center"><Chip label={m.low} size="small" sx={{ backgroundColor: '#e8f5e9', color: '#388e3c', fontWeight: 'bold' }} /></TableCell>
                <TableCell align="center">{m.false_positives}</TableCell>
                <TableCell align="center">{m.duplicates}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

export default SourceMetricsTable;
