# SIEM Frontend Development Guide

## Overview

This document provides comprehensive guidance for developing and maintaining the AI SIEM system frontend.

## Architecture

### Component Hierarchy

```
App (Router & Layout)
├── Navbar (Top Navigation)
├── Sidebar (Navigation Menu)
└── Routes
    ├── Dashboard
    ├── LogsPage
    ├── BehaviorAnalysisPage
    ├── RulesPage
    ├── AIDecisionsPage
    └── AnalyticsPage
```

### State Management

- **Local State**: Each page manages its own state using React hooks
- **API Calls**: Centralized in `services/api.js`
- **Global Notifications**: React Toastify for user feedback

## Pages & Features

### 1. Dashboard (`pages/Dashboard.js`)

**Purpose**: Central hub for SIEM monitoring

**Components**:
- Stats Cards (4 key metrics)
- Alert Trends Chart (30-day line chart)
- Top Alert Types (pie chart)
- System Health Status

**API Endpoints Used**:
- `/api/dashboard/stats/`
- `/api/dashboard/trends/`
- `/api/dashboard/top-alerts/`
- `/api/dashboard/health/`

**Key Functions**:
- `fetchDashboardData()` - Load all dashboard data in parallel

### 2. Logs Management (`pages/LogsPage.js`)

**Purpose**: View, search, and manage system logs

**Features**:
- Paginated log table
- Search functionality
- Duplicate detection and removal
- Log detail viewer (modal)
- Severity filtering with color coding

**API Endpoints Used**:
- `/api/logs/` - Get logs with pagination
- `/api/logs/search/` - Search logs
- `/api/logs/duplicates/` - Get duplicate logs
- `/api/logs/remove-duplicate/` - Remove duplicates

**Key Functions**:
- `fetchLogs()` - Load logs for current page
- `fetchDuplicates()` - Check for duplicate logs
- `handleSearch()` - Execute log search
- `handleRemoveDuplicate()` - Remove duplicate entries

### 3. Behavior Analysis (`pages/BehaviorAnalysisPage.js`)

**Purpose**: Detect and analyze behavioral anomalies

**Features**:
- Time range selector (24h, 7d, 30d, 90d)
- Anomaly statistics cards
- Behavioral pattern chart
- Anomaly type distribution
- Anomalies table with risk levels
- Confidence scoring visualization

**API Endpoints Used**:
- `/api/behavior/analysis/` - Get behavioral analysis
- `/api/behavior/anomalies/` - Get detected anomalies

**Key Functions**:
- `fetchBehaviorData()` - Load behavior analysis and anomalies
- `handleViewDetails()` - Open anomaly details modal
- `getRiskColor()` - Map risk level to color

### 4. Rules & Thresholds (`pages/RulesPage.js`)

**Purpose**: Manage detection rules and alert thresholds

**Features**:
- Tabbed interface (Rules/Thresholds)
- Create/Edit/Delete rules
- Rule types: Pattern, Threshold, ML, Behavioral
- Severity levels: Low, Medium, High, Critical
- Enable/disable rules
- Threshold value adjustment with sliders
- Alert trigger configuration (exceed, below, equals)

**API Endpoints Used**:
- `/api/rules/` - CRUD operations for rules
- `/api/thresholds/` - CRUD operations for thresholds

**Key Functions**:
- `fetchRules()` / `fetchThresholds()` - Load configuration
- `handleSaveRule()` - Create or update rule
- `handleSaveThreshold()` - Update threshold
- `handleDeleteRule()` - Remove rule

### 5. AI Decisions (`pages/AIDecisionsPage.js`)

**Purpose**: Review and manage AI model decisions

**Features**:
- Three-tab interface:
  - **AI Decisions**: Review pending decisions, accept/override
  - **Models & Tuning**: View models and adjust weights
  - **Accuracy Metrics**: View model performance
- Decision status filtering
- Confidence scoring with visual bars
- Override reason tracking
- Model weight sliders
- Confusion matrix visualization
- Accuracy trends chart

**API Endpoints Used**:
- `/api/ai/decisions/` - Get AI decisions
- `/api/ai/decisions/{id}/override/` - Override decision
- `/api/ai/models/` - Get AI models
- `/api/ai/models/{id}/weights/` - Update model weights
- `/api/ai/accuracy/` - Get accuracy metrics

**Key Functions**:
- `fetchDecisions()` - Load pending decisions
- `fetchModels()` - Load AI models
- `fetchAccuracy()` - Load accuracy metrics
- `handleOverrideDecision()` - Submit decision override
- `handleEditModel()` - Open model tuning dialog
- `handleSaveWeights()` - Update model weights

## API Service Layer (`services/api.js`)

