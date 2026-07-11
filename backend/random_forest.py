"""
Random Forest threat classifier trained on UNSW-NB15 dataset.
Saves model + scaler to models/ for use by the SIEM pipeline.

Pipeline:
  Logs → Feature Extraction → Isolation Forest → anomaly score
       → Random Forest → Threat Decision (0=Normal, 1=Attack)
"""

import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

try:
    from imblearn.over_sampling import SMOTE
except ImportError:  # pragma: no cover - optional dependency fallback
    SMOTE = None

BASE_DIR   = Path(__file__).resolve().parent
DATA_PATH  = BASE_DIR / "data" / "UNSW_NB15_training-set.csv"
MODELS_DIR = BASE_DIR / "models"
RF_PATH    = MODELS_DIR / "random_forest.pkl"
IF_PATH    = BASE_DIR / "isolation_forest.pkl"
IF_SCALER  = BASE_DIR / "isolation_forest_scaler.pkl"
IF_BOUNDS  = BASE_DIR / "isolation_forest_bounds.pkl"

NUMERIC_FEATURES = ['dur', 'spkts', 'dpkts', 'sbytes', 'dbytes', 'rate', 'sttl']
CATEGORICAL_FEATURES = ['proto', 'service', 'state']
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def _remove_iqr_outliers(df: pd.DataFrame, columns: list[str], factor: float = 3.0) -> pd.DataFrame:
    """Remove invalid extreme numeric rows while keeping legitimate attack variation."""
    mask = pd.Series(True, index=df.index)
    for col in columns:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        lower = q1 - factor * iqr
        upper = q3 + factor * iqr
        mask &= df[col].between(lower, upper)
    return df.loc[mask].copy()


def _random_oversample(X: np.ndarray, y: pd.Series, random_state: int = 42):
    """Fallback class balancing when imbalanced-learn/SMOTE is unavailable."""
    rng = np.random.default_rng(random_state)
    y_arr = np.asarray(y)
    classes, counts = np.unique(y_arr, return_counts=True)
    max_count = counts.max()
    X_parts = [X]
    y_parts = [y_arr]

    for cls, count in zip(classes, counts):
        if count == max_count:
            continue
        idx = np.where(y_arr == cls)[0]
        extra_idx = rng.choice(idx, size=max_count - count, replace=True)
        X_parts.append(X[extra_idx])
        y_parts.append(y_arr[extra_idx])

    return np.vstack(X_parts), np.concatenate(y_parts)


def preprocess_dataset(df: pd.DataFrame):
    """
    Clean and prepare UNSW-NB15 records for SIEM model training.

    Steps: duplicate removal, irrelevant-column exclusion, missing-value handling,
    categorical encoding, numeric standardization, outlier filtering, split, and
    class balancing.
    """
    initial_rows = len(df)
    df = df.drop_duplicates().copy()
    after_duplicates = len(df)

    required = FEATURES + ['label']
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df[required].copy()
    for col in NUMERIC_FEATURES + ['label']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].astype(str).replace({'nan': np.nan, '-': np.nan, '': np.nan})

    df = df.dropna(subset=['label'])
    df = _remove_iqr_outliers(df, NUMERIC_FEATURES)
    after_outliers = len(df)

    X = df[FEATURES]
    y = df['label'].astype(int)

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler()),
            ]), NUMERIC_FEATURES),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)),
            ]), CATEGORICAL_FEATURES),
        ],
        remainder='drop',
        verbose_feature_names_out=False,
    )

    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)

    report = {
        'initial_rows': initial_rows,
        'duplicates_removed': initial_rows - after_duplicates,
        'outliers_removed': after_duplicates - after_outliers,
        'training_rows_before_balance': len(X_train),
        'test_rows': len(X_test),
        'features': FEATURES,
        'numeric_features': NUMERIC_FEATURES,
        'categorical_features': CATEGORICAL_FEATURES,
        'balancing': 'SMOTE' if SMOTE else 'random_oversampling_fallback',
    }
    return X_train, X_test, y_train, y_test, preprocessor, report

print("=" * 60)
print("RANDOM FOREST — SIEM THREAT CLASSIFICATION")
print("=" * 60)

# ── Load dataset ─────────────────────────────────────────────
df = pd.read_csv(DATA_PATH, low_memory=False)
print(f"Dataset loaded: {len(df):,} rows")

X_train, X_test, y_train, y_test, preprocessor, preprocess_report = preprocess_dataset(df)
print("\nPreprocessing complete:")
for key, value in preprocess_report.items():
    print(f"  {key}: {value}")

