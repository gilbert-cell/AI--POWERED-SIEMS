import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Alert, Button, Chip, Paper, Stack, Tooltip } from '@mui/material';
import { useLocation } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import { toast } from 'react-toastify';
import { useLogs } from '../components/Logs/useLogs';
import LogFilters from '../components/Logs/LogFilters';
import LogTable from '../components/Logs/LogTable';
import LogDetailDialog from '../components/Logs/LogDetailDialog';
import { logService } from '../services/api';

const LogsPage = () => {
  const {
    logs, duplicates, loading, page, setPage, totalCount, fpCount, PAGE_SIZE,
    searchQuery, setSearchQuery, duplicateFilter, setDuplicateFilter,
    sourceFilter, setSourceFilter, severityFilter, setSeverityFilter,
    statusFilter, setStatusFilter,
    timeRange, setTimeRange, isLive,
    handleSearch, handleRemoveDuplicate,
  } = useLogs();

  const location = useLocation();
  const [selectedLog, setSelectedLog] = useState(null);

  // Pre-apply filters from URL e.g. /logs?status=false_positive or /logs?severity=critical
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('status');
    const sev = params.get('severity');
    if (s) setStatusFilter(s);
    if (sev) setSeverityFilter(sev.toUpperCase());
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    try {
      const res = await logService.exportLogs({
        source: sourceFilter || undefined,
        severity: severityFilter || undefined,
        range: isLive ? undefined : timeRange,
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `siem-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          border: '1px solid #dbe5f3',
          background: 'linear-gradient(135deg, #ffffff 0%, #eef6ff 55%, #fff7ed 100%)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 800, letterSpacing: 0 }}>
              Security Event Center
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }}>
              Alerts & Logs Management
            </Typography>
            <Typography sx={{ mt: 1, color: '#64748b', maxWidth: 680 }}>
              Review incoming telemetry, isolate duplicate events, and inspect AI-enriched log details.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
            <Chip label={`${totalCount} logs`} sx={{ bgcolor: '#0f172a', color: '#fff', fontWeight: 800 }} />
            <Chip label={`${duplicates.length} duplicates`} sx={{ bgcolor: duplicates.length ? '#fee2e2' : '#dcfce7', color: duplicates.length ? '#991b1b' : '#166534', fontWeight: 800 }} />
            <Chip
              label={`${fpCount} false positives`}
              onClick={() => setStatusFilter(statusFilter === 'false_positive' ? '' : 'false_positive')}
              sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 800, cursor: 'pointer', border: statusFilter === 'false_positive' ? '2px solid #dc2626' : '2px solid transparent' }}
            />
            <Tooltip title="Download all logs as CSV">
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={totalCount === 0}
                sx={{ bgcolor: '#1a237e', '&:hover': { bgcolor: '#0d1b4b' }, fontWeight: 700, borderRadius: 2 }}
              >
                Download All CSV
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      {duplicates.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2, border: '1px solid #fed7aa', '& .MuiAlert-message': { fontWeight: 600 } }}
          action={<Button size="small" onClick={() => handleRemoveDuplicate(duplicates.map((d) => d.id))} sx={{ color: '#9a3412', fontWeight: 800 }}>Remove All</Button>}
        >
          Found {duplicates.length} duplicate log entries. Click "Remove All" to deduplicate.
        </Alert>
      )}

      <LogFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        severityFilter={severityFilter} setSeverityFilter={setSeverityFilter}
        sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        duplicateFilter={duplicateFilter} setDuplicateFilter={setDuplicateFilter}
        timeRange={timeRange} setTimeRange={setTimeRange} isLive={isLive}
        onSearch={handleSearch}
      />

      <LogTable
        logs={logs} loading={loading} page={page} totalCount={totalCount} pageSize={PAGE_SIZE}
        onPageChange={setPage} onViewDetails={setSelectedLog}
      />

      <LogDetailDialog log={selectedLog} open={!!selectedLog} onClose={() => setSelectedLog(null)} />
    </Container>
  );
};

export default LogsPage;
