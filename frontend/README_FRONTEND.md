# AI SIEM System Frontend

A comprehensive React-based frontend for the AI-powered Security Information and Event Management (SIEM) system designed to reduce false positives through advanced log deduplication, behavioral analysis, and AI-assisted decision making.

## Features

### 1. **Dashboard** 📊
- Real-time alert statistics
- Detection rate metrics
- Alert trends visualization (30-day history)
- Top alert types distribution
- System health status monitoring

### 2. **Alerts & Logs Management** 📋
- View and manage all system logs
- Automatic duplicate log detection
- One-click duplicate removal
- Advanced search and filtering
- Log severity classification
- Detailed log inspection

### 3. **Behavior Analysis** 🔍
- Detect behavioral anomalies
- User and host behavior profiling
- Baseline comparison analysis
- Anomaly risk assessment
- Time-series behavioral patterns
- Confidence scoring for detected anomalies

### 4. **Rules & Thresholds Tuning** ⚙️
- Create and manage detection rules
- Configure alert thresholds
- Rule severity levels (Low, Medium, High, Critical)
- Multiple rule types (Pattern, Threshold, ML, Behavioral)
- Enable/disable rules dynamically
- Threshold adjustment with sliders

### 5. **AI Decisions Interface** 🤖
- Review AI model decisions
- Override decisions with human input
- Model weight tuning
- Accuracy metrics tracking
- Confusion matrix visualization
- Decision confidence scoring
- Model performance trending

### 6. **Analytics & Reports** 📈
- (Coming soon) Advanced reporting capabilities
- Custom dashboard creation
- Export functionality

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Navbar.js        # Top navigation bar
│   │       └── Sidebar.js       # Side navigation menu
│   ├── pages/
│   │   ├── Dashboard.js         # Main dashboard
│   │   ├── LogsPage.js          # Logs & alerts management
│   │   ├── BehaviorAnalysisPage.js  # Behavior analysis
│   │   ├── RulesPage.js         # Rules & thresholds
│   │   ├── AIDecisionsPage.js   # AI decisions interface
│   │   └── AnalyticsPage.js     # Analytics & reports
│   ├── services/
│   │   └── api.js               # API client & endpoints
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   ├── App.js                   # Main app component with routing
│   └── index.js                 # Entry point
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API Endpoint

Create a `.env` file in the `frontend` directory:

```bash
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Technologies Used

- **React 19**: UI framework
- **Material-UI (MUI)**: Component library
- **React Router**: Navigation
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **React Toastify**: Notifications
- **Date-fns**: Date utilities

## API Integration

The frontend communicates with the Django backend via RESTful APIs. Key endpoints include:

### Logs Service
- `GET /api/logs/` - Fetch all logs
- `GET /api/logs/{id}/` - Get log details
- `GET /api/logs/duplicates/` - Get duplicate logs
- `POST /api/logs/remove-duplicate/` - Remove duplicates
- `GET /api/logs/search/` - Search logs

### Dashboard Service
- `GET /api/dashboard/stats/` - Dashboard statistics
- `GET /api/dashboard/trends/` - Alert trends
- `GET /api/dashboard/top-alerts/` - Top alerts
- `GET /api/dashboard/health/` - System health

### Behavior Analysis
- `GET /api/behavior/analysis/` - Behavior analysis data
- `GET /api/behavior/anomalies/` - Detected anomalies
- `GET /api/behavior/user/{userId}/` - User behavior
- `GET /api/behavior/host/{hostId}/` - Host behavior

### Rules & Thresholds
- `GET /api/rules/` - Fetch all rules
- `POST /api/rules/` - Create rule
- `PUT /api/rules/{id}/` - Update rule
- `DELETE /api/rules/{id}/` - Delete rule
- `GET /api/thresholds/` - Fetch thresholds
- `PUT /api/thresholds/{id}/` - Update threshold

### AI Decisions
- `GET /api/ai/decisions/` - Fetch AI decisions
- `POST /api/ai/decisions/{id}/override/` - Override decision
- `GET /api/ai/models/` - Fetch AI models
- `PUT /api/ai/models/{id}/weights/` - Update model weights
- `GET /api/ai/accuracy/` - Get accuracy metrics

## Key Features Explained

### 1. Duplicate Log Removal
The system automatically detects and highlights duplicate logs, allowing administrators to remove them with a single click, reducing noise in the alert stream.

### 2. Behavioral Analysis
Tracks user and host behavior patterns, comparing actual activity against established baselines to identify suspicious deviations with confidence scoring.

### 3. Admin Tuning Interface
- **Rules Management**: Create pattern-based, threshold-based, ML, and behavioral rules
- **Threshold Adjustment**: Fine-tune alert thresholds with visual sliders
- **AI Model Weights**: Adjust machine learning model parameters to improve detection accuracy

### 4. AI Decision Override
Administrators can review and override AI model decisions, with reasons tracked for model retraining and improvement.

### 5. Real-time Dashboard
Displays key metrics including total alerts, critical alerts, false positives, and detection rates with visual trends.

## Responsive Design

The application is fully responsive and works on:
- Desktop computers (1920x1080 and above)
- Tablets (768x1024)
- Mobile devices (320x568 and above)

## User Roles

### Administrator
- Full access to all features
- Can create, edit, and delete rules
- Can adjust thresholds and model weights
- Can override AI decisions
- View all analytics and reports

## Future Enhancements

- [ ] Custom report generation
- [ ] Advanced analytics dashboard
- [ ] Real-time alert notifications (WebSocket)
- [ ] Integration with external SIEM systems
- [ ] Custom alert workflow automation
- [ ] Role-based access control (RBAC)
- [ ] Audit logging for all admin actions
- [ ] Dark mode theme

## Troubleshooting

### API Connection Issues
- Verify the backend server is running
- Check `REACT_APP_API_URL` environment variable
- Ensure CORS is properly configured on the backend

### Missing Dependencies
```bash
npm install
```

### Port Already in Use
```bash
PORT=3001 npm start
```

## Support & Documentation

For backend API documentation, see the Django project README.

## License

Proprietary - AI SIEM System

## Contributing

Please follow the existing code style and submit pull requests for review.
