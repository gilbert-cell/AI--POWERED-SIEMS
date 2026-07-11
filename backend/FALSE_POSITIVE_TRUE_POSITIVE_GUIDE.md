# How to Identify False Positives vs True Positives in Your AI SIEM

## Quick Overview

Your SIEM system has **built-in feedback mechanisms** that allow security analysts to classify alerts:

| Status | Meaning | What It Means |
|--------|---------|---------------|
| **False Positive** | NOT a real threat | The ML model incorrectly flagged normal activity as malicious |
| **True Positive (Confirmed)** | IS a real threat | The ML model correctly identified actual malicious activity |
| **Pending Review** | Awaiting classification | New alert not yet reviewed by analysts |
| **Under Review** | Being investigated | Analyst is actively investigating |
| **Resolved** | Investigation complete | Incident has been handled/closed |

---

## Method 1: Automatic Detection Features

### 1.1 **Anomaly Score & Severity**
Your SIEM uses a hybrid ML scoring system:

- **Anomaly Score**: 0.0 to 1.0 (higher = more suspicious)
  - Combines: Isolation Forest (IF) + Random Forest (RF) + Pattern Rules
  - Stored in: `anomaly_score`, `if_score`, `rf_score` database fields

| Score Range | Severity | Action |
|------------|----------|--------|
| 0.00–0.14 | 🔵 Informational | Ignore |
| 0.15–0.44 | 🟢 Low | Monitor |
| 0.45–0.74 | 🟡 Medium | Investigate |
| 0.75–0.89 | 🟠 High | Urgent Investigation |
| 0.90–1.00 | 🔴 Critical | Immediate Response |

### 1.2 **FALSE_POSITIVE_EVENTS List**
Your system automatically marks certain events as false positives:

```python
FALSE_POSITIVE_EVENTS = {
    'CONFIG_CHANGE': True,          # Config changes are expected
    'SERVICE_RESTART': True,         # Service restarts are expected
    'CRON_JOB': True,               # Scheduled jobs are expected
    'BACKUP_ACTIVITY': True,         # Backups are expected
    # ... and others
}
```

