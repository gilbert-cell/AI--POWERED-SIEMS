import { useState, useCallback, useEffect, useRef } from 'react';
import { logService } from '../../services/api';
import { toast } from 'react-toastify';
import { DEFAULT_PAGE_SIZE } from '../../config';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;
const LIVE_POLL_MS = 5000;

export const useLogs = () => {
  const [logs, setLogs] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [fpCount, setFpCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const liveTimerRef = useRef(null);
  const isLive = timeRange === 'live';

  const fetchFpCount = useCallback(async () => {
    try {
      const res = await logService.getLogs({ page: 1, page_size: 1, status: 'false_positive' });
      setFpCount(res.data.count ?? 0);
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await logService.getLogs({
        page, page_size: PAGE_SIZE,
        duplicates: duplicateFilter,
        source: sourceFilter,
        severity: severityFilter,
        status: statusFilter || undefined,
        range: isLive ? undefined : timeRange,
      });
      const data = res.data.results || res.data;
      setLogs(data);
      setTotalCount(res.data.count || data.length || 0);
    } catch { toast.error('Failed to fetch logs'); }
    finally { setLoading(false); }
  }, [page, duplicateFilter, sourceFilter, severityFilter, statusFilter, timeRange, isLive]);

  const fetchLive = useCallback(async () => {
    try {
      const res = await logService.getLiveFeed({ limit: PAGE_SIZE, source: sourceFilter, severity: severityFilter, status: statusFilter || undefined });
      const data = res.data.results || res.data;
      setLogs(data);
      setTotalCount(res.data.count || data.length || 0);
    } catch {}
  }, [sourceFilter, severityFilter, statusFilter]);

  const fetchDuplicates = useCallback(async () => {
    try {
      const res = await logService.getDuplicateLogs();
      setDuplicates(res.data);
    } catch {}
  }, []);

  // Start / stop live polling
  useEffect(() => {
    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    if (isLive) {
      fetchLive();
      liveTimerRef.current = setInterval(fetchLive, LIVE_POLL_MS);
    } else {
      fetchLogs();
    }
    return () => clearInterval(liveTimerRef.current);
  }, [isLive, fetchLive, fetchLogs]);

  useEffect(() => { fetchDuplicates(); fetchFpCount(); }, [fetchDuplicates, fetchFpCount]);

  // Reset to page 1 when filters / time range change
  useEffect(() => { setPage(1); }, [timeRange, sourceFilter, severityFilter, statusFilter, duplicateFilter]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { fetchLogs(); return; }
    try {
      setLoading(true);
      const res = await logService.searchLogs(searchQuery, { page, page_size: PAGE_SIZE, source: sourceFilter, severity: severityFilter });
      const data = res.data.results || res.data;
      setLogs(data);
      setTotalCount(res.data.count || data.length || 0);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const handleRemoveDuplicate = async (ids) => {
    try {
      await logService.removeDuplicate(ids);
      toast.success('Duplicates removed successfully');
      fetchLogs(); fetchDuplicates();
    } catch { toast.error('Failed to remove duplicates'); }
  };

  return {
    logs, duplicates, loading, page, setPage, totalCount, fpCount, PAGE_SIZE,
    searchQuery, setSearchQuery, duplicateFilter, setDuplicateFilter,
    sourceFilter, setSourceFilter, severityFilter, setSeverityFilter,
    statusFilter, setStatusFilter,
    timeRange, setTimeRange, isLive,
    handleSearch, handleRemoveDuplicate,
  };
};
