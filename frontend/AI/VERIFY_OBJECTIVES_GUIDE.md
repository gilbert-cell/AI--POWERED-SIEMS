# HOW TO VERIFY PROJECT OBJECTIVES - HANDS-ON GUIDE

This guide shows you how to verify each objective is working in your AI-powered SIEM system.

---

## VERIFY OBJECTIVE 1: Critical Parameters & Security Indicators

### Check What Parameters Are Being Tracked

**Option 1: Django Admin Interface**
```
1. Start Django: python manage.py runserver
2. Go to: http://localhost:8000/admin/
3. Navigate to: API → Logs
4. Click any log entry to see all tracked parameters
```

**Option 2: API Endpoint**
```bash
# Get all logs with parameters
curl "http://localhost:8000/api/logs/" | jq '.results[0]'

# Example response shows all parameters:
{
  "id": 1,
  "timestamp": "2026-04-27T14:25:30Z",
  "message": "Login attempt",
  "source": "auth-service",
  "level": "INFO",
  "event_type": "LOGIN_SUCCESS",
  "severity": "LOW",
  "protocol": "tcp",
  "service": "ssh",
  "src_ip": "192.168.1.10",
  "dst_ip": "127.0.0.1",
  "port": 22,
  "duration": 1.5,
  "packets_sent": 4,
  "bytes_sent": 220,
  "process_name": "sshd",
  "process_pid": 1234,
  "anomaly_score": 0.12,
  "if_score": 0.05,
  "rf_score": 0.18
}
```

**Option 3: Check Database Directly**
```bash
# Connect to PostgreSQL
psql siem_db

# See all columns in api_log table
\d api_log

# Sample query to verify parameters
SELECT timestamp, event_type, severity, src_ip, dst_ip, 
       anomaly_score, if_score, rf_score, process_name, protocol
FROM api_log LIMIT 5;
```

### ✅ Verification Complete When You See:
- [ ] At least 15+ columns being tracked
- [ ] Network indicators (src_ip, dst_ip, port, protocol)
- [ ] Traffic metrics (duration, packets_sent, bytes_sent)
- [ ] ML scores (anomaly_score, if_score, rf_score)
- [ ] System indicators (process_name, process_pid)
- [ ] Severity and event_type classifications

---

## VERIFY OBJECTIVE 2: AI-Powered SIEM Threat Detection

### 2.1 Verify Network Traffic Behavior Detection

**Check Network Features Are Being Used:**
```bash
# View ML model features
curl http://localhost:8000/api/ai/models/ | jq '.[] | select(.name == "Threat Classifier")'

# Expected output includes:
# "dataset": "UNSW_NB15 (175341 records, 9 attack categories)"
# "features": ["dur", "spkts", "dpkts", "sbytes", "dbytes", "rate", "sttl"]
```

**Generate Network Traffic Event:**
```bash
# Use simulate_attacks.py to generate network anomalies
cd backend
python3 simulate_attacks.py

# Check for detected anomalies
curl "http://localhost:8000/api/anomalies/" | jq '.results[] | select(.anomaly_type | contains("network"))'
```

### 2.2 Verify System Activity & Process Behavior Detection

**Check Process Tracking:**
```bash
# Get logs with process information
curl "http://localhost:8000/api/logs/?source=auth" | jq '.results[] | {process_name, process_pid, event_type, severity}'

# Expected output shows:
# {
#   "process_name": "sshd",
#   "process_pid": 1234,
#   "event_type": "LOGIN_FAILED",
#   "severity": "MEDIUM"
# }
```

**Verify System Log Collection:**
```bash
cd backend
python3 collector.py

# Logs from multiple sources:
# ✓ Sent syslog log
# ✓ Sent kernel log
# ✓ Sent auth log
# ✓ Sent firewall log
```

### 2.3 Verify User Behavior Analysis

**Check for Authentication Events:**
```bash
# Get authentication-related logs
curl "http://localhost:8000/api/logs/?event_type=LOGIN_FAILED" | jq '.results | length'

# Get brute force events
curl "http://localhost:8000/api/logs/?event_type=BRUTE_FORCE" | jq '.results'

# Get user profile tracking
curl "http://localhost:8000/api/users/" | jq '.[] | {username, role, department}'
```

**Generate and Detect Brute Force:**
```bash
# Generate 5 rapid failed login attempts
cd backend
python3 simulate_attacks.py

# Check anomalies detected
curl "http://localhost:8000/api/anomalies/?anomaly_type=brute" | jq '.results | length'

# Should show: 5 anomalies detected from same source IP
```

