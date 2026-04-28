# SIEM Improvements Guide

## Part 1: Improved Anomaly Detection

### What's Fixed
The new `anomaly_detection.py` uses **Isolation Forest** with proper feature scaling instead of regex patterns. This prevents the 100/100 anomaly detection issue.

**Key improvements:**
- ✅ Uses only numeric columns (removes unprocessed features)
- ✅ Feature scaling with `StandardScaler` 
- ✅ Lower contamination rate (5% by default, not 100%)
- ✅ Isolation Forest is resistant to overfitting
- ✅ Works with all rows (no sampling bias)

### Run Anomaly Detection

```bash
cd /home/grace/AI\ POWERED\ SIEM\ SYSTEM/backend
python3 anomaly_detection.py
```

**Expected output:**
```
Normal Records: ~165,000+
Anomaly Records: ~8,500-9,000  (≈5%)
Anomaly Percentage: 5.00%
```

### Test Different Contamination Rates

The script automatically compares 1%, 5%, 10%, and 15% contamination rates at the end.

---

## Part 2: Real-Time Log Monitoring

### What's New
`realtime_logs.py` simulates security events entering your SIEM system continuously, perfect for testing dashboards and real-time features.

### Basic Usage

**Default (logs every 2 seconds):**
```bash
python3 realtime_logs.py
```

**Custom intervals:**
```bash
python3 realtime_logs.py --interval=1      # Every 1 second
python3 realtime_logs.py --interval=5      # Every 5 seconds
```

**Send logs to SIEM API (requires API running):**
```bash
python3 realtime_logs.py --api --interval=2
```

**Run for specific duration:**
```bash
python3 realtime_logs.py --duration=60     # Run for 60 seconds
python3 realtime_logs.py --duration=300 --api  # 5 minutes, sending to API
```

### Expected Output

```
[0001] 🟢 [2026-04-27 14:25:30] API:✗ | Login Success           | Low      | firewall
[0002] 🟡 [2026-04-27 14:25:32] API:✗ | Port Scan               | Medium   | web-server
[0003] 🔴 [2026-04-27 14:25:34] API:✗ | DDoS Attack             | High     | database
[0004] 🔴🔴 [2026-04-27 14:25:36] API:✗ | Malware Activity        | Critical | network-monitor
```

---

## Integration Plan

### Immediate (Done)
- ✅ Fixed anomaly detection with Isolation Forest
- ✅ Real-time log generator ready

### Next Steps (For real-time dashboard)

**1. Connect to Django API**
```python
# In realtime_logs.py, enable --api flag
python3 realtime_logs.py --api --interval=2
```

**2. Add Django Channels for WebSocket (real-time frontend)**
```bash
pip install django-channels
# Configure in settings.py to push logs to frontend in real-time
```

**3. React auto-refresh**
```javascript
// In React component
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws/logs/');
  ws.onmessage = (event) => setLogs(JSON.parse(event.data));
}, []);
```

---

## Verification

### Check Anomaly Detection Works
```bash
python3 anomaly_detection.py | head -20
```
Should show: `Normal Records: ~165k+` and `Anomaly Records: ~8.5k` (not 100/100)

### Check Real-Time Monitor Works
```bash
timeout 10 python3 realtime_logs.py
```
Should display 5 events in 10 seconds.

---

## Files Created

| File | Purpose |
|------|---------|
| `anomaly_detection.py` | Improved Isolation Forest-based anomaly detection |
| `realtime_logs.py` | Real-time security event simulator |

---

## Performance Notes

- **Anomaly Detection**: Runs on full dataset (~175k rows), takes ~5-10 seconds
- **Real-Time Monitor**: Lightweight, generates events every 2 seconds by default
- **API Integration**: Can send ~500 logs/minute to Django

---

## What You Should Do Next

1. **Test anomaly detection:**
   ```bash
   python3 anomaly_detection.py
   ```

2. **Test real-time monitoring:**
   ```bash
   python3 realtime_logs.py
   ```

3. **When ready, enable API integration:**
   ```bash
   # Make sure Django is running on localhost:8000
   python3 realtime_logs.py --api --interval=2
   ```

---

## Troubleshooting

**Error: "Dataset not found"**
- Make sure `UNSW_NB15_training-set.csv` is in `backend/data/`

**Error: "scikit-learn not found"**
```bash
pip install scikit-learn pandas
```

**API connection fails**
- Start Django first: `python manage.py runserver`
- Make sure it's running on `http://localhost:8000/`

**Real-time logs not showing**
- Make sure you're in the backend directory
- Try: `python3 realtime_logs.py --interval=5`
