"""
Improved Anomaly Detection Model
Uses Isolation Forest with proper feature scaling and numeric columns only
"""
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATASET_PATH = DATA_DIR / "UNSW_NB15_training-set.csv"


def detect_anomalies(csv_path=None, contamination=0.05):
    """
    Detect anomalies using Isolation Forest with feature scaling
    
    Args:
        csv_path: Path to the dataset CSV file
        contamination: Expected proportion of anomalies (0.05 = 5%)
    
    Returns:
        dict with anomaly detection results
    """
    if csv_path is None:
        csv_path = DATASET_PATH
    
    if not Path(csv_path).exists():
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. "
            f"Place UNSW_NB15_training-set.csv under backend/data/"
        )
    
    # Load data
    print(f"Loading dataset from {csv_path}...")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Loaded {len(df)} records")
    
    # Keep numeric columns only
    X = df.select_dtypes(include=['int64', 'float64'])
    print(f"Using {len(X.columns)} numeric features: {list(X.columns)[:5]}...")
    
    if len(X.columns) == 0:
        raise ValueError("No numeric columns found in dataset")
    
    # Handle missing values
    X = X.fillna(X.mean())
    
    # Scale data
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest model
    print(f"Training Isolation Forest with contamination={contamination}...")
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    
    predictions = model.fit_predict(X_scaled)
    
    # Get anomaly scores (-1 = anomaly, 1 = normal)
    anomaly_scores = model.score_samples(X_scaled)
    
    # Count results
    anomalies = (predictions == -1).sum()
    normal = (predictions == 1).sum()
    
    # Add predictions to dataframe
    df['anomaly'] = predictions
    df['anomaly_score'] = anomaly_scores
    
    results = {
        'total_records': len(df),
        'normal_records': int(normal),
        'anomaly_records': int(anomalies),
        'anomaly_percentage': round((anomalies / len(df)) * 100, 2),
        'contamination': contamination,
        'numeric_features': len(X.columns),
        'feature_names': list(X.columns),
        'predictions': predictions.tolist(),
        'anomaly_scores': anomaly_scores.tolist()
    }
    
    # Find top anomalies
    top_anomalies_idx = anomaly_scores.argsort()[:10]
    results['top_anomalies'] = [
        {
            'index': int(idx),
            'score': float(anomaly_scores[idx]),
            'record': df.iloc[idx].to_dict() if 'label' in df.columns else None
        }
        for idx in top_anomalies_idx
    ]
    
    return results


def get_anomaly_statistics(csv_path=None):
    """Get statistics about anomalies with different contamination rates"""
    if csv_path is None:
        csv_path = DATASET_PATH
    
    stats = {}
    for contamination in [0.01, 0.05, 0.10, 0.15]:
        result = detect_anomalies(csv_path, contamination=contamination)
        stats[f'{int(contamination*100)}%'] = {
            'anomalies': result['anomaly_records'],
            'normal': result['normal_records'],
            'percentage': result['anomaly_percentage']
        }
    
    return stats


if __name__ == "__main__":
    print("=" * 60)
    print("IMPROVED ANOMALY DETECTION - ISOLATION FOREST")
    print("=" * 60)
    
    try:
        # Run with 5% contamination (default)
        result = detect_anomalies(contamination=0.05)
        
        print(f"\n✓ Detection Complete")
        print(f"  Total Records: {result['total_records']}")
        print(f"  Normal Records: {result['normal_records']}")
        print(f"  Anomaly Records: {result['anomaly_records']}")
        print(f"  Anomaly Percentage: {result['anomaly_percentage']}%")
        print(f"  Numeric Features Used: {result['numeric_features']}")
        
        print(f"\n📊 Top Anomalies:")
        for i, anomaly in enumerate(result['top_anomalies'][:5], 1):
            print(f"  {i}. Index {anomaly['index']}: Score {anomaly['score']:.4f}")
        
        print("\n" + "=" * 60)
        print("Comparison of Different Contamination Rates:")
        print("=" * 60)
        
        stats = get_anomaly_statistics()
        for rate, data in stats.items():
            print(f"{rate} contamination: {data['anomalies']} anomalies ({data['percentage']}%)")
        
    except Exception as e:
        print(f"✗ Error: {e}")
