import React from 'react';
import { Grid, Tooltip, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StatCard from '../shared/StatCard';

const CARDS = [
  { label: 'Total Logs',      key: 'total_logs',      bg: '#e8eaf6', color: '#1a237e', tooltip: 'Total log events ingested from all sources. Click to view all logs.',                link: '/logs' },
  { label: 'Total Alerts',    key: 'total_alerts',    bg: '#e3f2fd', color: '#1565c0', tooltip: 'Total anomalies detected by the AI engine. Click to view confirmed alerts.',        link: '/logs?status=confirmed' },
  { label: 'Detection Rate',  key: 'detection_rate',  bg: '#e8f5e9', color: '#388e3c', unit: '%', tooltip: 'Detection Rate = TP / (TP + FP) × 100. Capped at 99.5%.' },
  { label: 'False Positives', key: 'false_positives', bg: '#f3e5f5', color: '#7b1fa2', tooltip: 'Alerts flagged by AI but confirmed as non-threats. Click to view them.',            link: '/logs?status=false_positive' },
];

const StatsCards = ({ stats }) => {
  const navigate = useNavigate();
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {CARDS.map(({ label, key, bg, color, unit = '', tooltip, link }) => (
        <Grid item xs={12} sm={6} md={12/5} key={key}>
          <Box
            sx={{ position: 'relative', cursor: link ? 'pointer' : 'default' }}
            onClick={link ? () => navigate(link) : undefined}
          >
            <StatCard label={label} value={stats?.[key] ?? 0} unit={unit} color={color} bg={bg}
              sx={link ? { '&:hover': { boxShadow: `0 0 0 2px ${color}`, transform: 'translateY(-1px)', transition: 'all .15s' } } : {}}
            />
            <Tooltip title={tooltip} placement="top" arrow>
              <InfoOutlinedIcon sx={{ position: 'absolute', top: 10, right: 10, fontSize: 16, color: '#94a3b8', cursor: 'pointer', '&:hover': { color: '#1d4ed8' } }} />
            </Tooltip>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;
