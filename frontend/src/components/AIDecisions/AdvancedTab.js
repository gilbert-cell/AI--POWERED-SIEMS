import React from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, CircularProgress, Chip, Typography,
} from '@mui/material';
import { Refresh as RefreshIcon, AddCircleOutline as AddRuleIcon } from '@mui/icons-material';
import { formatDateTime } from '../../utils/helpers';

const ACTION_COLORS = {
  BLOCK: '#d32f2f', INVESTIGATE: '#f57c00', MONITOR: '#1565c0',
  ESCALATE: '#6a1b9a', QUARANTINE: '#880e4f',
};

const AdvancedTab = ({ advancedData, advancedLoading, onRefresh, onCreateRule }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Button startIcon={<RefreshIcon />} onClick={onRefresh} sx={{ color: '#1a237e' }}>Refresh</Button>
    </Box>

    <Card sx={{ mb: 3 }}>
      <CardContent>
        {advancedLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {['Timestamp', 'Type of Attack', 'Action', 'Remediation', 'Rule'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {advancedData?.results?.length > 0 ? advancedData.results.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(row.timestamp)}</TableCell>
                    <TableCell>
                      <Chip label={row.attack_type} size="small"
                        sx={{ backgroundColor: '#e3f2fd', color: '#1a237e', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={row.action} size="small"
                        sx={{ backgroundColor: ACTION_COLORS[row.action] || '#666', color: 'white', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#444' }}>{row.remediation}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<AddRuleIcon />}
                        onClick={() => onCreateRule(row.attack_type, row.source, row.score)}
                        sx={{ color: '#1a237e', fontSize: 11, whiteSpace: 'nowrap' }}>
                        → Rule
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>No advanced decisions available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>

    {advancedData?.attack_counts && (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1.5 }}>
          Total Attacks by Type (Live)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 1 }}>
          {Object.entries(advancedData.attack_counts).map(([type, count]) => (
            <Chip key={type} label={`${type} = ${count}`}
              sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: 13, px: 1 }} />
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: '#888' }}>
          Total: {advancedData.total} events analyzed
        </Typography>
      </Box>
    )}
  </Box>
);

export default AdvancedTab;
