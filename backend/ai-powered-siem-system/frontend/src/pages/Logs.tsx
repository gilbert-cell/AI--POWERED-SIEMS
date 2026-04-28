import React, { useEffect, useState } from 'react';
import LogViewer from '../components/LogViewer/LogViewer';
import { fetchLogs } from '../services/api';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const getLogs = async () => {
      try {
        const response = await fetchLogs();
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    getLogs();
  }, []);

  return (
    <div>
      <h1>Logs</h1>
      <LogViewer logs={logs} />
    </div>
  );
};

export default Logs;