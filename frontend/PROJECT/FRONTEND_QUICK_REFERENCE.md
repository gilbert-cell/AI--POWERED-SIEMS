# Frontend Quick Reference Guide

## 🚀 Getting Started (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

### 3. Start Development Server
```bash
npm start
```
Opens at `http://localhost:3000`

---

## 📍 Navigation Map

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard` | Main monitoring hub |
| Alerts & Logs | `/logs` | Log management & deduplication |
| Behavior Analysis | `/behavior` | Anomaly detection |
| Rules & Thresholds | `/rules` | Rule and threshold tuning |
| AI Decisions | `/ai-decisions` | AI decision management |
| Analytics | `/analytics` | Reports (coming soon) |

---

## 🎨 Key UI Components

### Stats Cards
```javascript
<Card sx={{ backgroundColor: '#e3f2fd' }}>
  <CardContent>
    <Typography>Label</Typography>
    <Typography variant="h5">123</Typography>
  </CardContent>
</Card>
```

### Data Tables
- Use Material-UI `Table` component
- Include `TableHead`, `TableBody`, `TableRow`, `TableCell`
- Add hover effect with `hover` prop

### Modals/Dialogs
- Use Material-UI `Dialog` component
- Include `DialogTitle`, `DialogContent`, `DialogActions`
- Title with colored background: `sx={{ backgroundColor: '#1a237e', color: 'white' }}`

### Charts
- Use Recharts library
- `LineChart`, `BarChart`, `PieChart`, `ScatterChart`
- Wrap in `ResponsiveContainer` for responsiveness

---

## 📊 Common Data Patterns

### API Response Handling
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const response = await apiService.getData();
    setData(response.data);
  } catch (err) {
    setError(err.message);
    toast.error('Failed to fetch data');
  } finally {
    setLoading(false);
  }
};
```

### Pagination
```javascript
const [page, setPage] = useState(1);
const itemsPerPage = 10;

const response = await apiService.getItems({
  page,
  page_size: itemsPerPage,
});
```

### Search
```javascript
const [searchQuery, setSearchQuery] = useState('');

const handleSearch = async (e) => {
  e.preventDefault();
  const response = await apiService.search(searchQuery);
  setResults(response.data);
};
```

---

## 🎯 Common Color Mappings

### Severity
```javascript
const colors = {
  critical: '#d32f2f',  // Red
  high: '#f57c00',      // Orange
  medium: '#fbc02d',    // Yellow
  low: '#388e3c',       // Green
};
```

### Risk Level (MUI)
```javascript
const colors = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};
```

### Background
```javascript
const bgColors = {
  success: '#e8f5e9',
  error: '#ffebee',
  warning: '#fff3e0',
  info: '#e3f2fd',
};
```

---

## 🔧 API Endpoints Reference

### Logs
```javascript
logService.getLogs({ page, page_size })
logService.searchLogs(query, { page })
logService.getDuplicateLogs()
logService.removeDuplicate([ids])
```

### Dashboard
```javascript
dashboardService.getStats()
dashboardService.getAlertTrends(days)
dashboardService.getTopAlerts(limit)
dashboardService.getSystemHealth()
```

### Behavior
```javascript
behaviorService.getAnalysis({ time_range })
behaviorService.getAnomalies({ time_range })
behaviorService.getUserBehavior(userId)
behaviorService.getHostBehavior(hostId)
```

### Rules
```javascript
rulesService.getRules({ page })
rulesService.createRule(data)
rulesService.updateRule(id, data)
rulesService.deleteRule(id)
rulesService.testRule(data)
```

### Thresholds
```javascript
thresholdsService.getThresholds()
thresholdsService.updateThreshold(id, data)
thresholdsService.resetThresholds()
```

### AI
```javascript
aiService.getModels()
aiService.getDecisions({ status })
aiService.overrideDecision(id, data)
aiService.updateModelWeights(id, data)
aiService.getAccuracy()
```

---

## 🎨 Styling Cheat Sheet

