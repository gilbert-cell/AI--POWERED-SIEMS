import React from 'react';
import { Box, Card, CardContent, TextField, Button, FormControl, InputLabel, Select, MenuItem, Typography, Chip } from '@mui/material';
import { FilterList as FilterListIcon, Search as SearchIcon, ContentCopy as ContentCopyIcon, FiberManualRecord as LiveDotIcon } from '@mui/icons-material';

const SOURCES = ['firewall', 'system', 'ssh', 'auth-service', 'file-system', 'ids-system', 'web-server'];

const TIME_RANGES = [
  { value: 'live',  label: 'Live' },
  { value: '30min', label: 'Last 30 min' },
  { value: '1h',    label: 'Last 1 hour' },
  { value: '24h',   label: 'Last 24 hours' },
  { value: '7d',    label: 'Last 7 days' },
  { value: '30d',   label: 'Last 30 days' },
];

const LogFilters = ({ searchQuery, setSearchQuery, severityFilter, setSeverityFilter, sourceFilter, setSourceFilter, statusFilter, setStatusFilter, duplicateFilter, setDuplicateFilter, timeRange, setTimeRange, isLive, onSearch }) => (
  <Card sx={{ mb: 3, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06) !important' }}>
    <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterListIcon sx={{ color: '#2563eb', fontSize: 20 }} />
        <Typography sx={{ fontWeight: 900, color: '#0f172a' }}>Filter logs</Typography>
        {isLive && (
          <Chip
            icon={<LiveDotIcon sx={{ fontSize: '12px !important', color: '#16a34a !important', animation: 'pulse 1.5s infinite' }} />}
            label="LIVE"
            size="small"
            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 900, fontSize: 11,
              '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }}
          />
        )}
        {statusFilter === 'false_positive' && (
          <Chip label="Showing False Positives" size="small" sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 800, fontSize: 11 }} />
        )}
        {statusFilter === 'confirmed' && (
          <Chip label="Showing True Positives" size="small" sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: 11 }} />
        )}
      </Box>
      <Box component="form" onSubmit={onSearch} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(200px, 1fr) 140px 150px 150px 160px auto auto' }, gap: 1.5, alignItems: 'center' }}>
        <TextField fullWidth placeholder="Search logs by source, event type, or message..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined" size="small"
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#94a3b8', fontSize: 18 }} /> }}
        />

        <FormControl size="small">
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
            {TIME_RANGES.map(({ value, label }) => (
              <MenuItem key={value} value={value}>
                {value === 'live' ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><LiveDotIcon sx={{ fontSize: 10, color: '#16a34a' }} />{label}</Box> : label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Severity</InputLabel>
          <Select value={severityFilter} label="Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
            <MenuItem value=""><em>All</em></MenuItem>
            {['critical', 'high', 'medium', 'low'].map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Source</InputLabel>
          <Select value={sourceFilter} label="Source" onChange={(e) => setSourceFilter(e.target.value)}>
            <MenuItem value=""><em>All Sources</em></MenuItem>
            {SOURCES.map((s) => <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="confirmed">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a' }} />True Positive
              </Box>
            </MenuItem>
            <MenuItem value="false_positive">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626' }} />False Positive
              </Box>
            </MenuItem>
            <MenuItem value="new">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563eb' }} />Pending
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" type="submit" disabled={isLive} startIcon={<SearchIcon />} sx={{ bgcolor: '#1d4ed8', fontWeight: 800, px: 2.5, '&:hover': { bgcolor: '#1e40af' } }}>Search</Button>
        <Button variant={duplicateFilter ? 'contained' : 'outlined'} onClick={() => setDuplicateFilter(!duplicateFilter)}
          startIcon={<ContentCopyIcon />}
          sx={{ backgroundColor: duplicateFilter ? '#dc2626' : 'transparent', color: duplicateFilter ? 'white' : '#b91c1c', borderColor: '#fecaca', fontWeight: 800, '&:hover': { borderColor: '#dc2626', bgcolor: duplicateFilter ? '#b91c1c' : '#fef2f2' } }}>
          Duplicates
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default LogFilters;