**Location**: [api/views.py](api/views.py#L330)

---

## Method 2: Manual Analyst Review

### 2.1 **Dashboard Review Process**

When you see an alert in the dashboard:

1. **Examine the Alert Details**:
   - Event type (e.g., "Login Failed", "Port Scan")
   - Source IP & destination IP
   - Timestamp
   - Anomaly score
   - Associated logs

2. **Ask Yourself**:
   - ✅ Is this expected activity? (e.g., scheduled backup, routine admin task)
   - ✅ Do I recognize the source/destination?
   - ✅ Does this fit the normal pattern for this user/host?
   - ✅ Are multiple detection signals firing? (IF score + RF score + rules agreeing)
   - ❌ Could this be a system anomaly rather than attack?

3. **Mark Appropriately** (see API endpoints below)

### 2.2 **Visual Indicators**

Your dashboard shows:
- **Color-coded severity**: Blue (Info) → Red (Critical)
- **Anomaly score visualization**: Shows IF, RF, and combined scores
- **Related events**: Shows correlated events in the same timeframe
- **Context timeline**: Historical activity from same source/user

---

## Method 3: API Endpoints to Mark Alerts

### 3.1 **Mark as FALSE POSITIVE**

```bash
POST /api/anomalies/<anomaly_id>/mark-false-positive/
```

**Use when**: The alert is legitimate activity (e.g., authorized login from new IP, routine config change)

**Example - cURL**:
```bash
curl -X POST http://localhost:8000/api/anomalies/123/mark-false-positive/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Anomaly 123 marked as false positive",
  "anomaly": {
    "id": 123,
    "status": "false_positive",
    "anomaly_type": "BRUTE_FORCE",
    "score": 0.65
  }
}
```

### 3.2 **Mark as TRUE POSITIVE (Confirmed Threat)**

```bash
POST /api/anomalies/<anomaly_id>/confirm-threat/
```

**Use when**: The alert represents actual malicious activity requiring response

**Example - cURL**:
```bash
curl -X POST http://localhost:8000/api/anomalies/123/confirm-threat/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Anomaly 123 marked as confirmed threat",
  "anomaly": {
    "id": 123,
    "status": "confirmed",
    "anomaly_type": "PRIVILEGE_ESCALATION",
    "score": 0.95
  }
}
```

---

## Method 4: Rules of Thumb for Classification

### 4.1 **Likely FALSE POSITIVES** ⚠️

- ✅ **Scheduled Tasks**: Cron jobs, backups, maintenance windows
- ✅ **Authorized Changes**: Admin config changes, software updates
- ✅ **Expected Logins**: New location for known user (traveling)
- ✅ **High Volume Normal Traffic**: Spike from web services, load balancers
- ✅ **Failed Logins < 3**: Occasional mistyped passwords
- ✅ **Service Restarts**: Scheduled reboots, deployments

### 4.2 **Likely TRUE POSITIVES** 🚨

- ❌ **Multiple Failed Logins**: 5+ failed login attempts
- ❌ **Privilege Escalation**: Unexpected sudo/root usage
- ❌ **Port Scans**: Unknown host scanning many ports
- ❌ **Unusual Processes**: Unknown executables in system directories
- ❌ **Data Exfiltration**: Large data transfers to external IPs
- ❌ **SQL Injection/XSS**: Malformed queries in web logs
- ❌ **Backdoor/Shellcode**: Known malware signatures
- ❌ **DoS Attacks**: Flooding from single/multiple sources
- ❌ **Unusual Hours**: Admin activity at 3 AM from foreign country

---

## Method 5: Programmatic Classification

### 5.1 **Query by Status**

Get all alerts by classification status:

```python
from api.models import Anomaly

# Get all false positives
false_positives = Anomaly.objects.filter(status='false_positive')
print(f"False Positives: {false_positives.count()}")

# Get all confirmed threats
true_positives = Anomaly.objects.filter(status='confirmed')
print(f"True Positives: {true_positives.count()}")

# Get pending review
pending = Anomaly.objects.filter(status='new')
print(f"Pending Review: {pending.count()}")
```

### 5.2 **Calculate Metrics**

```python
from django.db.models import Count, Q
from api.models import Anomaly

total_alerts = Anomaly.objects.count()
fps = Anomaly.objects.filter(status='false_positive').count()
tps = Anomaly.objects.filter(status='confirmed').count()

false_positive_rate = (fps / total_alerts * 100) if total_alerts > 0 else 0

print(f"Total Alerts: {total_alerts}")
print(f"False Positives: {fps} ({false_positive_rate:.1f}%)")
print(f"True Positives: {tps} ({tps/total_alerts*100:.1f}%)")
print(f"Pending: {Anomaly.objects.filter(status='new').count()}")
```

### 5.3 **Dashboard View API**

Get summary statistics:

```bash
GET /api/dashboard/
```

**Response includes**:
```json
{
  "total_alerts": 1250,
  "critical_alerts": 45,
  "true_positives": 125,
  "false_positives": 980,
  "false_positive_rate": 78.4,
  "pending_review": 145
}
```

---

## Method 6: Using Frontend UI

### 6.1 **Alert Details View**

1. Open the **Logs Dashboard**
2. Click on any alert with severity > Low
3. In the details panel, you'll see:
   - ML Scores (IF, RF, Combined)
   - Severity and status
   - Related events
   - **Action buttons**: "Mark as False Positive" or "Confirm Threat"

### 6.2 **Bulk Operations** (if implemented)

Select multiple alerts and:
- Mark batch as false positive (e.g., all failed logins from your IP)
- Confirm batch as threats
- Export for analysis

---

## Example Scenarios

### Scenario 1: Failed SSH Logins

**Alert**: "SSH Brute Force Detected" - Score 0.72 (Medium)
- Source: 203.0.113.50
- Destination: 192.168.1.100
- Failed attempts: 8

**Your Investigation**:
- ✅ Check: Is 203.0.113.50 a known penetration test?
- ✅ Check: Did your security team schedule a pentest?
- ✅ Check: Are logs showing successful login after failures?

**Decision**:
- **FALSE POSITIVE** ➜ If this is an authorized pentest or failed admin attempt
- **TRUE POSITIVE** ➜ If source is unknown and all attempts failed with no success

### Scenario 2: Config File Modified

**Alert**: "Unauthorized File Modification" - Score 0.55 (Medium)
- File: `/etc/ssh/sshd_config`
- User: `admin`
- Time: 14:32 UTC

**Your Investigation**:
- ✅ Check: Is admin authorized to modify SSH config?
- ✅ Check: Was there a change ticket/maintenance window?
- ✅ Check: What was changed? (IP whitelist? Port number?)

**Decision**:
- **FALSE POSITIVE** ➜ If this is documented maintenance
- **TRUE POSITIVE** ➜ If undocumented and part of a breach pattern

### Scenario 3: Large Data Transfer

**Alert**: "Unusual Data Exfiltration" - Score 0.88 (High)
- Source: 192.168.1.50 (internal DB server)
- Destination: 185.220.101.1 (external, suspicious country)
- Volume: 2.3 GB
- Protocol: TCP to port 443

**Your Investigation**:
- ✅ Check: Is this server supposed to sync with external systems?
- ✅ Check: Who owns/manages this IP address?
- ✅ Check: Is the destination a known malicious C2 server?
- ✅ Check: What application initiated the transfer?

**Decision**:
- **FALSE POSITIVE** ➜ If legitimate cloud backup/replication
- **TRUE POSITIVE** ➜ If unknown destination and no legitimate business purpose

---

## Recommended Workflow

### For Security Analysts

1. **Daily Review** (mornings)
   - Filter for alerts: **Status = "new" AND Severity >= HIGH**
   - Spend 5-10 min per alert investigating context
   - Mark clearly as FP or TP

2. **Weekly Tuning** (Fridays)
   - Review false positive rate
   - If > 80% FP: Adjust thresholds in `/api/config.py`
   - If < 20% FP: May need more aggressive detection

3. **Monthly Reporting**
   - Run metrics queries
   - Show FP/TP trends to management
   - Adjust model weights based on findings

### For ML Engineers

1. **Monitor Feedback**
   - Use analyst feedback to retrain models
   - Models improve as they see real FP/TP patterns

2. **Adjust Thresholds**
   - If FP rate > 80%: Increase `ANOMALY_THRESHOLD`
   - If missing real attacks: Decrease `ANOMALY_THRESHOLD`

3. **Fine-tune Weights**
   - In [api/config.py](api/config.py):
   ```python
   RF_WEIGHT = 0.4      # Random Forest confidence
   IF_WEIGHT = 0.3      # Isolation Forest confidence
   PATTERN_WEIGHT = 0.3 # Rule-based pattern matching
   ```

---

## Key Files for Reference

- **API Endpoints**: [api/urls.py](api/urls.py) - Lines with "mark-false-positive" and "confirm-threat"
- **Views**: [api/views.py](api/views.py) - Marks, queries, status logic
- **Models**: [api/models.py](api/models.py) - Anomaly status choices
- **Configuration**: [api/config.py](api/config.py) - Thresholds and weights
- **Services**: [api/services.py](api/services.py) - Queries false positives

---

## Summary

| How to Identify | Method | Use When |
|---|---|---|
| **Automatic** | Severity score + pre-defined rules | Initial filtering |
| **Manual Review** | Investigate context, source, patterns | Making final call |
| **API Endpoints** | POST to mark-false-positive or confirm-threat | Recording decision |
| **Bulk Classification** | Dashboard buttons or batch API calls | Processing many alerts |
| **Metrics** | Query database for FP/TP rates | Tuning and reporting |

**Bottom line**: Your SIEM provides both **automated hints** (scores, rules) and **analyst tools** (feedback endpoints, status tracking) to distinguish real threats from false alarms. Use both together for best results!
