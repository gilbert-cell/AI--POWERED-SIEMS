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

  const itemsPerPage = 10;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await logService.getLogs({
        page,
        page_size: itemsPerPage,
        duplicates: duplicateFilter,
        source: sourceFilter,
      });
      setLogs(response.data.results || response.data);
      setTotalCount(response.data.count || (response.data.results || response.data).length || 0);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [duplicateFilter, page, sourceFilter]);

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
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    return colors[severity?.toLowerCase()] || 'default';
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
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Timestamp
                </Typography>
                <Typography>{new Date(selectedLog.timestamp).toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Source
                </Typography>
                <Typography>{selectedLog.source}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Event Type
                </Typography>
                <Typography>{selectedLog.event_type}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Severity
                </Typography>
                <Chip label={selectedLog.severity} color={getSeverityColor(selectedLog.severity)} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Message
                </Typography>
                <Typography sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedLog.message}
                </Typography>
              </Box>
              {selectedLog.raw_data && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Raw Data
                  </Typography>
                  <Typography sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                    {typeof selectedLog.raw_data === 'string' ? selectedLog.raw_data : JSON.stringify(selectedLog.raw_data, null, 2)}
                  </Typography>
                </Box>
              )}
              {selectedLog.metadata && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Metadata
                  </Typography>
                  <Typography sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} sx={{ color: '#1a237e' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LogsPage;
