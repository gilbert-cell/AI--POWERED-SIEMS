"""
Real-time SIEM log monitor.
Two parallel streams:
  1. Tails real Linux system logs (/var/log/*)
  2. Replays UNSW_NB15_training-set.csv rows at a configurable interval
Both send to the SIEM API for full ML scoring.
"""
import os
import re
import csv
import time
import random
import threading
import requests
from pathlib import Path

API_URL  = os.environ.get('SIEM_API_URL', 'http://localhost:8000/api/logs/create/')
DATASET  = Path(__file__).parent / 'data' / 'UNSW_NB15_training-set.csv'

# ── Linux log sources ─────────────────────────────────────────────────────────
LOG_SOURCES = [
    ('/var/log/auth.log', 'auth-service'),
    ('/var/log/syslog',   'system'),
    ('/var/log/kern.log', 'kernel'),
    ('/var/log/ufw.log',  'firewall'),
]

_SKIP_RE  = re.compile(r'CRON\[\d+\].*session (opened|closed)|sysstat-collect|systemd-logind', re.I)
_SRC_RE   = re.compile(r'SRC=([\d.]+)')
_DST_RE   = re.compile(r'DST=([\d.]+)')
_DPT_RE   = re.compile(r'DPT=(\d+)')
_PROTO_RE = re.compile(r'PROTO=(\w+)')
_LEN_RE   = re.compile(r'\bLEN=(\d+)')

# ── UNSW-NB15 attack_cat → SIEM source mapping ────────────────────────────────
_CAT_SOURCE = {
    'exploits': 'ids-system', 'backdoor': 'ids-system', 'shellcode': 'ids-system',
    'worms': 'network-monitor', 'reconnaissance': 'network-monitor',
    'dos': 'firewall', 'fuzzers': 'web-server', 'generic': 'network-monitor',
    'analysis': 'ids-system', 'normal': 'auth-service',
}
_CAT_LEVEL = {
    'normal': 'INFO', 'analysis': 'WARNING', 'fuzzers': 'WARNING',
    'reconnaissance': 'WARNING', 'generic': 'ERROR', 'dos': 'CRITICAL',
    'exploits': 'CRITICAL', 'backdoor': 'CRITICAL', 'shellcode': 'CRITICAL', 'worms': 'CRITICAL',
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
            body = re.sub(r'^\d{4}-\d{2}-\d{2}T[\d:.+\-]+\s+\S+\s+', '', line)
            payload = {'message': body, 'level': _linux_level(body), 'source': source}
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
            ok  = _send(payload)
            lvl = payload['level']
            icon = {'CRITICAL': '🔴🔴', 'ERROR': '🔴', 'WARNING': '🟡'}.get(lvl, '🟢')
            _print(icon, source, lvl, body, ok)


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
            source    = _CAT_SOURCE.get(cat_lower, 'network-monitor')
            level     = _CAT_LEVEL.get(cat_lower, 'INFO')

            message = (
                f"UNSW-NB15 | Attack Category: {cat} | Protocol: {proto} | "
                f"Service: {service} | State: {state} | "
                f"Duration: {dur} | Packets: {spkts} | Bytes: {sbytes}"
            )

            payload = {
                'message':      message,
                'level':        level,
                'source':       source,
                'protocol':     proto if proto != '-' else '',
                'service':      service if service != '-' else '',
                'state':        state   if state   != '-' else '',
                'duration':     float(dur)    if dur    else None,
                'packets_sent': int(float(spkts))  if spkts  else None,
                'bytes_sent':   int(float(sbytes)) if sbytes else None,
                'attack_category': cat,
            }

            ok   = _send(payload)
            icon = {'CRITICAL': '🔴🔴', 'ERROR': '🔴', 'WARNING': '🟡'}.get(level, '🟢')
            _print(icon, source, level, message, ok)
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
            dataset_interval = float(arg.split('=')[1])
    monitor(duration=duration, dataset_interval=dataset_interval)