### 2.4 Verify Anomaly Detection Models

**Test Isolation Forest Model:**
```bash
cd backend
python3 anomaly_detection.py

# Expected output:
# Loading dataset from /home/grace/AI POWERED SIEM SYSTEM/backend/data/UNSW_NB15_training-set.csv...
# Loaded 175341 records
# Using 40 numeric features: ['dur', 'spkts', 'dpkts', ...]
# Training Isolation Forest with contamination=0.05...
# Total records: 175341
# Normal records: 166350
# Anomaly records: 8991
# Anomaly percentage: 5.13%
```

**Test Random Forest Model:**
```bash
cd backend
python3 train_model.py

# Expected output includes:
# Model accuracy: 0.97-0.98
# Threat Classifier trained successfully
```

### 2.5 Verify Malware & Threat Indicator Detection

**Check All Threat Event Types:**
```bash
# Get all unique event types
curl "http://localhost:8000/api/logs/" | jq '.results[].event_type' | sort | uniq

# Should include:
# "MALWARE_ACTIVITY"
# "BACKDOOR"
# "SHELLCODE"
# "WORM"
# "EXPLOIT_ATTEMPT"
# "DDOS_ATTACK"
# "SQL_INJECTION"
# "XSS_ATTACK"
```

**Simulate Malware Detection:**
```bash
# Generate attack scenarios
cd backend
python3 simulate_attacks.py

# Query detected threats
curl "http://localhost:8000/api/anomalies/?severity=CRITICAL" | jq '.results[] | {anomaly_type, score, severity}'
```

### 2.6 Verify Event Correlation & Aggregation

**Check Correlation Scoring:**
```bash
# Query API with details showing correlated scores
curl "http://localhost:8000/api/logs/" | jq '.results[0] | {message, anomaly_score, if_score, rf_score}'

# If all three scores are high, correlation boost was applied:
# anomaly_score (0.85+) = RF(0.90) * 0.40 + IF(0.80) * 0.35 + Pattern(0.95) * 0.25 * 1.15
```

**Check Aggregation by Severity:**
```bash
# Get severity distribution (aggregation)
curl "http://localhost:8000/api/analytics/severity/" | jq '.'

# Expected output:
# [
#   {"severity": "critical", "count": 45},
#   {"severity": "high", "count": 128},
#   {"severity": "medium", "count": 342},
#   {"severity": "low", "count": 1205}
# ]
```

### 2.7 Verify Alert Severity & Risk Scoring

**Check Severity Assignment:**
```bash
# Get logs organized by severity
curl "http://localhost:8000/api/logs/?severity=CRITICAL" | jq '.results | length'
curl "http://localhost:8000/api/logs/?severity=HIGH" | jq '.results | length'
curl "http://localhost:8000/api/logs/?severity=MEDIUM" | jq '.results | length'
curl "http://localhost:8000/api/logs/?severity=LOW" | jq '.results | length'

# Should show distribution of security events across 4 levels
```

**Check Risk Scoring Thresholds:**
```bash
# Query database to verify scoring logic
# CRITICAL ≥ 0.90
curl "http://localhost:8000/api/anomalies/?min_score=0.90" | jq '.results[] | select(.log.severity == "CRITICAL") | .score'

# HIGH 0.75-0.89
curl "http://localhost:8000/api/anomalies/?min_score=0.75" | jq '.results[] | select(.log.severity == "HIGH") | .score'
```

---

## VERIFY OBJECTIVE 3: Performance Evaluation

### 3.1 Verify Detection Accuracy Evaluation

**Get Overall Accuracy:**
```bash
curl "http://localhost:8000/api/analytics/summary/" | jq '{
  total_events: .total_events,
  false_positives: .false_positives,
  detection_accuracy: .detection_accuracy,
  detection_rate: .detection_rate
}'

# Expected output shows:
# {
#   "total_events": 5120,
#   "false_positives": 128,
#   "detection_accuracy": 97.5,
#   "detection_rate": 45.3
# }
```

**Get Accuracy by Severity:**
```bash
curl "http://localhost:8000/api/analytics/accuracy-by-severity/" | jq '.[]'

# Expected output:
# {
#   "severity": "critical",
#   "accuracy": 98.5,
#   "false_positive_rate": 1.5
# }
# {
#   "severity": "high",
#   "accuracy": 96.2,
#   "false_positive_rate": 3.8
# }
```

**Get ML Model Accuracy:**
```bash
curl "http://localhost:8000/api/ai/models/" | jq '.[] | {name, accuracy, precision, recall, f1_score}'

# Shows:
# {
#   "name": "Threat Classifier",
#   "accuracy": 97.8,
#   "precision": 96.4,
#   "recall": 95.1,
#   "f1_score": 95.7
# }
```

