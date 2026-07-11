import React, { useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ProgressBar from '../shared/ProgressBar';
import { formatDateTime } from '../../utils/helpers';

// 5-level SIEM risk/severity scale
const RISK_COLORS = {
  critical:      'error',
  high:          'warning',
  medium:        'info',
  low:           'success',
  informational: 'primary',
};

const AnomaliesTable = ({ anomalies }) => {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Detected Anomalies</Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {['Timestamp', 'User/Entity', 'Anomaly Type', 'Risk Level', 'Confidence', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {anomalies.length > 0 ? anomalies.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>{formatDateTime(a.timestamp)}</TableCell>
                    <TableCell>{a.entity_name || 'N/A'}</TableCell>
                    <TableCell>{a.anomaly_type}</TableCell>
                    <TableCell><Chip label={a.risk_level} color={RISK_COLORS[a.risk_level?.toLowerCase()] || 'default'} size="small" /></TableCell>
                    <TableCell>
                      <ProgressBar value={a.confidence || 0} color={a.confidence > 80 ? '#d32f2f' : a.confidence > 50 ? '#f57c00' : '#388e3c'} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setSelected(a)} sx={{ color: '#1a237e' }}>View</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>No anomalies detected</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold', py: 1.5, fontSize: 15 }}>Anomaly Details</DialogTitle>
        <DialogContent sx={{ mt: 1, p: 2 }}>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[['Entity', selected.entity_name], ['Anomaly Type', selected.anomaly_type], ['Description', selected.description || selected.summary], ['Confidence Score', `${selected.confidence}%`]].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 120, color: '#64748b', pt: 0.3 }}>{label}</Typography>
                  <Typography variant="body2">{val}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 120, color: '#64748b' }}>Risk Level</Typography>
                <Chip label={selected.risk_level} color={RISK_COLORS[selected.risk_level?.toLowerCase()] || 'default'} size="small" />
              </Box>
              {selected.details && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b' }}>Additional Details</Typography>
                  <Typography sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, fontSize: '0.8rem', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {typeof selected.details === 'string' ? selected.details : JSON.stringify(selected.details, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ py: 1, px: 2 }}>
          <Button onClick={() => setSelected(null)} size="small" sx={{ color: '#1a237e' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AnomaliesTable;
