import { useState, useCallback, useEffect, useRef } from 'react';
import { behaviorService } from '../../services/api';
import { toast } from 'react-toastify';
import { LIVE_POLL_INTERVAL } from '../../config';

export const useBehavior = () => {
  const [analysis, setAnalysis] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('live');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const liveRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [analysisRes, anomaliesRes] = await Promise.all([
        behaviorService.getAnalysis({ time_range: timeRange }),
        behaviorService.getAnomalies({ time_range: timeRange }),
      ]);
      setAnalysis(analysisRes.data);
      setAnomalies(anomaliesRes.data);
      setLastUpdated(new Date());
    } catch { toast.error('Failed to fetch behavior analysis data'); }
    finally { setLoading(false); }
  }, [timeRange]);

  const handleTimeRange = (range) => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setIsLive(range === 'live');
    setTimeRange(range === 'live' ? '30min' : range);
    if (range === 'live') liveRef.current = setInterval(fetchData, LIVE_POLL_INTERVAL);
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => () => { if (liveRef.current) clearInterval(liveRef.current); }, []);

  return { analysis, anomalies, loading, timeRange, isLive, lastUpdated, fetchData, handleTimeRange };
};