# ── Add Isolation Forest anomaly score as extra feature ───────
print("\nComputing Isolation Forest anomaly scores...")
if_model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42, n_jobs=-1)
if_model.fit(X_train)

raw_train_scores = if_model.decision_function(X_train)
raw_test_scores = if_model.decision_function(X_test)
raw_scores = np.concatenate([raw_train_scores, raw_test_scores])
score_min, score_max = float(raw_scores.min()), float(raw_scores.max())
span = score_max - score_min
train_if_scores = 1.0 - (raw_train_scores - score_min) / span if span > 0 else np.full(len(raw_train_scores), 0.5)
test_if_scores = 1.0 - (raw_test_scores - score_min) / span if span > 0 else np.full(len(raw_test_scores), 0.5)
train_if_scores = np.clip(train_if_scores, 0.0, 1.0).reshape(-1, 1)
test_if_scores = np.clip(test_if_scores, 0.0, 1.0).reshape(-1, 1)

# Combine scaled features + IF anomaly score
X_train_combined = np.hstack([X_train, train_if_scores])
X_test_combined = np.hstack([X_test, test_if_scores])
feature_names = FEATURES + ['if_anomaly_score']

# ── Balance classes after split to keep evaluation data untouched ────────────
if SMOTE:
    X_train_balanced, y_train_balanced = SMOTE(random_state=42).fit_resample(X_train_combined, y_train)
else:
    X_train_balanced, y_train_balanced = _random_oversample(X_train_combined, y_train)
print(f"Balanced training rows: {len(X_train_balanced):,}")

# ── Train Random Forest ───────────────────────────────────────
print("\nTraining Random Forest...")
rf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
rf.fit(X_train_balanced, y_train_balanced)
print("✅ Random Forest trained")

# ── Evaluate ──────────────────────────────────────────────────
y_pred = rf.predict(X_test_combined)
acc = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {acc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Normal', 'Attack']))

# ── Save models ───────────────────────────────────────────────
MODELS_DIR.mkdir(exist_ok=True)

joblib.dump({
    'model': rf,
    'preprocessor': preprocessor,
    'scaler': preprocessor,
    'columns': feature_names,
    'raw_features': FEATURES,
    'numeric_features': NUMERIC_FEATURES,
    'categorical_features': CATEGORICAL_FEATURES,
    'preprocessing_report': preprocess_report,
}, RF_PATH)
joblib.dump({'model': if_model, 'columns': FEATURES}, IF_PATH)
joblib.dump(preprocessor, IF_SCALER)
joblib.dump({'min': score_min, 'max': score_max}, IF_BOUNDS)

print(f"\n✅ Models saved to {MODELS_DIR}/")
print(f"   random_forest.pkl  — RF classifier + scaler + feature names")
print(f"   isolation_forest.pkl, isolation_forest_scaler.pkl, isolation_forest_bounds.pkl")


# ── Inference helper ──────────────────────────────────────────
def predict(record: dict) -> dict:
    """
    Score a single log record.
    record keys: dur, spkts, dpkts, sbytes, dbytes, rate, sttl, proto, service, state
    Returns: { threat: 0|1, rf_score: float, if_score: float, hybrid_score: float }
    """
    artifact = joblib.load(RF_PATH)
    rf_model = artifact['model']
    pre = artifact.get('preprocessor') or artifact['scaler']
    raw_features = artifact.get('raw_features', FEATURES)

    row = {f: record.get(f, 0) for f in raw_features}
    for cat in CATEGORICAL_FEATURES:
        row.setdefault(cat, '-')
    X_base = pre.transform(pd.DataFrame([row], columns=raw_features))

    if_artifact = joblib.load(IF_PATH)
    bounds = joblib.load(IF_BOUNDS)
    raw = if_artifact['model'].decision_function(X_base)[0]
    span = bounds['max'] - bounds['min']
    if_s = float(np.clip(1.0 - (raw - bounds['min']) / span if span > 0 else 0.5, 0.0, 1.0))

    X_full = np.hstack([X_base, [[if_s]]])
    pred  = int(rf_model.predict(X_full)[0])
    proba = rf_model.predict_proba(X_full)[0]
    rf_s  = round(float(proba[1]), 3)

    return {
        'threat':       pred,
        'rf_score':     rf_s,
        'if_score':     round(if_s, 3),
        'hybrid_score': round(0.6 * rf_s + 0.4 * if_s, 3),
    }
