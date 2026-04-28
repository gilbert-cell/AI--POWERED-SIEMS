import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/api', () => ({
  dashboardService: {
    getStats: jest.fn().mockResolvedValue({
      data: {
        total_alerts: 10,
        critical_alerts: 2,
        false_positives: 1,
        detection_rate: 90,
      },
    }),
    getAlertTrends: jest.fn().mockResolvedValue({
      data: [{ date: '2026-04-23', alerts: 10, resolved: 8 }],
    }),
    getTopAlerts: jest.fn().mockResolvedValue({
      data: [{ alert_type: 'Malware', count: 5 }],
    }),
    getSystemHealth: jest.fn().mockResolvedValue({
      data: {
        api_status: 'OK',
        database_status: 'OK',
        ai_models_status: 'OK',
        cpu_usage: 20,
      },
    }),
  },
}));

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

test('renders app shell with real routes', async () => {
  render(<App />);
  expect(screen.getByText(/AI SIEM System/i)).toBeInTheDocument();
  expect(await screen.findByText('Dashboard')).toBeInTheDocument();
});
