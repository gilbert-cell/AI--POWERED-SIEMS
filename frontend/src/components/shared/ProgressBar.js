import React from 'react';
import { Box, Typography } from '@mui/material';

const ProgressBar = ({ value = 0, color = '#1a237e', height = 8, showLabel = true, width = 60 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ width, height, backgroundColor: '#e0e0e0', borderRadius: height / 2, overflow: 'hidden' }}>
      <Box sx={{ height: '100%', width: `${Math.min(value, 100)}%`, backgroundColor: color, borderRadius: height / 2, transition: 'width 0.3s ease' }} />
    </Box>
    {showLabel && <Typography variant="caption">{Math.round(value)}%</Typography>}
  </Box>
);

export default ProgressBar;
