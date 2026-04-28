import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/Dashboard', () => () => <h1>Dashboard</h1>);
jest.mock('./pages/LogsPage', () => () => <div>Logs Page</div>);
jest.mock('./pages/BehaviorAnalysisPage', () => () => <div>Behavior Analysis Page</div>);
jest.mock('./pages/RulesPage', () => () => <div>Rules Page</div>);
jest.mock('./pages/AIDecisionsPage', () => () => <div>AI Decisions Page</div>);
jest.mock('./pages/AnalyticsPage', () => () => <div>Analytics Page</div>);

test('renders the AI SIEM dashboard shell', async () => {
  render(<App />);

  expect(screen.getByText(/AI SIEM System/i)).toBeInTheDocument();
  expect((await screen.findAllByText('Dashboard')).length).toBeGreaterThan(0);
  expect(screen.getByText(/Alerts & Logs/i)).toBeInTheDocument();
});