The API service provides centralized access to all backend endpoints.

### Service Structure

```javascript
const apiService = {
  logService: { getLogs(), getDuplicateLogs(), ... }
  dashboardService: { getStats(), getAlertTrends(), ... }
  behaviorService: { getAnalysis(), getAnomalies(), ... }
  rulesService: { getRules(), createRule(), updateRule(), ... }
  thresholdsService: { getThresholds(), updateThreshold(), ... }
  aiService: { getModels(), overrideDecision(), ... }
  alertsService: { getAlerts(), acknowledgeAlert(), ... }
}
```

### Request Interceptor

Automatically adds authorization token to requests:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Layout Components

### Navbar (`components/Layout/Navbar.js`)

- Company branding
- Notification bell icon
- Settings icon
- User avatar dropdown
- Logout functionality

### Sidebar (`components/Layout/Sidebar.js`)

- 6 main menu items with icons
- Active page highlighting
- Mobile-responsive drawer
- Responsive grid layout

## Styling & Theme

### Color Scheme

- **Primary**: `#1a237e` (Deep Blue)
- **Success**: `#388e3c` (Green)
- **Warning**: `#f57c00` (Orange)
- **Error**: `#d32f2f` (Red)
- **Info**: `#42a5f5` (Light Blue)

### Typography

- Headings: Bold, primary color
- Body text: #333
- Secondary text: #666
- Disabled text: #999

### Material-UI Customization

Components use MUI's `sx` prop for inline styling, ensuring consistency across the application.

## Common Patterns

### Loading State

```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  try {
    setLoading(true);
    const response = await apiService.getData();
    setData(response.data);
  } catch (error) {
    toast.error('Failed to fetch data');
  } finally {
    setLoading(false);
  }
};
```

### Error Handling

```javascript
try {
  // API call
} catch (error) {
  console.error('Error details:', error);
  toast.error(error.response?.data?.message || 'An error occurred');
}
```

### Dialog Management

```javascript
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const handleOpen = (item) => {
  setSelectedItem(item);
  setDialogOpen(true);
};

const handleClose = () => {
  setDialogOpen(false);
  setSelectedItem(null);
};
```

## Utility Functions (`utils/helpers.js`)

- `formatDate()` - Format date strings
- `formatDateTime()` - Format datetime strings
- `calculateDuration()` - Calculate time between dates
- `getSeverityColor()` - Get color for severity levels
- `getRiskColor()` - Get color for risk levels
- `formatNumber()` - Format large numbers (K, M)
- `truncateText()` - Truncate long text with ellipsis
- `validateEmail()` - Validate email addresses

## Adding a New Page

### Step 1: Create Page Component

```javascript
// pages/NewPage.js
import React, { useState, useEffect } from 'react';
import { Container, Typography } from '@mui/material';

const NewPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // API call
    setLoading(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        New Page
      </Typography>
      {/* Content */}
    </Container>
  );
};

export default NewPage;
```

### Step 2: Add Route

```javascript
// App.js
<Route path="/new-page" element={<NewPage />} />
```

### Step 3: Add Menu Item

```javascript
// components/Layout/Sidebar.js
const menuItems = [
  // ... existing items
  { label: 'New Page', icon: IconComponent, path: '/new-page' },
];
```

## Testing

### Unit Tests

```bash
npm test
```

### Coverage Report

```bash
npm test -- --coverage
```

## Build & Deployment

### Development

```bash
npm start
```

### Production Build

```bash
npm run build
```

### Environment Variables

Create `.env` file:

```
REACT_APP_API_URL=http://api.example.com/api
REACT_APP_DEBUG_MODE=false
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- Code splitting by route
- Lazy loading of components
- Memoization of expensive computations
- Image optimization
- Minimized bundle size

## Security Considerations

- XSS protection via React's automatic escaping
- CSRF tokens via API service
- Secure storage of auth tokens
- HTTPS enforcement
- Input validation and sanitization

## Troubleshooting

### Issue: API calls failing

**Solution**:
1. Check backend is running
2. Verify API URL in `.env`
3. Check CORS configuration
4. Review browser console for errors

### Issue: Components not rendering

**Solution**:
1. Check React Router setup
2. Verify component exports
3. Check for console errors
4. Verify MUI theme provider

### Issue: Styling issues

**Solution**:
1. Clear browser cache
2. Rebuild project
3. Check MUI version compatibility
4. Verify CSS imports

## Contributing Guidelines

1. Follow existing code style
2. Use descriptive variable names
3. Add comments for complex logic
4. Test changes thoroughly
5. Keep components focused and reusable
6. Update documentation

## Resources

- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [React Router Documentation](https://reactrouter.com)
- [Recharts Documentation](https://recharts.org)
