# 🚀 AI SIEM Frontend - Getting Started & Backend Integration

## Phase 1: Verify Installation & Run Frontend

### Step 1: Install Dependencies

```bash
cd /home/grace/AI\ POWERED\ SIEM\ SYSTEM/frontend
npm install
```

**Expected Output:**
```
added 200+ packages in 2m
```

### Step 2: Verify Installation

```bash
npm list react react-dom react-router-dom @mui/material axios
```

**Expected Output:**
```
├── react@19.2.5
├── react-dom@19.2.5
├── react-router-dom@6.14.0
├── @mui/material@5.14.0
└── axios@1.4.0
```

### Step 3: Configure Environment

```bash
# Navigate to frontend directory
cd frontend

# Create .env file
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_DEBUG_MODE=false
EOF
```

### Step 4: Start Development Server

```bash
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Step 5: Open in Browser

Navigate to: **http://localhost:3000**

---

## Phase 2: Verify Frontend Features

### Test Each Page

1. **Dashboard** (`/dashboard`)
   - ✅ See 4 stats cards
   - ✅ Loading state shows while fetching
   - ✅ Will show "Error" if backend not connected (expected)

2. **Alerts & Logs** (`/logs`)
   - ✅ Table structure visible
   - ✅ Search bar present
   - ✅ Will show empty/error without backend

3. **Behavior Analysis** (`/behavior`)
   - ✅ Time range buttons visible
   - ✅ Charts container ready
   - ✅ Anomalies table present

4. **Rules & Thresholds** (`/rules`)
   - ✅ Tabs visible (Rules/Thresholds)
   - ✅ Create buttons present
   - ✅ Dialog modal functional

5. **AI Decisions** (`/ai-decisions`)
   - ✅ Three tabs visible
   - ✅ Tables ready
   - ✅ Action buttons present

### Navigation Test
- ✅ Click sidebar items - pages change
- ✅ URL updates correctly
- ✅ Navbar displays at top
- ✅ Mobile menu works on small screens

---

## Phase 3: Backend Integration Guide

### What Backend Needs to Provide

The frontend expects the Django backend to provide these 7 API services:

#### 1. **Logs Service** (`/api/logs/`)

```python
# GET /api/logs/
# Paginated logs
Response:
{
  "results": [
    {
      "id": 1,
      "timestamp": "2026-04-22T10:30:00Z",
      "source": "firewall",
      "event_type": "connection_attempt",
      "severity": "high",
      "message": "Unauthorized SSH connection attempt",
      "raw_data": {...}
    }
  ],
  "count": 1000
}

# GET /api/logs/{id}/
# Single log details

# GET /api/logs/duplicates/
# Get duplicate logs
Response: [
  {"id": 1, "message": "..."},
  {"id": 2, "message": "..."}
]

# POST /api/logs/remove-duplicate/
# Remove duplicates
Request: {"log_ids": [1, 2, 3]}
Response: {"deleted": 3}

# GET /api/logs/search/?q=query
# Search logs
Response: {...}
```

#### 2. **Dashboard Service** (`/api/dashboard/`)

```python
# GET /api/dashboard/stats/
Response:
{
  "total_alerts": 1250,
  "critical_alerts": 45,
  "false_positives": 120,
  "detection_rate": 92.5
}

# GET /api/dashboard/trends/?days=30
Response: [
  {"date": "2026-04-22", "alerts": 50, "resolved": 40},
  ...
]

# GET /api/dashboard/top-alerts/?limit=10
Response: [
  {"alert_type": "SSH_BRUTE", "count": 120},
  ...
]

# GET /api/dashboard/health/
Response:
{
  "api_status": "online",
  "database_status": "connected",
  "ai_models_status": "running",
  "cpu_usage": "45%"
}
```

#### 3. **Behavior Service** (`/api/behavior/`)

```python
# GET /api/behavior/analysis/?time_range=24h
Response:
{
  "total_anomalies": 15,
  "high_risk_count": 3,
  "suspicious_users": 5,
  "baseline_deviations": 8,
  "pattern_data": [...],
  "anomaly_types": [...]
}

# GET /api/behavior/anomalies/?time_range=24h
Response: [
  {
    "id": 1,
    "timestamp": "2026-04-22T10:30:00Z",
    "entity_name": "user_john",
    "anomaly_type": "unusual_login_time",
    "risk_level": "high",
    "confidence": 85,
    "description": "Login at unusual time"
  }
]

# GET /api/behavior/user/{user_id}/
Response: {...}

# GET /api/behavior/host/{host_id}/
Response: {...}
```

#### 4. **Rules Service** (`/api/rules/`)

```python
# GET /api/rules/
Response: [
  {
    "id": 1,
    "name": "SSH Brute Force",
    "description": "Detect multiple failed SSH attempts",
    "rule_type": "threshold",
    "condition": "failed_attempts > 5",
    "severity": "high",
    "action": "alert",
    "enabled": true
  }
]

