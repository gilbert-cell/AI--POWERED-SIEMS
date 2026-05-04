import joblib
import numpy as np
import pandas as pd
import os
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_PATH = BASE_DIR / "model.pkl"
IF_MODEL_PATH = BASE_DIR / "isolation_forest.pkl"
IF_SCALER_PATH = BASE_DIR / "isolation_forest_scaler.pkl"
IF_SCORE_BOUNDS_PATH = BASE_DIR / "isolation_forest_bounds.pkl"

# ── DB connection (SQLAlchemy) ────────────────────────────────────────────────
def _get_engine():
    """Build SQLAlchemy engine from Django settings / env vars."""
    from sqlalchemy import create_engine
    from urllib.parse import quote_plus
    # Prefer DATABASE_URL (Render), fall back to individual env vars
    url = os.environ.get('DATABASE_URL')
    if not url:
        name = os.environ.get('DB_NAME', 'siem_db')
        user = os.environ.get('DB_USER', 'grace')
        pwd  = quote_plus(os.environ.get('DB_PASSWORD', ''))
        host = os.environ.get('DB_HOST', 'localhost')
        port = os.environ.get('DB_PORT', '5432')
        url  = f'postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}'
    # Render uses postgres:// — SQLAlchemy needs postgresql://
    url = url.replace('postgres://', 'postgresql+psycopg2://', 1)
    return create_engine(url)


def _load_db_dataframe(limit: int = None) -> pd.DataFrame:
    """
    Load api_log rows from PostgreSQL into a DataFrame.
    Encodes categorical columns to numeric for ML.
    """
    engine = _get_engine()
    q = 'SELECT duration, packets_sent, bytes_sent, port, anomaly_score, if_score, rf_score, severity, event_type, source FROM api_log'
    if limit:
        q += f' ORDER BY id DESC LIMIT {limit}'
    with engine.connect() as conn:
        df = pd.read_sql(q, conn)

    # Fill nulls
    df['port'] = df['port'].fillna(0)
    df[['duration', 'packets_sent', 'bytes_sent']] = df[['duration', 'packets_sent', 'bytes_sent']].fillna(0)

    # Encode categoricals
    for col in ('severity', 'event_type', 'source'):
        df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    return df


# ── Isolation Forest features (numeric only) ─────────────────────────────────
IF_FEATURES = ['duration', 'packets_sent', 'bytes_sent', 'port']

# ── Legacy CSV path (kept for fallback only) ─────────────────────────────────
def get_dataset_path(filename: str = 'UNSW_NB15_training-set.csv') -> Path:
    return DATA_DIR / filename


def train_model(csv_filename: str = None) -> dict:
    """Train Random Forest from PostgreSQL api_log table."""
    df = _load_db_dataframe()
    if len(df) < 10:
        raise ValueError('Not enough data in api_log to train. Load logs first.')

    # Label: anomaly_score >= 0.45 = threat
    df['label'] = (df['anomaly_score'] >= 0.45).astype(int)
    feature_cols = ['duration', 'packets_sent', 'bytes_sent', 'port', 'severity', 'event_type', 'source']
    X = df[feature_cols]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
    model.fit(X_train, y_train)

    artifact = {'model': model, 'columns': feature_cols}
    joblib.dump(artifact, MODEL_PATH)
    accuracy = model.score(X_test, y_test)
    return {'model_path': str(MODEL_PATH), 'accuracy': float(accuracy), 'feature_count': len(feature_cols)}


def train_hybrid_models(csv_filename: str = "UNSW_NB15_training-set.csv") -> dict:
    """Train both the supervised Random Forest model and the unsupervised Isolation Forest model."""
    rf_stats = train_model(csv_filename=csv_filename)
    if_stats = train_isolation_forest(csv_filename=csv_filename)

    return {
        "trained_models": ["random_forest", "isolation_forest"],
        "rf_model_path": rf_stats["model_path"],
        "rf_accuracy": rf_stats["accuracy"],
        "rf_feature_count": rf_stats["feature_count"],
        "if_model_path": if_stats["model_path"],
        "if_feature_count": if_stats["feature_count"],
        "if_training_samples": if_stats["training_samples"],
    }


