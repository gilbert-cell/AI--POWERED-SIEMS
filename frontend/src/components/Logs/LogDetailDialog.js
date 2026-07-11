import React from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip } from '@mui/material';
import { formatDateTime } from '../../utils/helpers';

const SEVERITY_COLORS = { critical: 'error', CRITICAL: 'error', high: 'warning', HIGH: 'warning', medium: 'info', MEDIUM: 'info', low: 'success', LOW: 'success' };

const STATUS_CONFIG = {
  confirmed:      { label: '✅ True Positive',  bg: '#f0fdf4', color: '#166534' },
  false_positive: { label: '❌ False Positive', bg: '#fef2f2', color: '#991b1b' },
  new:            { label: '⏳ Pending',         bg: '#eff6ff', color: '#1d4ed8' },
  reviewing:      { label: '🔍 Reviewing',       bg: '#fefce8', color: '#854d0e' },
  resolved:       { label: '✔ Resolved',         bg: '#f0fdf4', color: '#166534' },
};

const Field = ({ label, children }) => (
  <Box sx={{ flex: 1, minWidth: 140, p: 1, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#fbfdff' }}>
    <Typography sx={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0 }}>{label}</Typography>
    {children}
  </Box>
);

const Row = ({ children }) => <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{children}</Box>;

const LogDetailDialog = ({ log, open, onClose }) => {
  const status = log?.display_status || log?.anomaly?.status || log?.status;
  const statusCfg = STATUS_CONFIG[status];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #0f172a, #1d4ed8)', color: 'white', fontWeight: 900, fontSize: 15, py: 1.5 }}>
        Log Details
        {log?.severity && (
          <Chip label={log.severity.toUpperCase()} size="small" sx={{ ml: 1.5, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 900, fontSize: 11 }} />
        )}
        {statusCfg && (
          <Chip label={statusCfg.label} size="small" sx={{ ml: 1, bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 900, fontSize: 11 }} />
        )}
      </DialogTitle>
      <DialogContent sx={{ mt: 1.5, bgcolor: '#f8fafc', px: 2, py: 1 }}>
        {log && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Row>
              <Field label="Timestamp"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatDateTime(log.timestamp)}</Typography></Field>
              <Field label="Source"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.source}</Typography></Field>
            </Row>
            <Row>
              <Field label="Event Type">
                <Chip label={log.event_type || '—'} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1a237e', fontWeight: 'bold', mt: 0.25, fontSize: 12 }} />
              </Field>
              <Field label="Severity">
                <Chip label={(log.severity || '—').toUpperCase()} size="small" color={SEVERITY_COLORS[log.severity] || 'default'} sx={{ mt: 0.25, fontWeight: 'bold', fontSize: 12 }} />
              </Field>
            </Row>
            <Row>
              <Field label="Attack Category"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.attack_category || '—'}</Typography></Field>
              <Field label="Protocol"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.raw_data?.protocol || '—'}</Typography></Field>
            </Row>
            <Row>
              <Field label="Service"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.raw_data?.service || '—'}</Typography></Field>
              <Field label="State"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.raw_data?.state || '—'}</Typography></Field>
              <Field label="Port"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.raw_data?.port ?? '—'}</Typography></Field>
            </Row>
            <Row>
              <Field label="Source IP"><Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{log.source_ip || '—'}</Typography></Field>
              <Field label="Destination IP"><Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{log.destination_ip || '—'}</Typography></Field>
            </Row>
            <Box sx={{ backgroundColor: '#ffffff', p: 1, borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 900, color: '#0f172a', mb: 0.5 }}>ML Features</Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {[['Duration', log.features?.duration], ['Packets Sent', log.features?.packets_sent], ['Bytes Sent', log.features?.bytes_sent]].map(([label, val]) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: 11, color: '#64748b' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 'bold' }}>{val ?? '—'}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 900, color: '#0f172a', mb: 0.5 }}>Message</Typography>
              <Typography sx={{ backgroundColor: '#0f172a', color: '#dbeafe', p: 1, borderRadius: 1, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                {log.message}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid #e2e8f0' }}>
        <Button size="small" onClick={onClose} variant="contained" sx={{ bgcolor: '#1d4ed8', fontWeight: 800, '&:hover': { bgcolor: '#1e40af' } }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogDetailDialog;
