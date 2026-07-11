

"""
Real-time SIEM log monitor.
Two parallel streams:
  1. Tails real Linux system logs (/var/log/*)
  2. Replays UNSW_NB15_training-set.csv rows at a configurable interval
Both send to the SIEM API with RF+IF hybrid threat scoring.
"""
import os
import re
import csv
import time
import random
import threading
import requests
import joblib
import numpy as np
from pathlib import Path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))
from log_formatter import format_log_line, clean_message_for_formatting

API_URL   = os.environ.get('SIEM_API_URL', 'http://localhost:8000/api/logs/create/')
DATASET   = Path(__file__).parent / 'data' / 'UNSW_NB15_training-set.csv'
BASE_DIR  = Path(__file__).parent

# ── Load models once at startup ───────────────────────────────────────────────
def _load(path):
    return joblib.load(path) if Path(path).exists() else None

_rf  = _load(BASE_DIR / 'models' / 'random_forest.pkl')
_if  = _load(BASE_DIR / 'isolation_forest.pkl')
_ifs = _load(BASE_DIR / 'isolation_forest_scaler.pkl')
_ifb = _load(BASE_DIR / 'isolation_forest_bounds.pkl')
print('[RF] Random Forest loaded ✅' if _rf else '[RF] No RF model — run random_forest.py first')


import pandas as pd
_NUMERIC_COLS = ['dur', 'spkts', 'dpkts', 'sbytes', 'dbytes', 'rate', 'sttl']
_CAT_COLS = ['proto', 'service', 'state']
_COLS = _NUMERIC_COLS + _CAT_COLS


def _score(dur, spkts, dpkts, sbytes, dbytes, rate, sttl, proto='-', service='-', state='-') -> dict:
    """Return rf_score, if_score, hybrid_score, threat for one log row."""
    if not _rf or not _if:
        return {}
    try:
        raw = {
            'dur': dur, 'spkts': spkts, 'dpkts': dpkts, 'sbytes': sbytes,
            'dbytes': dbytes, 'rate': rate, 'sttl': sttl,
            'proto': proto or '-', 'service': service or '-', 'state': state or '-',
        }
        raw_cols = _rf.get('raw_features') or _if.get('columns') or _COLS
        df = pd.DataFrame([{col: raw.get(col, 0) for col in raw_cols}], columns=raw_cols)
        X_sc = (_rf.get('preprocessor') or _rf['scaler']).transform(df)
        if_sc = _ifs.transform(df) if _ifs else X_sc
        raw     = _if['model'].decision_function(if_sc)[0]
        span    = (_ifb['max'] - _ifb['min']) if _ifb else 1
        if_s    = float(np.clip(1.0 - (raw - _ifb['min']) / span if span > 0 else 0.5, 0.0, 1.0))
        X_full  = np.hstack([X_sc, [[if_s]]])
        pred    = int(_rf['model'].predict(X_full)[0])
        rf_s    = round(float(_rf['model'].predict_proba(X_full)[0][1]), 3)
        return {'rf_score': rf_s, 'if_score': round(if_s, 3),
                'hybrid_score': round(0.6 * rf_s + 0.4 * if_s, 3), 'threat': pred}
    except Exception as e:
        return {}

# ── Linux log sources ─────────────────────────────────────────────────────────
LOG_SOURCES = [
    ('/var/log/auth.log',        'auth-service'),
    ('/var/log/syslog',          'system'),
    ('/var/log/kern.log',        'system'),
    ('/var/log/ufw.log',         'firewall'),
    ('/var/log/secure',          'ssh'),
    ('/var/log/audit/audit.log', 'file-system'),
]

_SKIP_RE  = re.compile(r'CRON\[\d+\].*session (opened|closed)|sysstat-collect|systemd-logind', re.I)
_SRC_RE   = re.compile(r'SRC=([\d.]+)')
_DST_RE   = re.compile(r'DST=([\d.]+)')
_DPT_RE   = re.compile(r'DPT=(\d+)')
_PROTO_RE = re.compile(r'PROTO=(\w+)')
_LEN_RE   = re.compile(r'\bLEN=(\d+)')
# SSH/auth.log patterns: "from 1.2.3.4 port 22" or "for user from 1.2.3.4"
_SSH_IP_RE = re.compile(r'from ([\d.]+)(?:\s+port\s+\d+)?')
_SSH_PORT_RE = re.compile(r'port (\d+)')

