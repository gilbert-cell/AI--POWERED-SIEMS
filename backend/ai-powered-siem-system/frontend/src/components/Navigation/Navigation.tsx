import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/tuning">Tuning Interface</Link>
        </li>
        <li>
          <Link to="/logs">Log Viewer</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;