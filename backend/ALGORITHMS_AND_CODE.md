# AI SIEM Algorithms & Code Implementation

## Overview

Your AI SIEM uses a **hybrid machine learning approach** combining:
1. **Isolation Forest** (unsupervised anomaly detection)
2. **Random Forest** (supervised threat classification)
3. **Pattern Rules** (regex-based attack signatures)

---

## Algorithm 1: Isolation Forest (Unsupervised Anomaly Detection)

### What It Does
Detects **statistical outliers** without needing labeled training data. Perfect for finding unusual network traffic patterns.

### Key Code

**File**: [anomaly_detection.py](anomaly_detection.py)

```python
def detect_anomalies(csv_path=None, contamination=0.05):
    """
    Detect anomalies using Isolation Forest with feature scaling
    
    Args:
        csv_path: Path to the dataset CSV file
        contamination: Expected proportion of anomalies (0.05 = 5%)
    
    Returns:
        dict with anomaly detection results
    """
    # Load data
    print(f"Loading dataset from {csv_path}...")
    df = pd.read_csv(csv_path, low_memory=False)
    
    # Keep numeric columns only
    X = df.select_dtypes(include=['int64', 'float64'])
    print(f"Using {len(X.columns)} numeric features: {list(X.columns)[:5]}...")
    
    # Handle missing values
    X = X.fillna(X.mean())
    
    # Scale data (CRITICAL for IF)
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest model
    print(f"Training Isolation Forest with contamination={contamination}...")
    model = IsolationForest(
        n_estimators=100,           # Number of isolation trees
        contamination=contamination, # Expected anomaly rate (5%)
        random_state=42,
        n_jobs=-1                   # Use all CPU cores
    )
    
    # Get predictions: -1 = anomaly, 1 = normal
    predictions = model.fit_predict(X_scaled)
    
    # Get anomaly scores (lower = more anomalous)
    anomaly_scores = model.score_samples(X_scaled)
    
    # Count results
    anomalies = (predictions == -1).sum()
    normal = (predictions == 1).sum()
    
    return {
        'total_records': len(df),
        'normal_records': int(normal),
        'anomaly_records': int(anomalies),
        'anomaly_percentage': round((anomalies / len(df)) * 100, 2),
        'predictions': predictions.tolist(),      # -1 or 1
        'anomaly_scores': anomaly_scores.tolist()  # Raw scores
    }
```

### Features Used
```
'duration'     → Connection duration (seconds)
'packets_sent' → Number of packets transmitted
'bytes_sent'   → Total bytes transmitted
'port'         → Destination port number
```

### Example Scores
```
Normal traffic:  anomaly_score = +0.15 (high value = normal)
Unusual traffic: anomaly_score = -0.87 (low value = anomaly)
```

---

## Algorithm 2: Random Forest (Supervised Threat Classification)

### What It Does
**Learns from labeled data** (UNSW-NB15 dataset: 175,341 records with attack labels) to predict if a log is benign or malicious.

### Key Code