# Linux event → synthetic network features for IF scoring
_LINUX_FEATURES = {
    'failed password':        {'duration': 0.15, 'packets_sent': 5,  'bytes_sent': 300,  'protocol': 'tcp', 'service': 'ssh',  'port': 22,  'source_hint': 'ssh'},
    'authentication failure': {'duration': 0.12, 'packets_sent': 4,  'bytes_sent': 250,  'protocol': 'tcp', 'service': 'ssh',  'port': 22,  'source_hint': 'ssh'},
    'invalid user':           {'duration': 0.10, 'packets_sent': 4,  'bytes_sent': 220,  'protocol': 'tcp', 'service': 'ssh',  'port': 22,  'source_hint': 'ssh'},
    'accepted password':      {'duration': 0.20, 'packets_sent': 8,  'bytes_sent': 600,  'protocol': 'tcp', 'service': 'ssh',  'port': 22,  'source_hint': 'ssh'},
    'publickey':              {'duration': 0.20, 'packets_sent': 8,  'bytes_sent': 600,  'protocol': 'tcp', 'service': 'ssh',  'port': 22,  'source_hint': 'ssh'},
    'sudo:':                  {'duration': 0.05, 'packets_sent': 2,  'bytes_sent': 150,  'protocol': 'tcp', 'service': 'ssh',  'port': 22,  'source_hint': 'auth-service'},
    'ufw block':              {'duration': 0.01, 'packets_sent': 1,  'bytes_sent': 60,   'protocol': 'tcp', 'service': '-',    'port': 443, 'source_hint': 'firewall'},
    'ufw allow':              {'duration': 0.01, 'packets_sent': 1,  'bytes_sent': 60,   'protocol': 'tcp', 'service': '-',    'port': 443, 'source_hint': 'firewall'},
    'file access':            {'duration': 0.00, 'packets_sent': 0,  'bytes_sent': 0,    'protocol': 'tcp', 'service': '-',    'port': 0,   'source_hint': 'file-system'},
    'open file':              {'duration': 0.00, 'packets_sent': 0,  'bytes_sent': 0,    'protocol': 'tcp', 'service': '-',    'port': 0,   'source_hint': 'file-system'},
    'kernel panic':           {'duration': 0.00, 'packets_sent': 0,  'bytes_sent': 0,    'protocol': 'tcp', 'service': '-',    'port': 0,   'source_hint': 'system'},
    'segfault':               {'duration': 0.00, 'packets_sent': 0,  'bytes_sent': 0,    'protocol': 'tcp', 'service': '-',    'port': 0,   'source_hint': 'system'},
}

def _linux_features(body: str) -> dict:
    """Return synthetic network features for a Linux log line."""
    b = body.lower()
    for keyword, feats in _LINUX_FEATURES.items():
        if keyword in b:
            result = feats.copy()
            result.pop('source_hint', None)  # remove hint — used separately
            return result
    return {}

def _resolve_source(body: str, default_source: str) -> str:
    """Resolve the best matching source label from log body keywords."""
    b = body.lower()
    for keyword, feats in _LINUX_FEATURES.items():
        if keyword in b and 'source_hint' in feats:
            return feats['source_hint']
    return default_source

# ── UNSW-NB15 attack_cat → SIEM source mapping ────────────────────────────────
_CAT_SOURCE = {
    'exploits':      'ids-system',
    'backdoor':      'ids-system',
    'shellcode':     'ids-system',
    'analysis':      'ids-system',
    'worms':         'ids-system',
    'reconnaissance':'system',
    'dos':           'firewall',
    'fuzzers':       'web-server',
    'generic':       'firewall',
    'normal':        'auth-service',
}
# UNSW-NB15 attack category → Django log level
# Severity scale: INFORMATIONAL → LOW → MEDIUM → HIGH → CRITICAL
_CAT_LEVEL = {
    'normal':        'INFO',       # Informational — normal activity
    'analysis':      'WARNING',    # Medium        — suspicious investigation needed
    'fuzzers':       'WARNING',    # Medium        — suspicious activity
    'reconnaissance':'WARNING',    # Medium        — suspicious scan
    'generic':       'ERROR',      # High          — likely attack
    'dos':           'CRITICAL',   # High          — DoS attack
    'exploits':      'CRITICAL',   # Critical      — severe attack
    'backdoor':      'CRITICAL',   # Critical      — confirmed intrusion
    'shellcode':     'CRITICAL',   # Critical      — code execution
    'worms':         'CRITICAL',   # Critical      — self-propagating malware
}


