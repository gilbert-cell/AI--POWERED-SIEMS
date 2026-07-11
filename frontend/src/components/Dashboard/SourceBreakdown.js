import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import DnsIcon from '@mui/icons-material/Dns';
import LockIcon from '@mui/icons-material/Lock';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import FolderIcon from '@mui/icons-material/Folder';
import GppBadIcon from '@mui/icons-material/GppBad';
import LanguageIcon from '@mui/icons-material/Language';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const SOURCES = [
  { key: 'firewall',     label: 'Firewall',     icon: <SecurityIcon />,        color: '#d32f2f', bg: '#ffebee' },
  { key: 'system',      label: 'System',       icon: <DnsIcon />,             color: '#1565c0', bg: '#e3f2fd' },
  { key: 'ssh',         label: 'SSH',          icon: <LockIcon />,            color: '#6a1b9a', bg: '#f3e5f5' },
  { key: 'auth-service',label: 'Auth-Service', icon: <ManageAccountsIcon />,  color: '#e65100', bg: '#fff3e0' },
  { key: 'file-system', label: 'File System',  icon: <FolderIcon />,          color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'ids-system',  label: 'IDS-System',   icon: <GppBadIcon />,          color: '#b71c1c', bg: '#fce4ec' },
  { key: 'web-server',  label: 'Web-Server',   icon: <LanguageIcon />,        color: '#00695c', bg: '#e0f2f1' },
];

const SourceBreakdown = ({ sourceStats }) => {
  const navigate = useNavigate();
  const counts   = sourceStats?.source_counts      ?? {};
  const fpCounts = sourceStats?.false_positive_counts ?? {};

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 900, color: '#1a237e', mb: 2 }}>Log Sources</Typography>
      <Grid container spacing={2}>
        {SOURCES.filter(({ key }) => (counts[key] ?? 0) > 0).map(({ key, label, icon, color, bg }) => {
          const count = counts[key] ?? 0;
          const fp    = fpCounts[key] ?? 0;
          return (
            <Grid item xs={12} sm={6} md={3} lg={12/7} key={key}>
              <Card
                sx={{ backgroundColor: bg, cursor: 'pointer', border: `1px solid ${color}22`,
                  transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}
                onClick={() => navigate(`/logs?source=${key}`)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {/* Header: icon + label + active badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color, fontSize: 20, display: 'flex' }}>{icon}</Box>
                      <Typography sx={{ fontWeight: 800, color, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 10, color: '#16a34a',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } }
                      }} />
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>ACTIVE</Typography>
                    </Box>
                  </Box>

                  {/* Count */}
                  <Typography variant="h4" sx={{ fontWeight: 900, color }}>
                    {count.toLocaleString()}
                  </Typography>

                  {/* False positives */}
                  <Typography variant="body2" sx={{ color: '#555', mt: 0.5, fontSize: 12 }}>
                    False positives: {fp}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default SourceBreakdown;
