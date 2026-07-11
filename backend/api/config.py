# api/config.py — single source of truth for all tunable constants

# ── Anomaly scoring ───────────────────────────────────────────────────────────
ANOMALY_THRESHOLD       = 0.45   # minimum score to create an Anomaly record
CRITICAL_SCORE          = 0.90   # score >= this → CRITICAL severity
HIGH_SCORE              = 0.75   # score >= this → HIGH severity
MEDIUM_SCORE            = 0.45   # score >= this → MEDIUM severity

# Hybrid scorer weights (RF + IF + pattern)
RF_WEIGHT               = 0.40
IF_WEIGHT               = 0.35
PATTERN_WEIGHT          = 0.25
CORRELATED_BOOST        = 1.15   # multiplier when both RF and IF agree >= 0.6
CORRELATED_THRESHOLD    = 0.6    # both models must exceed this to apply boost

# ── False positive definition ─────────────────────────────────────────────────
# Anomalies on LOW-severity logs are treated as false positives
FALSE_POSITIVE_SEVERITY = 'LOW'

# ── Pagination ────────────────────────────────────────────────────────────────
DEFAULT_PAGE_SIZE       = 20
MAX_PAGE_SIZE           = 1000

# ── ML training ──────────────────────────────────────────────────────────────
IF_CONTAMINATION        = 0.05
IF_N_ESTIMATORS         = 100
RF_N_ESTIMATORS         = 100
TRAIN_LABEL_THRESHOLD   = 0.45   # anomaly_score >= this → label=1 (threat)

# ── Dashboard / analytics ────────────────────────────────────────────────────
TREND_DAYS_DEFAULT      = 30
TOP_ALERTS_LIMIT        = 10
TOP_HOSTS_LIMIT         = 10
ANALYTICS_MAX_ROWS      = 5000

# ── Time range map (used by _apply_filters) ───────────────────────────────────
from datetime import timedelta
TIME_RANGE_MAP = {
    '30min': timedelta(minutes=30),
    '1h':    timedelta(hours=1),
    '24h':   timedelta(hours=24),
    '7d':    timedelta(days=7),
    '30d':   timedelta(days=30),
}

# ── Realtime pipeline ─────────────────────────────────────────────────────────
REALTIME_INTERVAL_DEFAULT = 2    # seconds between generated events
