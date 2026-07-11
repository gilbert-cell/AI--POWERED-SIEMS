"""Preprocess SIEM logs and retrain Isolation Forest and Random Forest models.

This command:
- Loads `api.Log` rows from the database
- Cleans and encodes features
- Saves a CSV snapshot to `backend/data/siem_live_dataset.csv`
- Trains a RandomForestClassifier (supervised) using pseudo-labels from anomaly_score
- Trains an IsolationForest (unsupervised) on numeric features
- Saves model artifacts to the same paths used by `api.ai_model`

Usage:
    python manage.py preprocess_train --min-rows 100 --contamination 0.05

Notes:
- Supervised labels are derived from `anomaly_score >= 0.45` by default (pseudo-labeling).
- Retraining on real logs without ground truth may produce noisy models; consider labeling or using known datasets for supervised training.
"""
from django.core.management.base import BaseCommand
import pandas as pd
import joblib
import os
from pathlib import Path

from api.ai_model import MODEL_PATH, IF_MODEL_PATH, IF_SCALER_PATH, IF_SCORE_BOUNDS_PATH

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split


def _df_from_logs(limit=None):
    from api.models import Log
    qs = Log.objects.all().order_by('-timestamp')
    if limit:
        qs = qs[:limit]
    rows = []
    for l in qs:
        rows.append({
            'id': l.id,
            'timestamp': l.timestamp,
            'duration': l.duration or 0.0,
            'packets_sent': int(l.packets_sent or 0),
            'bytes_sent': int(l.bytes_sent or 0),
            'port': int(l.port or 0),
            'severity': (l.severity or '').upper(),
            'event_type': (l.event_type or '').upper(),
            'source': (l.source or '').lower(),
            'anomaly_score': float(l.anomaly_score or 0.0),
        })
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)


class Command(BaseCommand):
    help = 'Preprocess collected logs and retrain RandomForest + IsolationForest models.'

    def add_arguments(self, parser):
        parser.add_argument('--min-rows', type=int, default=100, help='Minimum rows required to train')
        parser.add_argument('--limit', type=int, default=None, help='Max number of logs to use (most recent)')
        parser.add_argument('--contamination', type=float, default=0.05, help='IsolationForest contamination')

    def handle(self, *args, **options):
        min_rows = options['min_rows']
        limit = options['limit']
        contamination = options['contamination']

        self.stdout.write('→ Loading logs from database...')
        df = _df_from_logs(limit=limit)
        if df.empty or len(df) < min_rows:
            self.stdout.write(self.style.ERROR(f'Not enough rows to train: {len(df)} (need >= {min_rows})'))
            return

        # Basic cleaning
        df = df.drop_duplicates().fillna(0)

        # Save snapshot
        data_dir = Path(__file__).resolve().parents[3] / 'data'
        data_dir.mkdir(parents=True, exist_ok=True)
        csv_path = data_dir / 'siem_live_dataset.csv'
        df.to_csv(csv_path, index=False)
        self.stdout.write(self.style.SUCCESS(f'✓ Saved dataset snapshot to {csv_path} ({len(df)} rows)'))

        # Encode categoricals
        encoders = {}
        for col in ('severity', 'event_type', 'source'):
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

        # Features and labels
        feature_cols = ['duration', 'packets_sent', 'bytes_sent', 'port', 'severity', 'event_type', 'source']
        X = df[feature_cols].astype(float)
        # pseudo-labels from anomaly_score
        y = (df['anomaly_score'] >= 0.45).astype(int)

        # Train Random Forest
        self.stdout.write('→ Training RandomForestClassifier...')
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        rf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
        rf.fit(X_train, y_train)
        accuracy = rf.score(X_test, y_test)

        artifact = {'model': rf, 'columns': feature_cols}
        joblib.dump(artifact, MODEL_PATH)
        self.stdout.write(self.style.SUCCESS(f'✓ RandomForest saved to {MODEL_PATH} (accuracy={accuracy:.4f})'))

        # Train Isolation Forest on numeric features
        self.stdout.write('→ Training IsolationForest...')
        if_features = ['duration', 'packets_sent', 'bytes_sent', 'port']
        X_if = df[if_features].astype(float).fillna(0)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_if)
        if_model = IsolationForest(n_estimators=100, contamination=contamination, random_state=42, n_jobs=-1)
        if_model.fit(X_scaled)

        raw_scores = if_model.decision_function(X_scaled)
        bounds = {'min': float(raw_scores.min()), 'max': float(raw_scores.max())}

        joblib.dump({'model': if_model, 'columns': if_features}, IF_MODEL_PATH)
        joblib.dump(scaler, IF_SCALER_PATH)
        joblib.dump(bounds, IF_SCORE_BOUNDS_PATH)
        self.stdout.write(self.style.SUCCESS(f'✓ IsolationForest saved to {IF_MODEL_PATH} (samples={len(X_if)})'))

        self.stdout.write(self.style.SUCCESS('Retraining complete.'))
