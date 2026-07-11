import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Button, TextField, MenuItem, Select, FormControl, InputLabel, Paper, Stack,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { logService } from '../services/api';
import { formatDateTime } from '../utils/helpers';

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
    <Container maxWidth="lg" sx={{ py: 1.5 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 2, border: '1px solid #dbe5f3', background: 'linear-gradient(135deg, #ffffff 0%, #eef6ff 60%, #fff7ed 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}
            variant="outlined"
            sx={{ color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 800, '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' } }}>
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 900, letterSpacing: 0, fontSize: 11 }}>Source Investigation</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', lineHeight: 1.2 }}>
              {source} Logs
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75}>
            <Chip size="small" label={`${total} total`} sx={{ backgroundColor: '#0f172a', color: '#fff', fontWeight: 900 }} />
            <Chip size="small" label={`${filtered.length} shown`} sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 900 }} />
          </Stack>
        </Box>
        <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 1fr) 140px auto' }, gap: 1, alignItems: 'center' }}>
          <TextField size="small" placeholder="Search logs..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            sx={{ bgcolor: '#fff', borderRadius: 1 }} />
          <FormControl size="small" sx={{ bgcolor: '#fff', borderRadius: 1 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severityFilter} label="Severity" onChange={e => setSeverityFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" startIcon={<RefreshIcon />} onClick={() => fetchLogs(true)} variant="contained" sx={{ bgcolor: '#1d4ed8', fontWeight: 800, '&:hover': { bgcolor: '#1e40af' } }}>
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06) !important' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><CircularProgress size={28} /></Box>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Timestamp', 'Event Type', 'Severity', 'AI Score', 'Decision', 'Message'].map(h => (
                      <TableCell key={h} sx={{ color: '#475569', bgcolor: '#f8fafc', fontWeight: 900, borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap', fontSize: 12, py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length > 0 ? filtered.map((log, i) => (
                    <TableRow key={log.id || i} hover sx={{ borderLeft: `3px solid ${SEVERITY_COLORS[log.severity] || '#cbd5e1'}`, '& td': { borderBottom: '1px solid #edf2f7', py: 0.75 }, '&:hover': { bgcolor: '#f8fbff !important' } }}>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 11, color: '#64748b' }}>
                        {formatDateTime(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.event_type || log.level || '—'} size="small"
                          sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 900, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={(log.severity || '—').toLowerCase()} size="small"
                          sx={{ backgroundColor: SEVERITY_COLORS[log.severity] || '#94a3b8', color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, minWidth: 64 }} />
                      </TableCell>
                      <TableCell>
                        {log.anomaly_score != null ? (
                          <Chip label={log.anomaly_score.toFixed(2)} size="small"
                            sx={{ backgroundColor: log.anomaly_score >= 0.9 ? '#d32f2f' : log.anomaly_score >= 0.75 ? '#f57c00' : log.anomaly_score >= 0.45 ? '#388e3c' : '#9e9e9e', color: 'white', fontWeight: 900, fontSize: 11 }} />
                        ) : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {log.anomaly_type
                          ? <Chip label={log.anomaly_type} size="small" variant="outlined" sx={{ borderColor: '#bfdbfe', color: '#1d4ed8', fontSize: 10, fontWeight: 900 }} />
                          : <Typography variant="caption" color="textSecondary">Clean</Typography>}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 380 }}>
                        <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#334155' }}>
                          {log.message || 'No message captured'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: '#64748b', fontWeight: 700 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 1.5, alignItems: 'center' }}>
          <Button size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="outlined" sx={{ color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 800 }}>Previous</Button>
          <Typography variant="caption" color="textSecondary">Page {page} of {Math.ceil(total / PAGE_SIZE)}</Typography>
          <Button size="small" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)} variant="outlined" sx={{ color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 800 }}>Next</Button>
        </Box>
      )}
    </Container>
  );
};

export default LogDetailsPage;
