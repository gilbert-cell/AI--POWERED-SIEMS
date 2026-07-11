import React from 'react';
import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Chip, Pagination, Typography, Tooltip } from '@mui/material';
import { Info as InfoIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, HourglassEmpty as PendingIcon } from '@mui/icons-material';
import { formatDateTime } from '../../utils/helpers';

const _sev = (s) => (s || '').toLowerCase();

const SEVERITY_COLOR_MAP = {
  informational: 'primary', critical: 'error', high: 'warning', medium: 'info', low: 'success',
};
const SEVERITY_ACCENT_MAP = {
  informational: '#1565c0', critical: '#dc2626', high: '#f97316', medium: '#ca8a04', low: '#16a34a',
};
const SEVERITY_COLORS  = new Proxy(SEVERITY_COLOR_MAP,  { get: (t, k) => t[_sev(k)] });
const SEVERITY_ACCENTS = new Proxy(SEVERITY_ACCENT_MAP, { get: (t, k) => t[_sev(k)] });

const STATUS_CONFIG = {
  confirmed:      { label: '✅ True Positive',  bg: '#f0fdf4', color: '#166534' },
  false_positive: { label: '❌ False Positive', bg: '#fef2f2', color: '#991b1b' },
  new:            { label: '⏳ Pending',         bg: '#eff6ff', color: '#1d4ed8' },
  reviewing:      { label: '🔍 Reviewing',       bg: '#fefce8', color: '#854d0e' },
  resolved:       { label: '✔ Resolved',         bg: '#f0fdf4', color: '#166534' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>—</Typography>;
  return (
    <Chip label={cfg.label} size="small" sx={{
      bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, height: 22,
    }} />
  );
};

const LogTable = ({ logs, loading, page, totalCount, pageSize, onPageChange, onViewDetails }) => (
  <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07) !important' }}>
    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2, display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <Box>
          <Typography sx={{ fontWeight: 900, color: '#0f172a' }}>Event stream</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>{totalCount} matching records</Typography>
        </Box>
        <Chip label={`Page ${page}`} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }} />
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 620 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {['Log ID', 'Timestamp', 'Source', 'Event Type', 'Severity', 'Status', 'Message', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 900, color: '#475569', bgcolor: '#f8fafc', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length > 0 ? logs.map((log) => {
                  const status = log.display_status || log.anomaly?.status || log.status;
                  const isFP = status === 'false_positive';
                  return (
                    <TableRow
                      key={log.id}
                      hover
                      sx={{
                        borderLeft: `4px solid ${isFP ? '#dc2626' : (SEVERITY_ACCENTS[log.severity] || '#cbd5e1')}`,
                        backgroundColor: isFP ? '#fff5f5' : 'inherit',
                        '& td': { borderBottom: '1px solid #edf2f7' },
                        '&:hover': { bgcolor: '#f8fbff !important' },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, color: '#1d4ed8', fontSize: 12, whiteSpace: 'nowrap' }}>#{log.id}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 13 }}>{formatDateTime(log.timestamp)}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{log.source || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={log.event_type || 'N/A'} size="small" sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 800, maxWidth: 180 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={(log.severity || 'Unknown').toLowerCase()} color={SEVERITY_COLORS[log.severity] || 'default'} size="small" sx={{ textTransform: 'uppercase', minWidth: 78 }} />
                      </TableCell>
                      <TableCell><StatusBadge status={status} /></TableCell>
                      <TableCell sx={{ maxWidth: 380, color: '#334155' }}>
                        <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {log.message || 'No message captured'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" startIcon={<InfoIcon />} onClick={() => onViewDetails(log)} sx={{ color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 800, '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff' } }}>Details</Button>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 7, color: '#64748b', fontWeight: 700 }}>No logs found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#fbfdff' }}>
            <Pagination count={Math.max(1, Math.ceil(totalCount / pageSize))} page={page} onChange={(_, v) => onPageChange(v)} color="primary" />
          </Box>
        </>
      )}
    </CardContent>
  </Card>
);

export default LogTable;
