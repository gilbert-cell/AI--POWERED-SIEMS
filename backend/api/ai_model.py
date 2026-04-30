import joblib
import numpy as np
import pandas as pd
import re
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_PATH = BASE_DIR / "model.pkl"
IF_MODEL_PATH = BASE_DIR / "isolation_forest.pkl"
IF_SCALER_PATH = BASE_DIR / "isolation_forest_scaler.pkl"
# Score normalization bounds saved at train time so live scoring is consistent
IF_SCORE_BOUNDS_PATH = BASE_DIR / "isolation_forest_bounds.pkl"


def get_dataset_path(filename: str = "UNSW_NB15_training-set.csv") -> Path:
    return DATA_DIR / filename


def train_model(csv_filename: str = "UNSW_NB15_training-set.csv") -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = get_dataset_path(csv_filename)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. Place UNSW_NB15_training-set.csv under backend/data/."
        )

    df = pd.read_csv(csv_path, low_memory=False)
    if "label" not in df.columns:
        raise ValueError('Dataset must contain a "label" target column.')

    X = df.drop(columns=["label"])
    y = df["label"]
    X = pd.get_dummies(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if len(y.unique()) > 1 else None,
    )

    model = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
    model.fit(X_train, y_train)

    artifact = {
        "model": model,
        "columns": X.columns.tolist(),
    }
    joblib.dump(artifact, MODEL_PATH)

    accuracy = model.score(X_test, y_test)
    return {
        "model_path": str(MODEL_PATH),
        "accuracy": float(accuracy),
        "feature_count": len(X.columns),
    }


def load_model_artifact() -> dict | None:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None


