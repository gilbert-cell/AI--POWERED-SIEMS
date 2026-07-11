import React, { useEffect, useState, useRef } from 'react';
import { Box, Paper, List, ListItem, ListItemText, Typography, Chip, TextField, Select, MenuItem, InputLabel, FormControl, Stack, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { logService } from '../../services/api';
import { AUTH_TOKEN_KEY } from '../../utils/auth';
import { formatLogForDisplay } from '../../utils/helpers';

// 5-level SIEM severity — 🔵 Informational | 🟢 Low | 🟡 Medium | 🟠 High | 🔴 Critical
const SeverityChip = ({ severity }) => {
  const colorMap = {
    CRITICAL:      'error',
    HIGH:          'warning',
    MEDIUM:        'info',
    LOW:           'success',
    INFORMATIONAL: 'primary',
  };
  const label = (severity || '').toUpperCase();
  return <Chip label={label} color={colorMap[label] || 'default'} size="small" />;
}

const LiveFeedItem = ({ item }) => {
  const display = formatLogForDisplay(item);
  const title = item.dataset_type === 'host'
    ? `${display.process} - ${display.summary}`
    : `${item.event_type || 'UNKNOWN'} - ${item.message || 'N/A'}`;

  return (
    <ListItem divider alignItems="flex-start">
      <ListItemText
        primary={(
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SeverityChip severity={item.severity} />
            <strong>{item.dataset_type === 'host' ? display.host : item.event_type}</strong>
            <span>{title}</span>
          </span>
        )}
        secondary={(
          <span>
            {display.timestamp} | {display.host || item.metadata?.source_system || item.source} | score: {display.score.toFixed(2)} | {item.geoip?.network || 'local'}
            {display.details ? ` | ${display.details}` : ''}
          </span>
        )}
      />
    </ListItem>
  );
};

const LiveFeed = ({ limit = 25, pollInterval = 3000 }) => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const SOURCES = ['firewall', 'system', 'ssh', 'auth-service', 'file-system', 'ids-system', 'web-server'];
  const mounted = useRef(true);
  const esRef = useRef(null);

  const applyFilters = (list) => {
    return list.filter((it) => {
      if (severityFilter && (it.severity || '').toLowerCase() !== severityFilter.toLowerCase()) return false;
      if (sourceFilter && (it.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!(it.message || '').toLowerCase().includes(q) && !(it.event_type || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  };

  useEffect(() => {
    mounted.current = true;
    const fetchInitial = async () => {
      try {
        const res = await logService.getLiveFeed({ params: { limit } });
        if (!mounted.current) return;
        const data = res.data?.results || res.data?.logs || [];
        setItems(data);

      } catch (e) {
        // ignore
      }
    };

    fetchInitial();

    // Try Server-Sent Events (EventSource) for push updates
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
      if (token && typeof window !== 'undefined') {
        const url = `/api/logs/stream/?limit=${limit}&token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        esRef.current = es;
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (!payload || !payload.id) return;
            setItems((prev) => {
              const next = [payload, ...prev].slice(0, 200);
                  return next;
            });
          } catch (err) {
            // ignore parse errors
          }
        };
        es.onerror = () => {
          // fallback: close and rely on polling
          try { es.close(); } catch(e){}
          esRef.current = null;
        };
      }
    } catch (err) {
      // EventSource not available or connection failed
    }

    // Poll fallback to ensure initial data and in case SSE is unavailable
    const id = setInterval(async () => {
      try {
        const res = await logService.getLiveFeed({ params: { limit } });
        if (!mounted.current) return;
        const data = res.data?.results || res.data?.logs || [];
        setItems((prev) => {
          // Merge without duplicates (by id)
          const ids = new Set(prev.map(p=>p.id));
          const merged = [...data.filter(d=>!ids.has(d.id)), ...prev].slice(0,200);
          return merged;
        });
      } catch (e) {}
    }, Math.max(3000, pollInterval));

    return () => {
      mounted.current = false;
      if (esRef.current) try { esRef.current.close(); } catch{};
      clearInterval(id);
    };
  }, [limit, pollInterval]);

  const displayed = applyFilters(items);

  return (
    <Paper sx={{ mt: 3, p: 2 }} elevation={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 900 }}>Live Feed</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" placeholder="Search" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severityFilter} label="Severity" onChange={(e)=>setSeverityFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
          <MenuItem value="INFORMATIONAL">Informational</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Source</InputLabel>
            <Select value={sourceFilter} label="Source" onChange={(e)=>setSourceFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {SOURCES.map(s => <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={()=>{ setQuery(''); setSeverityFilter(''); setSourceFilter(''); }} size="small"><RefreshIcon /></IconButton>
        </Stack>
      </Box>

      <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
        {displayed.map((it) => (
          <LiveFeedItem key={it.id} item={it} />
        ))}
        {displayed.length === 0 && <ListItem><ListItemText primary="No recent events" /></ListItem>}
      </List>
    </Paper>
  );
};

export default LiveFeed;
