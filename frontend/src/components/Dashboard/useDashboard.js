import { useState, useEffect, useRef } from 'react';
import { dashboardService } from '../../services/api';
import { LIVE_POLL_INTERVAL } from '../../config';

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topAlerts, setTopAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [sourceStats, setSourceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRange, setTimeRange] = useState('live');
  const liveRef = useRef(null);

  const fetchData = async (range) => {
    const currentRange = range ?? timeRange;
    try {
      setLoading(true);
      const [statsRes, sourceRes, trendsRes, alertsRes, healthRes] = await Promise.all([
        dashboardService.getStats(currentRange),
        dashboardService.getSourceStats(currentRange),
        dashboardService.getAlertTrends(30),
        dashboardService.getTopAlerts(10, currentRange),
        dashboardService.getSystemHealth(),
      ]);
      setStats(statsRes.data);
      setSourceStats(sourceRes.data);
      setTrends(trendsRes.data?.trends ?? []);
      setTopAlerts(alertsRes.data?.top_alerts ?? []);
      setHealth(healthRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRange = (range) => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setTimeRange(range);
    setIsLive(range === 'live');
    fetchData(range);
    if (range === 'live') liveRef.current = setInterval(() => fetchData('live'), LIVE_POLL_INTERVAL);
  };

  useEffect(() => {
    fetchData();
    liveRef.current = setInterval(fetchData, LIVE_POLL_INTERVAL);
    return () => { if (liveRef.current) clearInterval(liveRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { stats, trends, topAlerts, health, sourceStats, loading, error, isLive, lastUpdated, timeRange, fetchData, handleTimeRange };
};