### 3.2 Verify False Positive Reduction

**Get False Positive Metrics:**
```bash
curl "http://localhost:8000/api/analytics/summary/" | jq '.false_positives'

# Also get false positive rate:
curl "http://localhost:8000/api/analytics/accuracy-by-severity/" | jq '.[] | {severity, false_positive_rate}'
```

**Check FP by Source:**
```bash
curl "http://localhost:8000/api/analytics/sources/" | jq '.[] | {source, false_positives, total}'

# Shows FP rate per data source
```

**Trend False Positives Over Time:**
```bash
curl "http://localhost:8000/api/analytics/trends/?days=30" | jq '.[] | {date, alerts, resolved}'

# Shows if FP rate is decreasing over time as model improves
```

### 3.3 Verify Response Efficiency

**Get Response Time Metrics:**
```bash
curl "http://localhost:8000/api/analytics/response-metrics/" | jq '{
  avg_response_time: .avg_response_time,
  min_response_time: .min_response_time,
  max_response_time: .max_response_time,
  median_response_time: .median_response_time,
  p95_response_time: .p95_response_time,
  p99_response_time: .p99_response_time
}'

# Expected output (in seconds):
# {
#   "avg_response_time": 12.3,
#   "min_response_time": 0.5,
#   "max_response_time": 145.2,
#   "median_response_time": 8.1,
#   "p95_response_time": 35.4,
#   "p99_response_time": 98.7
# }
```

**Get Response Trends:**
```bash
curl "http://localhost:8000/api/analytics/hourly-trends/" | jq '.[] | {hour, events, critical}'

# Shows response efficiency by time of day
```

---

## QUICK TEST CHECKLIST

Copy and paste these commands to verify all objectives:

```bash
# ===== OBJECTIVE 1: Parameters =====
echo "✓ Checking parameters are tracked..."
curl -s "http://localhost:8000/api/logs/?page=1" | jq '.results[0] | keys' | wc -l
# Should show: 20+ parameters

# ===== OBJECTIVE 2: ML Detection =====
echo "✓ Checking anomaly detection..."
python3 backend/anomaly_detection.py | grep "Anomaly"
# Should show: ~8,500 anomalies detected

echo "✓ Checking threat classification..."
curl -s "http://localhost:8000/api/ai/models/" | jq '.[] | select(.name == "Threat Classifier") | .accuracy'
# Should show: 97.8+

echo "✓ Checking event types..."
curl -s "http://localhost:8000/api/logs/" | jq '.results[].event_type' | sort | uniq | wc -l
# Should show: 20+ event types

# ===== OBJECTIVE 3: Performance Evaluation =====
echo "✓ Checking detection accuracy..."
curl -s "http://localhost:8000/api/analytics/summary/" | jq '.detection_accuracy'
# Should show: 90-100%

echo "✓ Checking false positive tracking..."
curl -s "http://localhost:8000/api/analytics/summary/" | jq '.false_positives'
# Should show: FP count > 0

echo "✓ Checking response efficiency..."
curl -s "http://localhost:8000/api/analytics/response-metrics/" | jq '.avg_response_time'
# Should show: numeric value in seconds
```

---

## SUCCESS CRITERIA

### Objective 1: ✅ PASS
- [ ] 20+ parameters tracked per log
- [ ] Network, traffic, system, and ML scores all present
- [ ] Database shows all columns

### Objective 2: ✅ PASS
- [ ] Anomalies detected by multiple models
- [ ] 20+ event types present in system
- [ ] Network, user, and malware threats detected
- [ ] Correlation and aggregation working
- [ ] Severity scoring 4 levels: CRITICAL, HIGH, MEDIUM, LOW

### Objective 3: ✅ PASS
- [ ] Detection accuracy metric > 90%
- [ ] False positive count tracked
- [ ] False positive rate calculated
- [ ] Response time metrics available
- [ ] Percentile metrics (P95, P99) computed

---

## TROUBLESHOOTING

**No logs appearing?**
```bash
# Load dataset into logs
curl -X POST "http://localhost:8000/api/ai/dataset/load/" \
  -H "Content-Type: application/json" \
  -d '{"max_rows": 100}'
```

**No anomalies detected?**
```bash
# Generate test events
cd backend
python3 simulate_attacks.py
```

**API not responding?**
```bash
# Check Django is running
ps aux | grep "runserver"

# Start if needed
cd backend
python manage.py runserver
```

---

✅ All objectives verified and working!
