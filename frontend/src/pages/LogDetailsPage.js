import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Button, TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { logService } from '../services/api';

const SEVERITY_COLORS = {
  critical: '#d32f2f', high: '#f57c00', medium: '#f9a825', low: '#388e3c',
};

const LogDetailsPage = () => {
  const { source } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await logService.getLogs({ source, page, page_size: PAGE_SIZE, q: search });
      setLogs(res.data.results || res.data.logs || []);
      setTotal(res.data.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [source, page, search]);

  useEffect(() => { fetchLogs(true); }, [fetchLogs]);

  const filtered = severityFilter === 'all'
    ? logs
    : logs.filter(l => l.severity === severityFilter);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}
          sx={{ color: '#1a237e', border: '1px solid #1a237e' }}>
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e', textTransform: 'uppercase' }}>
          {source} Logs
        </Typography>
        <Chip label={`${total} total`} sx={{ backgroundColor: '#e3f2fd', color: '#1a237e', fontWeight: 'bold' }} />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search logs..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            sx={{ width: 200 }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severityFilter} label="Severity" onChange={e => setSeverityFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<RefreshIcon />} onClick={() => fetchLogs(true)} sx={{ color: '#1a237e' }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#1a237e' }}>
                  <TableRow>
                    {['Timestamp', 'Event Type', 'Severity', 'AI Score', 'Decision', 'Message'].map(h => (
                      <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length > 0 ? filtered.map((log, i) => (
                    <TableRow key={log.id || i} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.event_type || log.level || '—'} size="small"
                          sx={{ backgroundColor: '#e3f2fd', color: '#1a237e', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={log.severity || '—'} size="small"
                          sx={{ backgroundColor: SEVERITY_COLORS[log.severity] || '#9e9e9e', color: 'white', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      </TableCell>
                      <TableCell>
                        {log.anomaly_score != null ? (
                          <Chip label={log.anomaly_score.toFixed(2)} size="small"
                            sx={{
                              backgroundColor: log.anomaly_score >= 0.9 ? '#d32f2f' : log.anomaly_score >= 0.75 ? '#f57c00' : log.anomaly_score >= 0.45 ? '#388e3c' : '#9e9e9e',
                              color: 'white', fontWeight: 'bold',
                            }} />
                        ) : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {log.anomaly_type ? (
                          <Chip label={log.anomaly_type} size="small" variant="outlined"
                            sx={{ borderColor: '#1a237e', color: '#1a237e', fontSize: 11 }} />
                        ) : <Typography variant="caption" color="textSecondary">Clean</Typography>}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#444' }}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                        No logs found for <strong>{source}</strong>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, alignItems: 'center' }}>
          <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} sx={{ color: '#1a237e' }}>Previous</Button>
          <Typography variant="body2" color="textSecondary">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </Typography>
          <Button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)} sx={{ color: '#1a237e' }}>Next</Button>
        </Box>
      )}
    </Container>
  );
};

export default LogDetailsPage;