def load_model_artifact() -> dict | None:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None


def preview_dataset(csv_filename: str = None, rows: int = 20) -> dict:
    """Preview api_log data from PostgreSQL."""
    engine = _get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(f'SELECT * FROM api_log ORDER BY id DESC LIMIT {rows}', conn)
    total = pd.read_sql('SELECT COUNT(*) AS c FROM api_log', engine).iloc[0]['c']
    return {
        'dataset': 'PostgreSQL:api_log',
        'row_count': int(total),
        'columns': df.columns.tolist(),
        'sample_rows': df.fillna('').astype(str).to_dict(orient='records'),
    }


def load_dataset_to_logs(csv_filename: str = "UNSW_NB15_training-set.csv", max_rows: int = 100) -> dict:
    csv_path = get_dataset_path(csv_filename)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. Place UNSW_NB15_training-set.csv under backend/data/."
        )

    from .models import Log, Anomaly

    df = pd.read_csv(csv_path, low_memory=False)
    # Sample randomly from the entire dataset to get a good mix of normal and attack records
    rows_to_load = df.sample(n=min(max_rows, len(df)), random_state=42)
    loaded = 0
    false_positives_count = 0
    true_positives_count = 0

    # Map attack categories to threat score
    ATTACK_CAT_SCORES = {
        'Normal': 0.0,
        'Analysis': 0.60,
        'Fuzzers': 0.65,
        'Reconnaissance': 0.70,
        'Generic': 0.80,
        'DoS': 0.85,
        'Exploits': 0.90,
        'Backdoor': 0.95,
        'Shellcode': 0.95,
        'Worms': 0.95,
    }

    for _, row in rows_to_load.iterrows():
        attack_cat = str(row.get("attack_cat", "Normal")).strip()
        proto   = str(row.get("proto",    "-")).strip()
        service = str(row.get("service",  "-")).strip()
        state   = str(row.get("state",    "-")).strip()
        dur     = float(row.get('dur',   0) or 0)
        spkts   = int(row.get('spkts',   0) or 0)
        sbytes  = int(row.get('sbytes',  0) or 0)

        # Use attack category as source; service field is often '-' in UNSW data.
        raw_cat = attack_cat.lower()
        source = {
            'exploits': 'ids-system', 'backdoor': 'ids-system', 'shellcode': 'ids-system',
            'worms': 'network-monitor', 'reconnaissance': 'network-monitor',
            'dos': 'firewall', 'fuzzers': 'web-server', 'generic': 'network-monitor',
            'analysis': 'ids-system', 'normal': 'auth-service',
        }.get(raw_cat, proto if proto not in ('-', '') else 'network-monitor')

        message = (
            f"Attack Category: {attack_cat} | Protocol: {proto} | Service: {service} | "
            f"State: {state} | Duration: {dur} | "
            f"Packets sent: {spkts} | Bytes sent: {sbytes}"
        )

        true_label = int(row.get("label", 0))
        level = "CRITICAL" if attack_cat != "Normal" else "INFO"

        # Normalize attack category and event type
        from .views import normalize_event_type, normalize_severity, normalize_attack_category
        etype = normalize_event_type(message, attack_cat, level)
        sev   = normalize_severity(message, level, attack_cat)
        cat   = normalize_attack_category(etype, attack_cat)

        log = Log.objects.create(
            source          = source,
            message         = message,
            level           = level,
            event_type      = etype,
            severity        = sev,
            attack_category = cat,
            protocol        = proto,
            service         = service if service != '-' else '',
            state           = state   if state   != '-' else '',
            duration        = dur,
            packets_sent    = spkts,
            bytes_sent      = sbytes,
        )

        # Get anomaly score based on attack category
        score = ATTACK_CAT_SCORES.get(attack_cat, 0.0)
        
        # Only create Anomaly if score is significant (model detected something)
        if score >= 0.45:
            # Determine if this is a false positive:
            # False positive = Model predicted attack (score >= 0.45) but true label is 0 (Normal)
            is_false_positive = true_label == 0
            
            status = 'false_positive' if is_false_positive else 'confirmed'
            
            anomaly, _ = Anomaly.objects.update_or_create(
                log=log,
                defaults={
                    'anomaly_type': attack_cat,
                    'score': score,
                    'details': f'Attack category detected: {attack_cat} (label={true_label})',
                    'status': status,
                }
            )

            if is_false_positive:
                false_positives_count += 1
            else:
                true_positives_count += 1

        loaded += 1

    return {
        "loaded_logs": loaded,
        "max_rows": max_rows,
        "dataset": csv_filename,
        "anomalies_created": true_positives_count + false_positives_count,
        "false_positives": false_positives_count,
        "true_positives": true_positives_count,
        "false_positive_rate": round(false_positives_count / (true_positives_count + false_positives_count) * 100, 2) if (true_positives_count + false_positives_count) > 0 else 0,
    }


