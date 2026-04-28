import React, { useEffect, useState } from 'react';
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

  return (
    <div>
      <h1>Dashboard</h1>
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