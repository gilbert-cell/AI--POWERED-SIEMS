// src/hooks/useApi.js — reusable data-fetching hook
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useApi — fetch data from any service function with loading, error, and auto-refresh.
 *
 * @param {Function} fetchFn      async function that returns axios response { data }
 * @param {Array}    deps         re-fetch when these change
 * @param {Object}   options
 *   pollInterval  ms between auto-refreshes (0 = disabled)
 *   defaultData   initial value before first fetch
 *   immediate     fetch on mount (default true)
 *
 * @returns { data, loading, error, refetch }
 */
const useApi = (fetchFn, deps = [], { pollInterval = 0, defaultData = null, immediate = true } = {}) => {
  const [data,    setData]    = useState(defaultData);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);
  const timerRef   = useRef(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchFn();
      if (mountedRef.current) setData(res.data ?? res);
    } catch (err) {
      if (mountedRef.current)
        setError(err?.response?.data?.error || err.message || 'Request failed');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();
    if (pollInterval > 0) timerRef.current = setInterval(execute, pollInterval);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [execute, immediate, pollInterval]);

  return { data, loading, error, refetch: execute };
};

export default useApi;