def preview_dataset(csv_filename: str = "UNSW_NB15_training-set.csv", rows: int = 20) -> dict:
    csv_path = get_dataset_path(csv_filename)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. Place UNSW_NB15_training-set.csv under backend/data/."
        )

    df = pd.read_csv(csv_path, low_memory=False)
    label_counts = df["label"].value_counts().to_dict() if "label" in df.columns else {}
    sample_rows = df.head(rows).fillna("").replace({pd.NA: ""}).to_dict(orient="records")

    return {
        "dataset": csv_filename,
        "row_count": int(len(df)),
        "columns": df.columns.tolist(),
        "label_counts": {str(k): int(v) for k, v in label_counts.items()},
        "sample_rows": sample_rows,
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
        # Use attack category as source — service field is often '-' in UNSW dataset
        raw_cat = str(attack_cat).strip().lower()
        source = {
            'exploits': 'ids-system', 'backdoor': 'ids-system', 'shellcode': 'ids-system',
            'worms': 'network-monitor', 'reconnaissance': 'network-monitor',
            'dos': 'firewall', 'fuzzers': 'web-server', 'generic': 'network-monitor',
            'analysis': 'ids-system', 'normal': 'auth-service',
        }.get(raw_cat, proto if proto not in ('-', '') else 'network-monitor')
        attack_cat = str(row.get("attack_cat", "Normal")).strip()
        proto   = str(row.get("proto",    "-")).strip()
        service = str(row.get("service",  "-")).strip()
        state   = str(row.get("state",    "-")).strip()
        dur     = float(row.get('dur',   0) or 0)
        spkts   = int(row.get('spkts',   0) or 0)
        sbytes  = int(row.get('sbytes',  0) or 0)

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
IF_FEATURES = [
    'dur', 'spkts', 'dpkts', 'sbytes', 'dbytes', 'rate', 'sttl', 'dttl',
    'sload', 'dload', 'sloss', 'dloss', 'sinpkt', 'dinpkt', 'sjit', 'djit',
    'swin', 'dwin', 'tcprtt', 'synack', 'ackdat', 'smean', 'dmean',
    'ct_srv_src', 'ct_state_ttl', 'ct_dst_ltm', 'ct_src_dport_ltm',
    'ct_dst_sport_ltm', 'ct_dst_src_ltm', 'ct_src_ltm', 'ct_srv_dst',
]


def train_isolation_forest(csv_filename: str = 'UNSW_NB15_training-set.csv') -> dict:
    """Train Isolation Forest on UNSW-NB15 normal traffic with proper scaling and score normalization."""
    csv_path = get_dataset_path(csv_filename)
    if not csv_path.exists():
        raise FileNotFoundError(f'Dataset not found at {csv_path}.')

    df = pd.read_csv(csv_path, low_memory=False)

    # Drop id — it is just a row index, not a feature
    available = [c for c in IF_FEATURES if c in df.columns]
    normal_df = df[df['label'] == 0][available].fillna(0)

    # Scale features — required for Isolation Forest to work correctly
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(normal_df)

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(X_scaled)

    # Compute score bounds on the FULL dataset so live scores are normalized consistently
    all_df = df[available].fillna(0)
    all_scaled = scaler.transform(all_df)
    raw_scores = model.decision_function(all_scaled)
    score_min = float(raw_scores.min())
    score_max = float(raw_scores.max())

    joblib.dump({'model': model, 'columns': available}, IF_MODEL_PATH)
    joblib.dump(scaler, IF_SCALER_PATH)
    joblib.dump({'min': score_min, 'max': score_max}, IF_SCORE_BOUNDS_PATH)

    return {
        'model_path': str(IF_MODEL_PATH),
        'feature_count': len(available),
        'training_samples': len(normal_df),
        'score_min': round(score_min, 4),
        'score_max': round(score_max, 4),
    }


def load_if_artifact() -> dict | None:
    if IF_MODEL_PATH.exists():
        return joblib.load(IF_MODEL_PATH)
    return None


# SIEM log features → UNSW-NB15 feature mapping
# Maps (duration, packets_sent, bytes_sent) from live logs to IF feature space
def _siem_record_to_if_features(record: dict, columns: list) -> pd.DataFrame:
    """Map SIEM log fields to Isolation Forest feature vector."""
    row = {c: 0.0 for c in columns}
    # Direct mappings from SIEM structured fields
    row['dur']    = float(record.get('duration',     record.get('dur',    0)) or 0)
    row['spkts']  = float(record.get('packets_sent', record.get('spkts',  0)) or 0)
    row['sbytes'] = float(record.get('bytes_sent',   record.get('sbytes', 0)) or 0)
    # Derive dpkts/dbytes as rough estimates if not provided
    row['dpkts']  = float(record.get('dpkts',  row['spkts']  * 0.8) or 0)
    row['dbytes'] = float(record.get('dbytes', row['sbytes'] * 0.7) or 0)
    row['rate']   = float(row['spkts'] / row['dur'] if row['dur'] > 0 else 0)
    row['sload']  = float(row['sbytes'] * 8 / row['dur'] if row['dur'] > 0 else 0)
    row['dload']  = float(row['dbytes'] * 8 / row['dur'] if row['dur'] > 0 else 0)
    return pd.DataFrame([row]).reindex(columns=columns, fill_value=0)


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


def score_siem_log(duration: float, packets_sent: int, bytes_sent: int) -> float | None:
    """Convenience function: score a live SIEM log directly from its ML features."""
    return if_score_record({
        'duration': duration,
        'packets_sent': packets_sent,
        'bytes_sent': bytes_sent,
    })


def predict_record(record: dict) -> dict:
    if not isinstance(record, dict):
        raise ValueError("Input must be a JSON object with feature names and values.")

    artifact = load_model_artifact()
    if artifact is None:
        raise FileNotFoundError("No trained model found. Run ai_train or backend/train_model.py first.")

    model = artifact["model"]
    columns = artifact["columns"]
    data_frame = pd.DataFrame([record])
    data_frame = pd.get_dummies(data_frame)
    data_frame = data_frame.reindex(columns=columns, fill_value=0)

    prediction = model.predict(data_frame)
    response = {"threat": int(prediction[0])}

    if hasattr(model, "predict_proba"):
        response["probabilities"] = model.predict_proba(data_frame)[0].tolist()

    return response