def _linux_level(body: str) -> str:
    b = body.lower()
    if any(k in b for k in ['failed password', 'authentication failure', 'invalid user', 'ufw block', 'error', 'fail']):
        return 'ERROR'
    if any(k in b for k in ['warning', 'warn', 'sudo:', 'privilege']):
        return 'WARNING'
    if any(k in b for k in ['critical', 'panic', 'oom', 'segfault']):
        return 'CRITICAL'
    return 'INFO'


def _send(payload: dict) -> bool:
    try:
        r = requests.post(API_URL, json=payload, timeout=3)
        return r.status_code in (200, 201)
    except Exception:
        return False


def _print(icon: str, source: str, level: str, msg: str, ok: bool):
    print(f'{icon} [{source}] {level} — {msg[:90]}  API:{"✓" if ok else "✗"}')


# ── Stream 1: tail Linux log files ───────────────────────────────────────────
def _tail_file(path: str, source: str, stop: threading.Event):
    p = Path(path)
    if not p.exists():
        print(f'[SKIP] {path} not found')
        return
    with open(path, 'r', errors='replace') as f:
        f.seek(0, 2)
        print(f'[TAIL] {path} ({source})')
        while not stop.is_set():
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            line = line.strip()
            if not line or _SKIP_RE.search(line):
                continue
            # Clean prefixes to get just the message body
            body = clean_message_for_formatting(line)

            lvl  = _linux_level(body)
            
            # Format the message in ISO 8601 style (hostname + process + message)
            formatted_message = format_log_line(body, source)
            
            # Resolve source based on log content keywords
            resolved_source = _resolve_source(body, source)
            payload = {'message': formatted_message, 'level': lvl, 'source': resolved_source}

            # UFW-style fields
            src_m = _SRC_RE.search(body)
            dst_m = _DST_RE.search(body)
            dpt_m = _DPT_RE.search(body)
            pm    = _PROTO_RE.search(body)
            lm    = _LEN_RE.search(body)
            if src_m:   payload['src_ip']     = src_m.group(1)
            if dst_m:   payload['dst_ip']     = dst_m.group(1)
            if dpt_m:   payload['port']       = int(dpt_m.group(1))
            if pm:      payload['protocol']   = pm.group(1).lower()
            if lm:      payload['bytes_sent'] = int(lm.group(1))

            # SSH/auth.log: extract IP from "from 1.2.3.4 port 22"
            if 'src_ip' not in payload:
                ssh_m = _SSH_IP_RE.search(body)
                if ssh_m:
                    payload['src_ip'] = ssh_m.group(1)
            if 'port' not in payload:
                port_m = _SSH_PORT_RE.search(body)
                if port_m:
                    payload['port'] = int(port_m.group(1))

            # Enrich with synthetic network features so IF model can score Linux logs
            feats = _linux_features(body)
            for k in ('duration', 'packets_sent', 'bytes_sent', 'protocol', 'service', 'port'):
                if k in feats and k not in payload:
                    payload[k] = feats[k]

            ok   = _send(payload)
            # Severity icon based on 5-level scale
            # 🔵 Informational  🟢 Low  🟡 Medium  🟠 High  🔴 Critical
            icon = {
                'CRITICAL': '🔴🔴',
                'ERROR':    '🔴',
                'WARNING':  '🟡',
                'INFO':     '🟢',
            }.get(lvl, '🔵')
            _print(icon, resolved_source, lvl, body, ok)