**File**: [api/ai_model.py](api/ai_model.py#L65)

```python
def train_model(csv_filename: str = None) -> dict:
    """Train Random Forest from PostgreSQL api_log table."""
    df = _load_db_dataframe()
    
    # Label: anomaly_score >= 0.45 = threat
    df['label'] = (df['anomaly_score'] >= 0.45).astype(int)
    
    # Features for RF model
    feature_cols = [
        'duration', 'packets_sent', 'bytes_sent', 'port',
        'severity', 'event_type', 'source'  # Mixed: numeric + categorical
    ]
    X = df[feature_cols]
    y = df['label']
    
    # Train-test split (80-20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.2, 
        random_state=42, 
        stratify=y  # Balanced split
    )
    
    # Train Random Forest classifier
    model = RandomForestClassifier(
        n_estimators=100,    # 100 decision trees
        n_jobs=-1,           # Parallel processing
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Calculate accuracy on test set
    accuracy = model.score(X_test, y_test)
    
    # Save model
    artifact = {'model': model, 'columns': feature_cols}
    joblib.dump(artifact, MODEL_PATH)
    
    return {
        'model_path': str(MODEL_PATH),
        'accuracy': float(accuracy),
        'feature_count': len(feature_cols)
    }
```

### Prediction Example

**File**: [api/ai_model.py](api/ai_model.py#L467)

```python
def predict_record(record: dict) -> dict:
    """Use Random Forest to score a single log entry"""
    
    artifact = load_model_artifact()
    model   = artifact['model']
    columns = artifact['columns']
    
    # Convert input record to DataFrame
    df = pd.DataFrame([{c: record.get(c, 0) for c in columns}])
    
    # Get prediction (0 or 1)
    prediction = model.predict(df)
    
    # Get probability scores for each class
    proba    = model.predict_proba(df)[0].tolist()
    
    # Probability of being malicious (class 1)
    rf_score = float(proba[1]) if len(proba) > 1 else float(proba[0])
    
    return {
        'threat': int(prediction[0]),        # 0=benign, 1=threat
        'probabilities': proba,              # [P(benign), P(threat)]
        'rf_score': round(min(max(rf_score, 0.0), 1.0), 3)  # 0.0-1.0
    }
```

---

## Algorithm 3: Pattern Matching (Rule-Based Detection)

### What It Does
Matches log messages against **known attack signatures** using regex patterns.

### Key Code

**File**: [api/views.py](api/views.py#L900)

```python
ANOMALY_PATTERNS = [
    (re.compile(r'failed login|authentication failure|invalid user', re.I), 
     'Suspicious Login', 0.95),
    
    (re.compile(r'UFW BLOCK|blocked port scan|DPT=|SYN flood', re.I), 
     'Network Intrusion', 0.85),
    
    (re.compile(r'sudo:|pkexec|privilege escalation', re.I), 
     'Privilege Escalation', 0.8),
    
    (re.compile(r'sql injection|sql injection attempt|xss|cross-site scripting', re.I), 
     'Web Application Attack', 0.9),
    
    (re.compile(r'kernel panic|segfault|OOM killer', re.I), 
     'System Instability', 0.7),
]

def score_log_anomaly(log_message, log_level, source='', record=None):
    """
    Hybrid anomaly scorer combining all three algorithms
    """
    record = record or {}
    reasons = []
    
    # ── 1. Pattern / rule-based baseline ──
    pattern_score = 0.0
    for pattern, label, weight in ANOMALY_PATTERNS:
        if pattern.search(log_message or ''):
            pattern_score = max(pattern_score, weight)
            reasons.append(label)
    
    if log_level and log_level.upper() in ['ERROR', 'CRITICAL']:
        pattern_score = max(pattern_score, 0.75)
```

### Examples
```
Message: "authentication failure for user admin from 192.168.1.50"
→ Matches pattern 'failed login|authentication failure'
→ pattern_score = 0.95

Message: "UFW BLOCK inbound TCP connection reset"
→ Matches 'UFW BLOCK'
→ pattern_score = 0.85
```

---

## Algorithm 4: Hybrid Scoring (Combines All Three)

### Mathematical Formula

$$\text{Hybrid Score} = (0.40 \times RF) + (0.35 \times IF) + (0.25 \times PATTERN)$$

**With Correlated Boost:**
- If both RF ≥ 0.6 AND IF ≥ 0.6 → Multiply hybrid by **1.15** (confidence boost)

### Full Implementation

**File**: [api/views.py](api/views.py#L930)

```python
def score_log_anomaly(log_message, log_level, source='', record=None):
    """
    Hybrid anomaly scorer: Isolation Forest + Random Forest + Pattern rules
    Returns dict with combined score and reasoning
    """
    record = record or {}
    reasons = []
    
    # ── 1. Pattern scoring ──
    pattern_score = 0.0
    for pattern, label, weight in ANOMALY_PATTERNS:
        if pattern.search(log_message or ''):
            pattern_score = max(pattern_score, weight)
            reasons.append(label)
    
    if log_level and log_level.upper() in ['ERROR', 'CRITICAL']:
        pattern_score = max(pattern_score, 0.75)
        if 'High severity event' not in reasons:
            reasons.append('High severity event')
    
    # ── 2. Random Forest scoring ──
    rf_score = 0.0
    ml_result = _ml_score_log(log_message, log_level, source)
    if ml_result is not None:
        rf_score = ml_result
        if rf_score >= 0.7 and 'Random Forest' not in reasons:
            reasons.append('Random Forest')
    
    # ── 3. Isolation Forest scoring ──
    if_score = 0.0
    if_record = {
        'duration':     record.get('duration'),
        'packets_sent': record.get('packets_sent'),
        'bytes_sent':   record.get('bytes_sent'),
    }
    if any(v is not None for v in if_record.values()):
        raw_if = if_score_record(if_record)
        if raw_if is not None:
            if_score = raw_if
            if if_score >= 0.6 and 'Isolation Forest' not in reasons:
                reasons.append('Isolation Forest')
    
    # ── 4. Combine with weights ──
    # RF=40%, IF=35%, Pattern=25%
    hybrid = round(
        0.40 * rf_score + 
        0.35 * if_score + 
        0.25 * pattern_score, 
        3
    )
    
    # ── 5. Apply correlated boost ──
    # If both RF and IF agree (both >= 0.6), increase confidence
    CORRELATED_THRESHOLD = 0.6
    CORRELATED_BOOST = 1.15
    
    if rf_score >= CORRELATED_THRESHOLD and if_score >= CORRELATED_THRESHOLD:
        hybrid = round(min(hybrid * CORRELATED_BOOST, 1.0), 3)
        if 'Correlated Detection' not in reasons:
            reasons.append('Correlated Detection')
    
    # ── 6. Return combined score ──
    return {
        'score':    round(min(hybrid, 1.0), 3),
        'if_score': round(if_score, 3),
        'rf_score': round(rf_score, 3),
        'types':    reasons or ['baseline'],
        'reason':   '; '.join(reasons) if reasons else 'No strong anomaly signal',
    }
```

### Example Walkthrough

**Log Entry:**
```
"Failed SSH login attempt from 192.168.1.50, 23 failed attempts"
Duration: 0.05s, Packets: 50, Bytes: 3200
```

**Scoring:**

| Algorithm | Score | Reason |
|-----------|-------|--------|
| **Pattern** | 0.95 | Matches "failed login" pattern |
| **Random Forest** | 0.72 | Learned: SSH failures + high attempts = threat |
| **Isolation Forest** | 0.68 | 50 packets unusual for short duration |
| **Weighted** | (0.40×0.72) + (0.35×0.68) + (0.25×0.95) = 0.761 |
| **Correlated Boost** | 0.761 × 1.15 = **0.875** | Both RF & IF ≥ 0.6 ✓ |

**Final: 0.875 = 🟠 HIGH SEVERITY**

---

## Algorithm 5: Severity Upgrade Rules

### Threshold Mapping

**File**: [api/views.py](api/views.py#L170)

```python
_SEVERITY_UPGRADE = [
    (0.9,   'CRITICAL'),      # Score >= 0.90
    (0.75,  'HIGH'),          # Score >= 0.75
    (0.45,  'MEDIUM'),        # Score >= 0.45
    (0.15,  'LOW'),           # Score >= 0.15
    (0.0,   'INFORMATIONAL'), # Score >= 0.0
]
```

### Example

```
If hybrid_score = 0.88
→ 0.88 >= 0.75 → Severity = HIGH 🟠
→ Create Anomaly record
→ Alert to dashboard
```

---

## Real-Time Scoring Pipeline

### Data Flow

**File**: [api/views.py](api/views.py#L1820)

```python
@csrf_exempt
@require_http_methods(["POST"])
def create_log(request):
    """Create a new log entry and run full anomaly detection"""
    
    # Step 1: Parse incoming log
    data = json.loads(request.body)
    msg     = data.get('message', '')
    level   = data.get('level', 'INFO')
    source  = data.get('source', '')
    
    # Step 2: Normalize fields
    parsed  = parse_message(msg)
    etype   = normalize_event_type(msg, '', level)
    sev     = normalize_severity(msg, level, '')
    
    # Step 3: Extract numeric features
    duration    = data.get('duration')
    packets_sent = data.get('packets_sent')
    bytes_sent   = data.get('bytes_sent')
    
    # Step 4: Save to database
    log = Log.objects.create(
        source=source,
        message=msg,
        level=level,
        event_type=etype,
        severity=sev,
        duration=duration,
        packets_sent=packets_sent,
        bytes_sent=bytes_sent,
    )
    
    # Step 5: Run hybrid scoring
    result = score_log_anomaly(
        log.message or '', 
        log.level, 
        log.source, 
        record={
            'duration': log.duration,
            'packets_sent': log.packets_sent,
            'bytes_sent': log.bytes_sent,
        }
    )
    
    # Step 6: Save scores back to database
    log.anomaly_score = result['score']
    log.if_score      = result['if_score']
    log.rf_score      = result['rf_score']
    log.save(update_fields=['anomaly_score', 'if_score', 'rf_score'])
    
    # Step 7: Create Anomaly record if score >= threshold
    ANOMALY_THRESHOLD = 0.45
    anomaly_detected = False
    
    if result['score'] >= ANOMALY_THRESHOLD:
        Anomaly.objects.update_or_create(
            log=log,
            defaults={
                'anomaly_type': result['types'][0],
                'score':        result['score'],
                'details':      result['reason'],
            }
        )
        anomaly_detected = True
    
    return JsonResponse({
        'status': 'saved',
        'id': log.id,
        'anomaly_detected': anomaly_detected,
        'anomaly_score': result['score'],
        'if_score': result['if_score'],
        'rf_score': result['rf_score'],
        'reason': result['reason'],
    })
```

---

## Configuration Parameters

**File**: [api/config.py](api/config.py)

```python
# Hybrid scorer weights
RF_WEIGHT      = 0.40   # Random Forest: 40%
IF_WEIGHT      = 0.35   # Isolation Forest: 35%
PATTERN_WEIGHT = 0.25   # Pattern Rules: 25%

# Correlated detection boost
CORRELATED_BOOST      = 1.15  # Multiply by 1.15 if both models agree
CORRELATED_THRESHOLD  = 0.6   # Both must be >= 0.6

# Severity thresholds
CRITICAL_SCORE = 0.90        # >= 0.90 = CRITICAL
HIGH_SCORE     = 0.75        # >= 0.75 = HIGH
MEDIUM_SCORE   = 0.45        # >= 0.45 = MEDIUM
ANOMALY_THRESHOLD = 0.45     # Minimum to create Anomaly record

# ML training
IF_CONTAMINATION  = 0.05     # Expect 5% anomalies
IF_N_ESTIMATORS   = 100      # 100 isolation trees
RF_N_ESTIMATORS   = 100      # 100 decision trees
TRAIN_LABEL_THRESHOLD = 0.45 # Label as threat if score >= 0.45
```

---

## Summary

| Algorithm | Type | Input | Output | Strength |
|-----------|------|-------|--------|----------|
| **Isolation Forest** | Unsupervised | Network features (duration, packets, bytes) | 0.0-1.0 anomaly score | Finds unknown attacks |
| **Random Forest** | Supervised | 7 features (event type, severity, etc.) | Probability threat | Uses labeled training data |
| **Pattern Rules** | Rule-based | Raw log message | 0.0-1.0 pattern match | Catches known signatures |
| **Hybrid Combo** | Ensemble | All three signals | 0.0-1.0 final score | Best overall accuracy |

### When Each Works Best

- **Isolation Forest**: New/zero-day attacks (unusual patterns)
- **Random Forest**: Known attacks from UNSW-NB15 dataset
- **Pattern Rules**: SQL injection, XSS, brute force (string patterns)
- **Hybrid**: Combines for accuracy + coverage + robustness

---

## Files to Reference

- **Anomaly Detection**: [anomaly_detection.py](anomaly_detection.py)
- **Model Training**: [api/ai_model.py](api/ai_model.py)
- **Scoring Logic**: [api/views.py](api/views.py#L900) (score_log_anomaly function)
- **Configuration**: [api/config.py](api/config.py)
- **Services**: [api/services.py](api/services.py) (dashboard stats)
