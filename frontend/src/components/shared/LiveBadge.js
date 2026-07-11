import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatTime } from '../../utils/helpers';

const LiveBadge = ({ lastUpdated }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#ffebee', px: 1.5, py: 0.5, borderRadius: 2 }}>
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d32f2f', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } } }} />
    <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>LIVE</Typography>
    {lastUpdated && <Typography variant="caption" sx={{ color: '#999', ml: 0.5 }}>· {formatTime(lastUpdated)}</Typography>}
  </Box>
);

export default LiveBadge;