def train_siem_model() -> dict:
    """Train a lightweight model on SIEM realtime log features for fast inference."""
    EVENT_TYPE_MAP = {
        'Login Failed': 1, 'Brute Force': 2, 'Port Scan': 3, 'Privilege Escalation': 4,
        'SQL Injection': 5, 'XSS Attack': 6, 'DDoS Attack': 7, 'Malware Activity': 8,
        'Firewall Block': 9, 'Login Success': 10, 'File Access': 11, 'Config Change': 12,
    }
    SEVERITY_MAP = {'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3}
    SOURCE_MAP = {
        'firewall': 0, 'web-server': 1, 'database': 2, 'auth-service': 3,
        'network-monitor': 4, 'ids-system': 5, 'filesystem': 6, 'application': 7,
    }
    # Threat label: 1 = threat, 0 = benign
    THREAT_EVENTS = {
        'Login Failed', 'Brute Force', 'Port Scan', 'Privilege Escalation',
        'SQL Injection', 'XSS Attack', 'DDoS Attack', 'Malware Activity',
    }
    SEVERITY_THREAT = {'High', 'Critical'}

    rows = []
    for etype, ecode in EVENT_TYPE_MAP.items():
        for sev, scode in SEVERITY_MAP.items():
            for src, srcode in SOURCE_MAP.items():
                label = 1 if (etype in THREAT_EVENTS or sev in SEVERITY_THREAT) else 0
                rows.append({
                    'event_type_code': ecode,
                    'severity_code': scode,
                    'source_code': srcode,
                    'msg_len': 80 + scode * 20,
                    'label': label,
                })

    df = pd.DataFrame(rows)
    X = df.drop(columns=['label'])
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=50, n_jobs=-1, random_state=42)
    model.fit(X_train, y_train)

    artifact = {'model': model, 'columns': X.columns.tolist()}
    joblib.dump(artifact, MODEL_PATH)

    accuracy = model.score(X_test, y_test)
    return {
        'model_path': str(MODEL_PATH),
        'accuracy': float(accuracy),
        'feature_count': len(X.columns),
        'training_samples': len(df),
    }


# Features used by Isolation Forest (numeric columns from UNSW-NB15, excluding id/label)

def train_isolation_forest(csv_filename: str = None) -> dict:
    """Train Isolation Forest from PostgreSQL api_log numeric features."""
    df = _load_db_dataframe()
    if len(df) < 10:
        raise ValueError('Not enough data in api_log to train.')

    X = df[IF_FEATURES].fillna(0)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(X_scaled)

    raw_scores = model.decision_function(X_scaled)
    score_min, score_max = float(raw_scores.min()), float(raw_scores.max())

    joblib.dump({'model': model, 'columns': IF_FEATURES}, IF_MODEL_PATH)
    joblib.dump(scaler, IF_SCALER_PATH)
    joblib.dump({'min': score_min, 'max': score_max}, IF_SCORE_BOUNDS_PATH)

    return {
        'model_path': str(IF_MODEL_PATH),
        'feature_count': len(IF_FEATURES),
        'training_samples': len(X),
        'score_min': round(score_min, 4),
        'score_max': round(score_max, 4),
    }


