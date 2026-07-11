"""
SIEM Attack Simulation Script
Sends realistic attack payloads to the local SIEM API via inject_real_anomaly.
Safe: only targets localhost. No real network attacks are performed.

Usage:
    python3 simulate_attacks.py [--api=http://localhost:8000] [--delay=1.0]
"""
import sys
import time
import json
import requests
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))
from log_formatter import format_log_line

API_BASE = 'http://localhost:8000'
DELAY    = 1.0  # seconds between each injected event

_ALLOWED_HOSTS = {'localhost', '127.0.0.1', '::1'}

for arg in sys.argv[1:]:
    if arg.startswith('--api='):
        candidate = arg.split('=', 1)[1].rstrip('/')
        # SSRF guard: only allow loopback targets
        from urllib.parse import urlparse
        _host = urlparse(candidate).hostname or ''
        if _host not in _ALLOWED_HOSTS:
            print(f'❌ Refused non-localhost API target: {candidate}')
            sys.exit(1)
        API_BASE = candidate
    elif arg.startswith('--delay='):
        try:
            _d = float(arg.split('=', 1)[1])
            if _d != _d or _d < 0:  # NaN check (NaN != NaN) and negative guard
                raise ValueError
            DELAY = _d
        except ValueError:
            print('❌ --delay must be a positive number')
            sys.exit(1)

INJECT_URL = f'{API_BASE}/api/anomalies/inject/'

# ── Attack scenarios ──────────────────────────────────────────────────────────
ATTACKS = [
    # 1. Brute-force SSH (5 rapid failed logins from same IP)
    *[{
        'message':      f'Failed password for invalid user root from 192.168.1.200 port 5{i}022 ssh2',
        'level':        'ERROR',
        'source':       'auth-service',
        'src_ip':       '192.168.1.200',
        'dst_ip':       '127.0.0.1',
        'port':         22,
        'protocol':     'tcp',
        'service':      'ssh',
        'duration':     0.08,
        'packets_sent': 4,
        'bytes_sent':   220,
    } for i in range(5)],

    # 2. SQL Injection attempt
    {
        'message':      "sql injection attempt detected: GET /login?id=1' OR '1'='1 HTTP/1.1 from 10.0.0.55",
        'level':        'CRITICAL',
        'source':       'web-server',
        'src_ip':       '10.0.0.55',
        'dst_ip':       '127.0.0.1',
        'port':         80,
        'protocol':     'tcp',
        'service':      'http',
        'duration':     0.35,
        'packets_sent': 12,
        'bytes_sent':   1800,
    },

    # 3. XSS Attack
    {
        'message':      'xss cross-site scripting payload detected in request body from 10.0.0.55',
        'level':        'CRITICAL',
        'source':       'web-server',
        'src_ip':       '10.0.0.55',
        'dst_ip':       '127.0.0.1',
        'port':         80,
        'protocol':     'tcp',
        'service':      'http',
        'duration':     0.25,
        'packets_sent': 9,
        'bytes_sent':   1200,
    },

    # 4. Port scan / reconnaissance (nmap-style)
    *[{
        'message':      f'UFW BLOCK IN=eth0 SRC=192.168.1.100 DST=127.0.0.1 PROTO=TCP DPT={port} SYN',
        'level':        'WARNING',
        'source':       'firewall',
        'src_ip':       '192.168.1.100',
        'dst_ip':       '127.0.0.1',
        'port':         port,
        'protocol':     'tcp',
        'service':      '-',
        'duration':     0.002,
        'packets_sent': 1,
        'bytes_sent':   60,
    } for port in [21, 22, 23, 25, 80, 443, 3306, 5432, 8080, 8443]],

    # 5. Privilege escalation (sudo abuse)
    {
        'message':      'sudo: grace : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/bin/bash',
        'level':        'WARNING',
        'source':       'auth-service',
        'src_ip':       '127.0.0.1',
        'dst_ip':       '127.0.0.1',
        'port':         22,
        'protocol':     'tcp',
        'service':      'ssh',
        'duration':     0.05,
        'packets_sent': 2,
        'bytes_sent':   150,
    },
    {
        'message':      'privilege escalation detected: pkexec called by unprivileged user grace',
        'level':        'CRITICAL',
        'source':       'auth-service',
        'src_ip':       '127.0.0.1',
        'dst_ip':       '127.0.0.1',
        'port':         22,
        'protocol':     'tcp',
        'service':      'ssh',
        'duration':     0.10,
        'packets_sent': 3,
        'bytes_sent':   200,
    },

    # 6. DoS / traffic flood simulation
    *[{
        'message':      f'SYN flood detected: high packet rate from 10.10.10.{i} DPT=80 connection reset',
        'level':        'CRITICAL',
        'source':       'firewall',
        'src_ip':       f'10.10.10.{i}',
        'dst_ip':       '127.0.0.1',
        'port':         80,
        'protocol':     'tcp',
        'service':      '-',
        'duration':     0.001,
        'packets_sent': 2,
        'bytes_sent':   80,
    } for i in range(1, 11)],

    # 7. Suspicious file access
    {
        'message':      'authentication failure: user grace attempted to read /etc/shadow (permission denied)',
        'level':        'ERROR',
        'source':       'system',
        'src_ip':       '127.0.0.1',
        'dst_ip':       '127.0.0.1',
        'port':         0,
        'protocol':     'tcp',
        'service':      '-',
        'duration':     0.01,
        'packets_sent': 1,
        'bytes_sent':   50,
    },

    # 8. Invalid user creation attempt
    {
        'message':      'authentication failure: su: FAILED SU (to fakeuser) grace on pts/1',
        'level':        'ERROR',
        'source':       'auth-service',
        'src_ip':       '127.0.0.1',
        'dst_ip':       '127.0.0.1',
        'port':         22,
        'protocol':     'tcp',
        'service':      'ssh',
        'duration':     0.12,
        'packets_sent': 4,
        'bytes_sent':   250,
    },
]

