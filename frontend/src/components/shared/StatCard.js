import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const StatCard = ({ label, value, unit = '', color, bg }) => (
  <Card sx={{ backgroundColor: bg, height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom variant="body2">{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{value}{unit}</Typography>
    </CardContent>
  </Card>
);

export default StatCard;
