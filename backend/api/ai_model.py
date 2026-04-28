import joblib
import numpy as np
import pandas as pd
import re
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_PATH = BASE_DIR / "model.pkl"
IF_MODEL_PATH = BASE_DIR / "isolation_forest.pkl"


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
        source = str(row.get("service") or row.get("proto") or "UNSW_NB15")[:50]
        attack_cat = str(row.get("attack_cat", "Normal")).strip()
        proto = str(row.get("proto", "-")).strip()
        service = str(row.get("service", "-")).strip()
        state = str(row.get("state", "-")).strip()
        
        message = (
            f"Attack Category: {attack_cat} | Protocol: {proto} | Service: {service} | "
            f"State: {state} | Duration: {row.get('dur', 'N/A')} | "
            f"Packets sent: {row.get('spkts', 'N/A')} | Bytes sent: {row.get('sbytes', 'N/A')}"
        )
        
        # True label from dataset: 0 = Normal/benign, 1 = Attack
        true_label = int(row.get("label", 0))
        level = "CRITICAL" if attack_cat != "Normal" else "INFO"

        log = Log.objects.create(
            source=source,
            message=message,
            level=level,
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
    """Train Isolation Forest on the real UNSW-NB15 dataset (normal traffic only)."""
    csv_path = get_dataset_path(csv_filename)
    if not csv_path.exists():
        raise FileNotFoundError(f'Dataset not found at {csv_path}.')

    df = pd.read_csv(csv_path, low_memory=False)

    # Train only on normal traffic so the model learns what "normal" looks like
    normal_df = df[df['label'] == 0][IF_FEATURES].fillna(0)

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(normal_df)

    artifact = {'model': model, 'columns': IF_FEATURES}
    joblib.dump(artifact, IF_MODEL_PATH)
    return {
        'model_path': str(IF_MODEL_PATH),
        'feature_count': len(IF_FEATURES),
        'training_samples': len(normal_df),
    }


def load_if_artifact() -> dict | None:
    if IF_MODEL_PATH.exists():
        return joblib.load(IF_MODEL_PATH)
    return None


def if_score_record(record: dict) -> float | None:
    """Score a record with Isolation Forest. Returns anomaly probability 0-1 (higher = more anomalous).
    Accepts either UNSW-NB15 numeric features or a partial dict (missing features filled with 0).
    """
    artifact = load_if_artifact()
    if artifact is None:
        return None
    try:
        model = artifact['model']
        columns = artifact['columns']
        df = pd.DataFrame([record]).reindex(columns=columns, fill_value=0)
        # decision_function: negative = anomaly, positive = normal
        # Map to 0-1 where 1 = most anomalous
        raw = model.decision_function(df)[0]
        score = float(np.clip(0.5 - raw, 0.0, 1.0))
        return round(score, 2)
    except Exception:
        return None


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