# ── Run simulation ────────────────────────────────────────────────────────────
ICONS = {'CRITICAL': '🔴🔴', 'ERROR': '🔴', 'WARNING': '🟡', 'INFO': '🟢'}

print('=' * 70)
print('🧪 SIEM ATTACK SIMULATION')
print(f'   Target API : {INJECT_URL}')
print(f'   Events     : {len(ATTACKS)}')
print(f'   Delay      : {DELAY}s')
print('=' * 70)

results = {'ok': 0, 'fail': 0}

for i, payload in enumerate(ATTACKS, 1):
    # Format the message in ISO 8601 style (hostname + process + message)
    original_message = payload['message']
    source = payload.get('source', 'network-monitor')
    formatted_message = format_log_line(original_message, source)
    
    # Create a copy of payload with formatted message
    formatted_payload = payload.copy()
    formatted_payload['message'] = formatted_message
    
    icon  = ICONS.get(formatted_payload.get('level', 'INFO'), '🟢')
    label = original_message[:70]
    try:
        r = requests.post(INJECT_URL, json=formatted_payload, timeout=5)
        if r.status_code in (200, 201):
            data = r.json()
            score = data.get('anomaly_score', '?')
            etype = data.get('event_type', '?')
            print(f'{icon} [{i:02d}] {etype:<22} score={score}  {label}')
            results['ok'] += 1
        else:
            print(f'❌ [{i:02d}] HTTP {r.status_code} — {label}')
            results['fail'] += 1
    except requests.exceptions.ConnectionError:
        print(f'❌ [{i:02d}] Cannot connect to {API_BASE} — is the Django server running?')
        results['fail'] += 1
        break
    except Exception as e:
        print(f'❌ [{i:02d}] Error: {e}')
        results['fail'] += 1

    time.sleep(DELAY)

print('=' * 70)
print(f'✅ Injected: {results["ok"]}   ❌ Failed: {results["fail"]}')
print('Check your SIEM dashboard → Logs, Behavior, AI Decisions')
print('=' * 70)
