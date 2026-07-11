import React from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, CircularProgress, Chip, Typography,
} from '@mui/material';
import { Refresh as RefreshIcon, AddCircleOutline as AddRuleIcon } from '@mui/icons-material';
import { formatDateTime } from '../../utils/helpers';

const DecisionsTab = ({ decisions, loading, onRefresh, onCreateRule }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Button startIcon={<RefreshIcon />} onClick={onRefresh} sx={{ color: '#1a237e' }}>Refresh</Button>
    </Box>
    <Card>
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {['Timestamp', 'Event', 'Source', 'Score', 'Decision', 'Rule'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {decisions.length > 0 ? decisions.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>{formatDateTime(d.timestamp)}</TableCell>
                    <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.event_description}
                    </TableCell>
                    <TableCell>
                      <Chip label={d.source || '—'} size="small" variant="outlined"
                        sx={{ borderColor: '#1a237e', color: '#1a237e' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.score != null ? d.score.toFixed(2) : (d.confidence / 100).toFixed(2)}
                        size="small"
                        sx={{
                          backgroundColor: d.score >= 0.9 ? '#d32f2f' : d.score >= 0.75 ? '#f57c00' : d.score > 0 ? '#388e3c' : '#9e9e9e',
                          color: 'white', fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={d.secondary_decision || d.decision}
                        color={d.decision === 'threat' ? 'error' : 'success'}
                        size="small" sx={{ textTransform: 'uppercase' }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<AddRuleIcon />}
                        onClick={() => onCreateRule(d.attack_type || d.secondary_decision, d.source, d.score ?? d.confidence / 100)}
                        sx={{ color: '#1a237e', fontSize: 11, whiteSpace: 'nowrap' }}>
                        → Rule
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>No AI decisions available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  </Box>
);

export default DecisionsTab;
