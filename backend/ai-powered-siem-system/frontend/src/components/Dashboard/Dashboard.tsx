import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardData } from '../../services/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDashboardData();
        setData(result);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const fp = data?.false_positives ?? data?.falsePositives ?? data?.stats?.false_positives ?? null;

  return (
    <div style={{ padding: '24px' }}>
      <h1>Dashboard</h1>

      {fp !== null && (
        <div style={{
          display: 'inline-block', background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: '8px', padding: '16px 24px', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>False Positives</div>
          <Link
            to="/logs?status=false_positive"
            style={{ fontSize: '32px', fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}
            title="Click to view false positive alerts"
          >
            {fp}
          </Link>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            <Link to="/logs?status=false_positive" style={{ color: '#dc2626' }}>View all →</Link>
          </div>
        </div>
      )}

      <div>
        <h2>System Status</h2>
        <p>{data.status}</p>
      </div>
      <div>
        <h2>Analytics Overview</h2>
        <p>{data.analytics}</p>
      </div>
    </div>
  );
};

export default Dashboard;