# SIEM Improvements Guide

## Part 0: Standard 5-Level Severity Scale

This SIEM uses the industry-standard 5-level severity scale aligned with commercial SIEM platforms.

| Level | Color | Score Range | Description | Examples |
|-------|-------|-------------|-------------|----------|
| 🔵 Informational | Blue | 0.00 – 0.14 | Normal activity, no threat | Login success, SSH session opened, service start, cron job |
| 🟢 Low | Green | 0.15 – 0.44 | Minor event, monitor only | User logout, config change, USB device connected, normal process |
| 🟡 Medium | Yellow | 0.45 – 0.74 | Suspicious, needs investigation | Failed SSH login, multiple failed logins, unexpected file access |
| 🟠 High | Orange | 0.75 – 0.89 | Likely attack or policy violation | Port scan, brute-force, malware detected, DoS, SQL Injection, XSS |
| 🔴 Critical | Red | 0.90 – 1.00 | Confirmed/severe attack, immediate response | Privilege escalation, ransomware, backdoor, RCE, data exfiltration |

### Network Events (UNSW-NB15) Severity Mapping

| Attack Category | Severity |
|----------------|----------|
| Normal | Informational |
| Analysis | Medium |
| Fuzzers | Medium |
| Reconnaissance | Medium |
| Generic | High |
| DoS | High |
| Exploits | Critical |
| Backdoor | Critical |
| Worms | Critical |
| Shellcode | Critical |

### Ubuntu Host Events Severity Mapping

| Host Event | Severity |
|-----------|----------|
| Successful login | Informational |
| SSH session opened | Informational |
| System boot | Informational |
| Cron job executed | Informational |
| Service started | Informational |
| User logout | Low |
| Configuration change | Low |
| USB device connected | Low |
| Failed login | Medium |
| Unexpected file access | Medium |
| High memory usage | Medium |
| Multiple failed logins (>5) | High |
| New sudo session | High |
| Root login | High |
| Suspicious process | High |
| Privilege escalation | Critical |
| Unauthorized file modification | Critical |

### Example Alerts

```json
{ "event": "User Login Success", "severity": "Informational", "status": "Open" }
{ "event": "Failed SSH Login",   "severity": "Medium",        "status": "Open" }
{ "event": "SSH Brute Force",    "severity": "High",          "status": "Open" }
{ "event": "Privilege Escalation", "severity": "Critical",   "status": "Open" }
```

---

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
[0001] 🟢 [2026-04-27 14:25:30] API:✗ | Login Success           | Informational | auth-service
[0002] 🟡 [2026-04-27 14:25:32] API:✗ | Failed SSH Login        | Medium        | web-server
[0003] 🔴 [2026-04-27 14:25:34] API:✗ | Port Scan               | High          | firewall
[0004] 🔴🔴 [2026-04-27 14:25:36] API:✗ | Backdoor Detected       | Critical      | ids-system
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
