import { useState, useCallback, useEffect, useRef } from 'react';
import { analyticsService } from '../../services/api';
import { toast } from 'react-toastify';
import { LIVE_POLL_INTERVAL, TIME_RANGE_OPTIONS, SOURCE_OPTIONS } from '../../config';

export { TIME_RANGE_OPTIONS as DATE_RANGE_OPTIONS, SOURCE_OPTIONS };

const normalizePercentage = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

export const clampDetectionAccuracy = (v) => {
  const n = normalizePercentage(v);
  return n === null ? 0 : Math.min(100, Math.max(0, n));
};

export const formatDetectionAccuracy = (v) => {
  const c = clampDetectionAccuracy(v);
  return Number.isInteger(c) ? String(c) : c.toFixed(1);
};

export const useAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [severityDist, setSeverityDist] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [sourceMetrics, setSourceMetrics] = useState({});
  const [hourlyTrends, setHourlyTrends] = useState([]);
  const [responseMetrics, setResponseMetrics] = useState(null);
  const [detectionAccuracy, setDetectionAccuracy] = useState([]);
  const [topHosts, setTopHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('live');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const liveRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { range: dateRange, ...(sourceFilter !== 'all' && { source: sourceFilter }) };
      const [summaryRes, severityRes, typesRes, sourceRes, hourlyRes, responseRes, accuracyRes, hostsRes] = await Promise.all([
        analyticsService.getSummary(params),
        analyticsService.getSeverityDistribution(params),
        analyticsService.getEventTypes(10, params),
        analyticsService.getSourceMetrics(params),
        analyticsService.getHourlyTrends(params),
        analyticsService.getResponseMetrics(params),
        analyticsService.getDetectionAccuracy(params),
        analyticsService.getTopHosts(10, params),
      ]);
      setSummary(summaryRes.data);
      setSeverityDist(severityRes.data.severity_distribution || []);
      setEventTypes(typesRes.data.event_types || []);
      setSourceMetrics(sourceRes.data.source_metrics || {});
      setHourlyTrends(hourlyRes.data.hourly_trends || []);
      setResponseMetrics(responseRes.data);
      setDetectionAccuracy(accuracyRes.data.accuracy_by_severity || []);
      setTopHosts(hostsRes.data.top_hosts || []);
      setLastUpdated(new Date());
    } catch (error) {
      const responseError = error?.response?.data?.error;
      if (error?.response?.status === 401) {
        setError('Session expired or unauthorized. Please log in again.');
      } else if (responseError) {
        setError(responseError);
      } else {
        setError('Failed to load analytics data. Ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, sourceFilter]);

  const handleTimeRange = (range) => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setIsLive(range === 'live');
    setDateRange(range === 'live' ? '30min' : range);
    if (range === 'live') liveRef.current = setInterval(fetchData, LIVE_POLL_INTERVAL);
  };

  useEffect(() => () => { if (liveRef.current) clearInterval(liveRef.current); }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const derivedAccuracy = (() => {
    const vals = detectionAccuracy.map((d) => normalizePercentage(d.accuracy)).filter((v) => v !== null);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : normalizePercentage(summary?.detection_accuracy);
  })();

  return {
    summary, severityDist, eventTypes, sourceMetrics, hourlyTrends,
    responseMetrics, detectionAccuracy, topHosts,
    loading, error, dateRange, sourceFilter, setSourceFilter,
    isLive, lastUpdated, fetchData, handleTimeRange,
    displayedDetectionAccuracy: formatDetectionAccuracy(derivedAccuracy),
    radarData: detectionAccuracy.map((d) => ({ subject: d.severity, accuracy: d.accuracy, falsePositive: d.false_positive_rate })),
  };
};