# ── Stream 2: replay UNSW-NB15 dataset rows ──────────────────────────────────
def _stream_dataset(interval: float, stop: threading.Event):
    if not DATASET.exists():
        print(f'[SKIP] Dataset not found: {DATASET}')
        return

    print(f'[DATASET] Streaming {DATASET.name} → SIEM (interval={interval}s)')
    while not stop.is_set():
        with open(DATASET, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        random.shuffle(rows)          # randomise order each pass
        for row in rows:
            if stop.is_set():
                return

            cat     = str(row.get('attack_cat', 'Normal')).strip()
            proto   = str(row.get('proto',   '-')).strip()
            service = str(row.get('service', '-')).strip()
            state   = str(row.get('state',   '-')).strip()
            dur     = row.get('dur',    '0')
            spkts   = row.get('spkts',  '0')
            sbytes  = row.get('sbytes', '0')

            cat_lower = cat.lower()
            source    = _CAT_SOURCE.get(cat_lower, 'system')
            level     = _CAT_LEVEL.get(cat_lower, 'INFO')

            message = (
                f"UNSW-NB15 | Attack Category: {cat} | Protocol: {proto} | "
                f"Service: {service} | State: {state} | "
                f"Duration: {dur} | Packets: {spkts} | Bytes: {sbytes}"
            )
            
            # Format message with ISO 8601 timestamp, hostname, and process
            formatted_message = format_log_line(message, source, process_name='UNSW-NB15')

            payload = {
                'message':      formatted_message,
                'level':        level,
                'source':       source,
                'dataset_type': 'network',
                'protocol':     proto if proto != '-' else '',
                'service':      service if service != '-' else '',
                'state':        state   if state   != '-' else '',
                'duration':     float(dur)    if dur    else None,
                'packets_sent': int(float(spkts))  if spkts  else None,
                'bytes_sent':   int(float(sbytes)) if sbytes else None,
                'attack_category': cat,
            }

            scores = _score(
                float(row.get('dur',    0) or 0),
                int(float(row.get('spkts',  0) or 0)),
                int(float(row.get('dpkts',  0) or 0)),
                int(float(row.get('sbytes', 0) or 0)),
                int(float(row.get('dbytes', 0) or 0)),
                float(row.get('rate',   0) or 0),
                int(float(row.get('sttl',   0) or 0)),
                proto,
                service,
                state,
            )
            if scores:
                payload.update(scores)
                if scores.get('threat') == 1 and scores.get('hybrid_score', 0) >= 0.7 and level == 'INFO':
                    payload['level'] = level = 'WARNING'

            ok   = _send(payload)
            # Severity icon based on 5-level scale
            icon = {
                'CRITICAL': '🔴🔴',
                'ERROR':    '🔴',
                'WARNING':  '🟡',
                'INFO':     '🟢',
            }.get(level, '🔵')
            tag  = f" 🎯{scores['hybrid_score']}" if scores else ''
            _print(icon, source, level, message + tag, ok)
            time.sleep(interval)


# ── Entry point ───────────────────────────────────────────────────────────────
def monitor(duration: int = None, dataset_interval: float = 2.0):
    stop = threading.Event()

    threads = [
        threading.Thread(target=_tail_file, args=(path, src, stop), daemon=True)
        for path, src in LOG_SOURCES
    ]
    threads.append(
        threading.Thread(target=_stream_dataset, args=(dataset_interval, stop), daemon=True)
    )

    print('=' * 80)
    print('🔍 REAL-TIME SIEM MONITOR  (Linux logs + UNSW-NB15 dataset)')
    print(f'   API:             {API_URL}')
    print(f'   Dataset interval: {dataset_interval}s per row')
    print('   Press Ctrl+C to stop')
    print('=' * 80)

    for t in threads:
        t.start()

    try:
        elapsed = 0
        while True:
            time.sleep(1)
            elapsed += 1
            if duration and elapsed >= duration:
                break
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        print('\n[STOPPED]')


if __name__ == '__main__':
    import sys
    duration = None
    dataset_interval = 2.0
    for arg in sys.argv[1:]:
        if arg.startswith('--duration='):
            duration = int(arg.split('=')[1])
        elif arg.startswith('--api='):
            API_URL = arg.split('=')[1]
        elif arg.startswith('--interval='):
            _iv = float(arg.split('=')[1])
            if _iv != _iv or _iv <= 0:  # NaN check and positive guard
                print('--interval must be a positive number')
                sys.exit(1)
            dataset_interval = _iv
    monitor(duration=duration, dataset_interval=dataset_interval)