# POST /api/rules/
Request: {...}
Response: {"id": 2, ...}

# PUT /api/rules/{id}/
# PATCH /api/rules/{id}/
# DELETE /api/rules/{id}/
# GET /api/rules/{id}/
# POST /api/rules/test/
```

#### 5. **Thresholds Service** (`/api/thresholds/`)

```python
# GET /api/thresholds/
Response: [
  {
    "id": 1,
    "name": "CPU Usage",
    "description": "Alert if CPU usage exceeds 80%",
    "value": 80,
    "unit": "%",
    "alert_on": "exceed",
    "enabled": true
  }
]

# PUT /api/thresholds/{id}/
# GET /api/thresholds/{id}/
# POST /api/thresholds/reset/
```

#### 6. **AI Service** (`/api/ai/`)

```python
# GET /api/ai/models/
Response: [
  {
    "id": 1,
    "name": "Threat Detector v2",
    "model_type": "deep_learning",
    "version": "2.1.0",
    "is_active": true,
    "accuracy": 94.2,
    "last_updated": "2026-04-22T10:00:00Z",
    "weights": {"feature1": 0.8, "feature2": 0.6}
  }
]

# GET /api/ai/decisions/
Response: [
  {
    "id": 1,
    "timestamp": "2026-04-22T10:30:00Z",
    "event_description": "Multiple failed SSH attempts",
    "decision": "threat",
    "secondary_decision": "brute_force",
    "confidence": 92,
    "model_name": "Threat Detector v2",
    "status": "pending"
  }
]

# POST /api/ai/decisions/{id}/override/
Request: {
  "override_reason": "False positive - security scan",
  "human_decision": "benign"
}

# PUT /api/ai/models/{id}/weights/
Request: {"weights": {"feature1": 0.9, "feature2": 0.5}}

# GET /api/ai/accuracy/
Response:
{
  "overall_accuracy": 94.2,
  "precision": 0.91,
  "recall": 0.96,
  "f1_score": 0.93,
  "true_positives": 450,
  "false_positives": 45,
  "false_negatives": 20,
  "true_negatives": 485,
  "accuracy_trend": [...]
}

