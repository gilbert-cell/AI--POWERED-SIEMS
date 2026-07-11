import React from 'react';
import { Box } from '@mui/material';

const SEVERITY_COLORS = {
  critical: { bg: '#ffebee', color: '#d32f2f' },
  high:     { bg: '#fff3e0', color: '#f57c00' },
  medium:   { bg: '#fffde7', color: '#f9a825' },
  low:      { bg: '#e8f5e9', color: '#388e3c' },
};

export const SeverityChip = ({ severity }) => {
  const c = SEVERITY_COLORS[severity] || { bg: '#f5f5f5', color: '#666' };
  return (
    <Box sx={{ display: 'inline-block', backgroundColor: c.bg, color: c.color, px: 1.5, py: 0.4, borderRadius: 1, fontSize: '0.8rem', fontWeight: 'bold' }}>
      {severity?.toUpperCase()}
    </Box>
  );
};

export const StatusChip = ({ enabled }) => (
  <Box sx={{ display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 1, fontSize: '0.8rem', fontWeight: 'bold',
    backgroundColor: enabled ? '#e8f5e9' : '#ffebee', color: enabled ? '#388e3c' : '#d32f2f' }}>
    {enabled ? 'Enabled' : 'Disabled'}
  </Box>
);