### MUI Spacing
```javascript
sx={{ p: 2 }}        // padding: 16px
sx={{ m: 2 }}        // margin: 16px
sx={{ px: 2, py: 1 }} // padding horizontal/vertical
sx={{ gap: 2 }}      // gap: 16px (flexbox)
```

### Colors
```javascript
sx={{ color: '#1a237e' }}           // Primary
sx={{ backgroundColor: '#e8f5e9' }} // Light green
sx={{ border: '1px solid #e0e0e0' }}
```

### Flexbox
```javascript
sx={{ display: 'flex' }}
sx={{ display: 'flex', gap: 1 }}
sx={{ display: 'flex', justifyContent: 'space-between' }}
sx={{ display: 'flex', alignItems: 'center' }}
```

### Responsive
```javascript
sx={{ display: { xs: 'block', md: 'flex' } }}
sx={{ width: { xs: '100%', md: '50%' } }}
sx={{ fontSize: { xs: '14px', md: '16px' } }}
```

---

## 🔍 Debugging Tips

### Console Logging
```javascript
console.log('Data:', data);
console.error('Error:', error);
console.table(arrayData);
```

### Network Inspection
- Open DevTools → Network tab
- Monitor API calls
- Check request/response headers
- Verify authorization token

### React DevTools
- Install React DevTools extension
- Inspect component hierarchy
- Check props and state values
- Profile performance

### Toast Notifications
```javascript
toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
toast.warning('Warning message');
```

---

## 📦 Available NPM Scripts

```bash
npm start      # Development server
npm run build  # Production build
npm test       # Run tests
npm run eject  # Eject create-react-app (one-way)
```

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API 404 errors | Check backend URL in .env |
| CORS errors | Verify backend CORS config |
| Auth errors | Check token in localStorage |
| Styling not applied | Clear cache, rebuild, restart |
| Components not showing | Check routing path |
| Data not loading | Check API response format |

---

## 📱 Responsive Breakpoints

```javascript
xs: 0px     // Mobile
sm: 600px   // Tablet
md: 960px   // Small Desktop
lg: 1280px  // Desktop
xl: 1920px  // Large Desktop
```

### Mobile-First Example
```javascript
sx={{ 
  display: { xs: 'none', md: 'block' },  // Hidden on mobile
  width: { xs: '100%', md: '50%' }       // Full width mobile, 50% desktop
}}
```

---

## 🎯 Code Examples

### Adding New Rule
```javascript
const newRule = {
  name: 'SSH Brute Force',
  description: 'Detect multiple failed SSH login attempts',
  rule_type: 'threshold',
  condition: 'failed_ssh_attempts > 5',
  severity: 'high',
  action: 'alert',
  enabled: true,
};

await rulesService.createRule(newRule);
toast.success('Rule created successfully');
```

### Overriding AI Decision
```javascript
await aiService.overrideDecision(decisionId, {
  override_reason: 'False positive - known security scan',
  human_decision: 'benign',
});
toast.success('Decision overridden');
```

### Updating Threshold
```javascript
await thresholdsService.updateThreshold(thresholdId, {
  value: 75,
  alert_on: 'exceed',
});
toast.success('Threshold updated');
```

---

## 🔐 Security Best Practices

✅ Always validate user input
✅ Use HTTPS in production
✅ Store auth tokens securely
✅ Sanitize displayed data
✅ Use CSRF tokens
✅ Implement rate limiting
✅ Keep dependencies updated

---

## 📚 Documentation Files

- **README_FRONTEND.md** - User guide & features
- **DEVELOPMENT.md** - Developer technical guide
- **FRONTEND_IMPLEMENTATION_SUMMARY.md** - Project overview

---

## 🆘 Getting Help

1. Check the documentation files
2. Review existing code patterns
3. Check browser console for errors
4. Verify backend is running
5. Check API response format

---

## ✨ Pro Tips

💡 Use Ctrl+Shift+J to open DevTools → Console
💡 Use `npm run build` to find unused code
💡 Use React DevTools to trace component renders
💡 Test API endpoints with Postman before integration
💡 Keep API endpoints in sync with backend documentation

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