# POST /api/ai/train/
```

#### 7. **Alerts Service** (`/api/alerts/`)

```python
# GET /api/alerts/
# GET /api/alerts/{id}/
# PUT /api/alerts/{id}/
# POST /api/alerts/{id}/acknowledge/
# POST /api/alerts/{id}/dismiss/
# GET /api/alerts/stats/
```

---

## Phase 4: Backend Implementation Checklist

### Django Models to Create
- [ ] LogEntry model
- [ ] Alert model
- [ ] Anomaly model
- [ ] Rule model
- [ ] Threshold model
- [ ] AIModel model
- [ ] AIDecision model
- [ ] UserBehavior model
- [ ] HostBehavior model

### Django Serializers to Create
- [ ] LogSerializer
- [ ] AlertSerializer
- [ ] AnomalySerializer
- [ ] RuleSerializer
- [ ] ThresholdSerializer
- [ ] AIModelSerializer
- [ ] AIDecisionSerializer

### Django ViewSets to Create
- [ ] LogViewSet (40+ endpoints)
- [ ] DashboardViewSet
- [ ] BehaviorViewSet
- [ ] RuleViewSet
- [ ] ThresholdViewSet
- [ ] AIViewSet
- [ ] AlertViewSet

### Django URLs to Configure
```python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'logs', LogViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'behavior', BehaviorViewSet, basename='behavior')
router.register(r'rules', RuleViewSet)
router.register(r'thresholds', ThresholdViewSet)
router.register(r'ai', AIViewSet, basename='ai')
router.register(r'alerts', AlertViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
```

### Django Settings Configuration
```python
# settings.py

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'your_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}
```

---

## Phase 5: Testing API Endpoints

### Using curl

```bash
# Test GET request
curl http://localhost:8000/api/logs/

# Test with auth token
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/logs/

# Test POST request
curl -X POST http://localhost:8000/api/rules/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Rule", "enabled": true}'
```

### Using Postman

1. Create collection: "AI SIEM API"
2. Add requests for each endpoint
3. Set authorization header with token
4. Test all 40+ endpoints
5. Export collection for documentation

### Using Frontend Console

```javascript
// Open DevTools Console and test API
fetch('http://localhost:8000/api/logs/')
  .then(r => r.json())
  .then(data => console.log(data))
```

---

## Phase 6: Frontend Testing Scenarios

### Scenario 1: Dashboard
1. ✅ App loads successfully
2. ✅ Stats cards display data from API
3. ✅ Charts render correctly
4. ✅ Loading indicator shows during fetch
5. ✅ Error message if API fails

### Scenario 2: Log Deduplication
1. ✅ Logs table populates
2. ✅ Duplicate alert appears (if duplicates exist)
3. ✅ Remove button works
4. ✅ Duplicates count decreases
5. ✅ Success notification shows

### Scenario 3: Rule Management
1. ✅ Rules table shows existing rules
2. ✅ Create button opens dialog
3. ✅ Form validation works
4. ✅ Submit creates new rule
5. ✅ Table updates with new rule
6. ✅ Edit button updates rule
7. ✅ Delete button removes rule

### Scenario 4: AI Decision Override
1. ✅ Pending decisions appear
2. ✅ Accept button confirms decision
3. ✅ Override button opens reason dialog
4. ✅ Submit override saves with reason
5. ✅ Status changes to "overridden"
6. ✅ Reason is tracked for retraining

### Scenario 5: Error Handling
1. ✅ Network error shows toast message
2. ✅ 404 errors handled gracefully
3. ✅ 500 errors show user-friendly message
4. ✅ Timeout errors handled
5. ✅ Invalid data handled

---

## Phase 7: Troubleshooting Guide

### Frontend Issues

**Issue**: Port 3000 already in use
```bash
# Use different port
PORT=3001 npm start
```

**Issue**: Dependencies fail to install
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Styling not applied
```bash
# Rebuild and restart
npm run build
npm start
```

### API Connection Issues

**Issue**: CORS errors
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Configure CORS on Django backend
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

**Issue**: 404 errors on API calls
```
GET http://localhost:8000/api/logs/ 404
```
**Solution**: Verify backend is running and URLs match

**Issue**: 401 Unauthorized
```
GET http://localhost:8000/api/logs/ 401
```
**Solution**: Add auth token to request

---

## Phase 8: Performance Optimization

### Frontend

```bash
# Build production version
npm run build

# Analyze bundle
npm run build -- --analyze

# Result: ~500KB bundle size
```

### Backend

```python
# Use database indexes
class LogEntry(models.Model):
    timestamp = models.DateTimeField(db_index=True)
    severity = models.CharField(max_length=20, db_index=True)

# Use select_related and prefetch_related
logs = LogEntry.objects.select_related('alert').prefetch_related('tags')

# Use pagination
paginator = Paginator(logs, 10)
```

---

## Phase 9: Security Setup

### Frontend Security
- ✅ XSS protection (built-in)
- ✅ CSRF prevention (token headers)
- ✅ Secure token storage (localStorage)
- ✅ HTTPS ready

### Backend Security
```python
# Django settings
SECURE_SSL_REDIRECT = True  # Production only
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
ALLOWED_HOSTS = ['yourdomain.com']
```

---

## Phase 10: Deployment Strategy

### Development
1. Frontend: `npm start` (port 3000)
2. Backend: `python manage.py runserver` (port 8000)

### Staging
```bash
# Frontend
npm run build
# Deploy build/ directory to staging server

# Backend
python manage.py collectstatic
# Deploy to staging Django server
```

### Production
```bash
# Frontend
npm run build
# Deploy with Docker/Nginx

# Backend
gunicorn app.wsgi
# Deploy with Docker/reverse proxy
```

---

## 📋 Integration Checklist

- [ ] Backend installed and running
- [ ] Database configured
- [ ] Django models created
- [ ] Serializers implemented
- [ ] ViewSets created
- [ ] URLs configured
- [ ] CORS enabled
- [ ] Authentication set up
- [ ] API endpoints tested
- [ ] Frontend .env configured
- [ ] Frontend dependencies installed
- [ ] Frontend running locally
- [ ] API calls tested
- [ ] All pages loading data
- [ ] Error handling working
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation updated

---

## 🎯 Next Steps

### Immediate (Today)
1. [ ] Verify frontend installs and runs
2. [ ] Explore frontend pages
3. [ ] Check browser console for expected API errors

### Short Term (This Week)
1. [ ] Start backend API development
2. [ ] Create Django models
3. [ ] Implement first API endpoint
4. [ ] Test integration

### Medium Term (Next 2 Weeks)
1. [ ] Complete all backend endpoints
2. [ ] Full integration testing
3. [ ] Performance optimization
4. [ ] Security audit

### Long Term (Ready to Deploy)
1. [ ] User acceptance testing
2. [ ] Production deployment
3. [ ] Monitoring setup
4. [ ] User training

---

## 📞 Support Resources

### Frontend Documentation
- **Complete Guide**: FRONTEND_COMPLETE_GUIDE.md
- **Quick Ref**: FRONTEND_QUICK_REFERENCE.md
- **Developer**: DEVELOPMENT.md

### Backend Integration
- **API Specs**: This document
- **Response Examples**: Included above
- **Error Handling**: See testing section

---

## ✅ Quick Start Summary

```bash
# 1. Install
cd frontend
npm install

# 2. Configure
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

# 3. Run
npm start

# 4. Open
# http://localhost:3000

# 5. Note
# API errors are expected until backend is ready
# This is normal and expected at this phase
```

---

**Status**: Frontend Ready ✅
**Next Phase**: Backend Implementation
**Timeline**: Ready for integration immediately

🚀 **The frontend is complete and ready!**
