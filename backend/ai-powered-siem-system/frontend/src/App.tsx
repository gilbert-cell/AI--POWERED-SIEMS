import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import TuningPage from './pages/Tuning';
import LogsPage from './pages/Logs';
import Navigation from './components/Navigation';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Navigation />
        <Switch>
          <Route path="/" exact component={DashboardPage} />
          <Route path="/tuning" component={TuningPage} />
          <Route path="/logs" component={LogsPage} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;