def load_if_artifact() -> dict | None:
    if IF_MODEL_PATH.exists():
        return joblib.load(IF_MODEL_PATH)
    return None


# SIEM log features → DB-based IF feature mapping
def _siem_record_to_if_features(record: dict, columns: list) -> pd.DataFrame:
    """Map SIEM log fields to Isolation Forest feature vector (DB-based features)."""
    row = {
        'duration':     float(record.get('duration',     record.get('dur',    0)) or 0),
        'packets_sent': float(record.get('packets_sent', record.get('spkts',  0)) or 0),
        'bytes_sent':   float(record.get('bytes_sent',   record.get('sbytes', 0)) or 0),
        'port':         float(record.get('port', 0) or 0),
    }
    return pd.DataFrame([{c: row.get(c, 0.0) for c in columns}])


def if_score_record(record: dict) -> float | None:
    """Score a record with Isolation Forest.
    Returns anomaly score 0–1 (higher = more anomalous).
    Accepts UNSW-NB15 features OR SIEM log fields (duration, packets_sent, bytes_sent).
    """
    artifact = load_if_artifact()
    if artifact is None:
        return None
    try:
        model   = artifact['model']
        columns = artifact['columns']

        # Build feature vector
        df = _siem_record_to_if_features(record, columns)

        # Apply scaler if available
        if IF_SCALER_PATH.exists():
            scaler = joblib.load(IF_SCALER_PATH)
            X = scaler.transform(df)
        else:
            X = df.values

        raw = model.decision_function(X)[0]

        # Normalize to 0–1 using saved bounds (higher = more anomalous)
        if IF_SCORE_BOUNDS_PATH.exists():
            bounds = joblib.load(IF_SCORE_BOUNDS_PATH)
            s_min, s_max = bounds['min'], bounds['max']
            span = s_max - s_min
            normalized = 1.0 - (raw - s_min) / span if span > 0 else 0.5
        else:
            normalized = float(np.clip(0.5 - raw, 0.0, 1.0))

        return round(float(np.clip(normalized, 0.0, 1.0)), 2)
    except Exception:
        return None


def _compute_hybrid_score(rf_score: float, if_score: float, rf_weight: float = 0.6, if_weight: float = 0.4) -> float:
    return round(min(max(rf_weight * rf_score + if_weight * if_score, 0.0), 1.0), 3)


def _record_has_if_features(record: dict) -> bool:
    return any(key in record for key in [
        'duration', 'packets_sent', 'bytes_sent',
        'dur', 'spkts', 'sbytes', 'dpkts', 'dbytes',
    ])


def score_siem_log(duration: float, packets_sent: int, bytes_sent: int) -> float | None:
    """Convenience function: score a live SIEM log directly from its ML features."""
    return if_score_record({
        'duration': duration,
        'packets_sent': packets_sent,
        'bytes_sent': bytes_sent,
    })


def predict_record(record: dict) -> dict:
    if not isinstance(record, dict):
        raise ValueError('Input must be a JSON object with feature names and values.')

    artifact = load_model_artifact()
    if artifact is None:
        raise FileNotFoundError('No trained model found. Train via /api/ai/train/')

    model   = artifact['model']
    columns = artifact['columns']
    df = pd.DataFrame([{c: record.get(c, 0) for c in columns}])

    prediction = model.predict(df)
    response   = {'threat': int(prediction[0])}

    rf_score = None
    if hasattr(model, 'predict_proba'):
        proba    = model.predict_proba(df)[0].tolist()
        response['probabilities'] = proba
        rf_score = float(proba[1]) if len(proba) > 1 else float(proba[0])
    else:
        rf_score = float(prediction[0])

    response['rf_score'] = round(min(max(rf_score, 0.0), 1.0), 3)

    if _record_has_if_features(record):
        if_score = if_score_record(record)
        if if_score is not None:
            response['if_score']     = if_score
            response['hybrid_score'] = _compute_hybrid_score(response['rf_score'], if_score)

    return response
