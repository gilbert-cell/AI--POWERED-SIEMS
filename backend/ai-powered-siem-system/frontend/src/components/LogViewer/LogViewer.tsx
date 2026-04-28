import React, { useEffect, useState } from 'react';
import { fetchLogs } from '../../services/api';
import { Log } from '../../types';

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const fetchedLogs = await fetchLogs();
        setLogs(fetchedLogs);
      } catch (err) {
        setError('Failed to load logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  if (loading) {
    return <div>Loading logs...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Log Viewer</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Timestamp</th>
            <th>Message</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.message}</td>
              <td>{log.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogViewer;