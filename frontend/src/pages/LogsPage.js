import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Info as InfoIcon,
} from '@mui/icons-material';
import { logService } from '../services/api';
import { toast } from 'react-toastify';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [duplicateFilter, setDuplicateFilter] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const itemsPerPage = 10;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await logService.getLogs({
        page,
        page_size: itemsPerPage,
        duplicates: duplicateFilter,
        source: sourceFilter,
        severity: severityFilter,
      });
      setLogs(response.data.results || response.data);
      setTotalCount(response.data.count || (response.data.results || response.data).length || 0);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [duplicateFilter, page, sourceFilter, severityFilter]);

  const fetchDuplicates = useCallback(async () => {
    try {
      const response = await logService.getDuplicateLogs();
      setDuplicates(response.data);
    } catch (error) {
      console.error('Failed to fetch duplicates:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchDuplicates();
  }, [fetchDuplicates, fetchLogs]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchLogs();
      return;
    }

    try {
      setLoading(true);
      const response = await logService.searchLogs(searchQuery, { 
        page, 
        page_size: itemsPerPage,
        source: sourceFilter,
        severity: severityFilter,
      });
      setLogs(response.data.results || response.data);
      setTotalCount(response.data.count || (response.data.results || response.data).length || 0);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDuplicate = async (logIds) => {
    try {
      await logService.removeDuplicate(logIds);
      toast.success('Duplicates removed successfully');
      fetchLogs();
      fetchDuplicates();
    } catch (error) {
      console.error('Failed to remove duplicates:', error);
      toast.error('Failed to remove duplicates');
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'error', CRITICAL: 'error',
      high: 'warning',   HIGH: 'warning',
      medium: 'info',    MEDIUM: 'info',
      low: 'success',    LOW: 'success',
    };
    return colors[severity] || 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
        Alerts & Logs Management
      </Typography>

      {/* Duplicates Alert */}
      {duplicates.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              onClick={() => handleRemoveDuplicate(duplicates.map(d => d.id))}
              sx={{ color: '#d32f2f' }}
            >
              Remove All
            </Button>
          }
        >
          Found {duplicates.length} duplicate log entries. Click "Remove All" to deduplicate.
        </Alert>
      )}

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              placeholder="Search logs by source, event type, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Source"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value=""><em>All Sources</em></MenuItem>
                <MenuItem value="firewall">Firewall</MenuItem>
                <MenuItem value="ids-system">IDS System</MenuItem>
                <MenuItem value="web-server">Web Server</MenuItem>
                <MenuItem value="auth-service">Auth Service</MenuItem>
                <MenuItem value="network-monitor">Network Monitor</MenuItem>
                <MenuItem value="database">Database</MenuItem>
                <MenuItem value="application">Application</MenuItem>
                <MenuItem value="filesystem">Filesystem</MenuItem>
                <MenuItem value="dns">DNS</MenuItem>
                <MenuItem value="smtp">SMTP</MenuItem>
                <MenuItem value="ftp">FTP</MenuItem>
                <MenuItem value="ftp-data">FTP Data</MenuItem>
                <MenuItem value="ssh">SSH</MenuItem>
                <MenuItem value="http">HTTP</MenuItem>
                <MenuItem value="snmp">SNMP</MenuItem>
                <MenuItem value="dhcp">DHCP</MenuItem>
                <MenuItem value="ssl">SSL</MenuItem>
                <MenuItem value="pop3">POP3</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" type="submit" sx={{ backgroundColor: '#1a237e' }}>
              Search
            </Button>
            <Button
              variant={duplicateFilter ? 'contained' : 'outlined'}
              onClick={() => setDuplicateFilter(!duplicateFilter)}
              sx={{
                backgroundColor: duplicateFilter ? '#d32f2f' : 'transparent',
                color: duplicateFilter ? 'white' : '#d32f2f',
                borderColor: '#d32f2f',
              }}
            >
              Duplicates
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Event Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{log.source || 'N/A'}</TableCell>
                          <TableCell>{log.event_type || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.severity || 'Unknown'}
                              color={getSeverityColor(log.severity)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.message}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<InfoIcon />}
                              onClick={() => handleViewDetails(log)}
                              sx={{ color: '#1a237e' }}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                          No logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={Math.max(1, Math.ceil(totalCount / itemsPerPage))}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a237e', color: 'white', fontWeight: 'bold' }}>
          Log Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Row 1: Timestamp + Source */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Timestamp</Typography>
                  <Typography variant="body2">{new Date(selectedLog.timestamp).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Source</Typography>
                  <Typography variant="body2">{selectedLog.source}</Typography>
                </Box>
              </Box>

              {/* Row 2: Event Type + Severity */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Event Type</Typography>
                  <Chip label={selectedLog.event_type || '—'} size="small"
                    sx={{ backgroundColor: '#e3f2fd', color: '#1a237e', fontWeight: 'bold', mt: 0.5 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Severity</Typography>
                  <Chip label={(selectedLog.severity || '—').toUpperCase()} size="small"
                    color={getSeverityColor(selectedLog.severity)} sx={{ mt: 0.5, fontWeight: 'bold' }} />
                </Box>
              </Box>

              {/* Row 3: Attack Category + Protocol */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Attack Category</Typography>
                  <Typography variant="body2">{selectedLog.attack_category || '—'}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Protocol</Typography>
                  <Typography variant="body2">{selectedLog.raw_data?.protocol || '—'}</Typography>
                </Box>
              </Box>

              {/* Row 4: Service + State + Port */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Service</Typography>
                  <Typography variant="body2">{selectedLog.raw_data?.service || '—'}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>State</Typography>
                  <Typography variant="body2">{selectedLog.raw_data?.state || '—'}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Port</Typography>
                  <Typography variant="body2">{selectedLog.raw_data?.port ?? '—'}</Typography>
                </Box>
              </Box>

              {/* Row 5: Src IP + Dst IP */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Source IP</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedLog.source_ip || '—'}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Destination IP</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedLog.destination_ip || '—'}</Typography>
                </Box>
              </Box>

              {/* Row 6: ML Features */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 0.5 }}>ML Features</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', backgroundColor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                  {[['Duration', selectedLog.features?.duration], ['Packets Sent', selectedLog.features?.packets_sent], ['Bytes Sent', selectedLog.features?.bytes_sent]]
                    .map(([label, val]) => (
                      <Box key={label} sx={{ minWidth: 120 }}>
                        <Typography variant="caption" color="textSecondary">{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{val ?? '—'}</Typography>
                      </Box>
                    ))}
                </Box>
              </Box>

              {/* Row 7: Anomaly Score + Type */}
              {(selectedLog.anomaly_score > 0 || selectedLog.anomaly_type) && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Anomaly Score</Typography>
                    <Chip
                      label={selectedLog.anomaly_score?.toFixed(2) ?? '0.00'} size="small"
                      sx={{
                        mt: 0.5, fontWeight: 'bold', color: 'white',
                        backgroundColor: selectedLog.anomaly_score >= 0.9 ? '#d32f2f'
                          : selectedLog.anomaly_score >= 0.75 ? '#f57c00'
                          : selectedLog.anomaly_score >= 0.45 ? '#388e3c' : '#9e9e9e',
                      }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Anomaly Type</Typography>
                    <Typography variant="body2">{selectedLog.anomaly_type || 'Clean'}</Typography>
                  </Box>
                </Box>
              )}

              {/* Row 8: Message */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Message</Typography>
                <Typography sx={{ backgroundColor: '#f5f5f5', p: 1.5, borderRadius: 1, fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: 0.5 }}>
                  {selectedLog.message}
                </Typography>
              </Box>

            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} sx={{ color: '#1a237e' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LogsPage;
