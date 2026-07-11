"""
Management command: collect_host_logs
Tails /var/log/auth.log (and optionally syslog/kern.log) in real-time,
parses each line, runs the hybrid ML scoring pipeline, and saves to the
SIEM database with dataset_type='host'.

Usage:
    python manage.py collect_host_logs              # live tail (Ctrl+C to stop)
    python manage.py collect_host_logs --backfill 500  # ingest last 500 lines then tail
"""
import re
import time
import os
import signal
from pathlib import Path
from django.core.management.base import BaseCommand
from api.models import Log, Anomaly
from api.views import (
    normalize_event_type, normalize_severity,
    normalize_attack_category, score_log_anomaly, _EVENT_DEFAULTS,
)

# ── Syslog ISO timestamp pattern ────────────────────────────────────────────
_ISO_TS  = re.compile(r'^(\d{4}-\d{2}-\d{2}T[\d:.+\-]+)\s+\S+\s+(.+)$')
_SRC_RE  = re.compile(r'SRC=([\d.]+)')
_DST_RE  = re.compile(r'DST=([\d.]+)')
_DPT_RE  = re.compile(r'DPT=(\d+)')
_LEN_RE  = re.compile(r'\bLEN=(\d+)')
_PROTO_RE= re.compile(r'PROTO=(\w+)')

HOST_LOG_FILES = [
    ('/var/log/auth.log', 'auth-service'),
    ('/var/log/syslog',   'system'),
    ('/var/log/kern.log', 'system'),
    ('/var/log/ufw.log',  'firewall'),
]

# Lines to skip — pure noise
_SKIP_RE = re.compile(
    r'session (opened|closed) for user root.*by root|'
    r'sysstat-collect|systemd-logind.*New seat|'
    r'gnome-keyring|dbus|snapd|update-notifier|'
    r'systemd\[1\].*Finished|systemd\[1\].*Started|'
    r'fwupd|packagekit|apt-daily|'
    r'gnome-shell.*Window manager warning.*keysym|'
    r'gnome-shell.*Overwriting existing binding',
    re.I,
)
# SSH-specific IP extraction: "from 1.2.3.4 port 1234"
_SSH_FROM_RE = re.compile(r'from ([\d.]+) port (\d+)', re.I)


def _level(body: str) -> str:
    b = body.lower()
    if any(k in b for k in ['failed password', 'authentication failure', 'invalid user']):
        return 'ERROR'
    if 'failed' in b and any(k in b for k in ['connection', 'activation', 'auth', 'login']):
        return 'ERROR'
    if any(k in b for k in ['ufw block', 'ufw allow', 'dpt=', 'src=']):
        return 'WARNING'
    if any(k in b for k in ['sudo:', 'pkexec', 'privilege']):
        return 'WARNING'
    if any(k in b for k in ['oom killer', 'out of memory', 'segfault', 'kernel panic',
                              'clamav', 'trojan', 'earlyoom']):
        return 'CRITICAL'
    if any(k in b for k in ['warning', 'warn', 'error', 'critical', 'panic']):
        return 'WARNING'
    return 'INFO'


def _parse(line: str, source: str) -> dict | None:
    line = line.strip()
    if not line or _SKIP_RE.search(line):
        return None

    m    = _ISO_TS.match(line)
    body = (m.group(2) if m else line).replace('\x00', '')
    level = _level(body)

    src_ip = dst_ip = proto = None
    port = bytes_sent = None

    sm = _SRC_RE.search(body); src_ip = sm.group(1) if sm else None
    dm = _DST_RE.search(body); dst_ip = dm.group(1) if dm else None
    pm = _DPT_RE.search(body); port   = int(pm.group(1)) if pm else None
    lm = _LEN_RE.search(body); bytes_sent = int(lm.group(1)) if lm else None
    rm = _PROTO_RE.search(body); proto = rm.group(1).lower() if rm else None

    # SSH logs: extract IP from "from 1.2.3.4 port 22"
    if src_ip is None:
        ssh_m = _SSH_FROM_RE.search(body)
        if ssh_m:
            src_ip = ssh_m.group(1)
            if port is None:
                port = int(ssh_m.group(2))

    return dict(message=body, level=level, source=source,
                src_ip=src_ip, dst_ip=dst_ip, port=port,
                bytes_sent=bytes_sent, protocol=proto or '')


def _save(parsed: dict, verbosity: int) -> None:
    msg   = parsed['message']
    level = parsed['level']
    src   = parsed['source']
    etype = normalize_event_type(msg, '', level)
    sev   = normalize_severity(msg, level, '')
    cat   = normalize_attack_category(etype, '')
    defs  = _EVENT_DEFAULTS.get(etype, {})

    log = Log.objects.create(
        source=src, message=msg, level=level,
        event_type=etype, severity=sev, attack_category=cat,
        dataset_type='host',
        protocol=parsed['protocol'] or defs.get('protocol', ''),
        service=defs.get('service', ''),
        state=defs.get('state', ''),
        src_ip=parsed['src_ip'],
        dst_ip=parsed['dst_ip'],
        port=parsed['port'] or defs.get('port'),
        bytes_sent=parsed['bytes_sent'],
    )

    result = score_log_anomaly(msg, level, src, record={
        'duration': log.duration,
        'packets_sent': log.packets_sent,
        'bytes_sent': log.bytes_sent,
    })
    log.anomaly_score = result['score']
    log.if_score      = result['if_score']
    log.rf_score      = result['rf_score']
    log.save(update_fields=['anomaly_score', 'if_score', 'rf_score'])

    if result['score'] >= 0.45:
        Anomaly.objects.update_or_create(
            log=log,
            defaults={
                'anomaly_type': result['types'][0],
                'score': result['score'],
                'details': result['reason'],
                'status': 'confirmed',
            }
        )
        if verbosity >= 1:
            print(f'  [ANOMALY {result["score"]:.2f}] {etype} — {msg[:80]}')
    elif verbosity >= 2:
        print(f'  [{level}] {etype} — {msg[:80]}')


def _backfill(path: str, source: str, lines: int, verbosity: int) -> int:
    text = Path(path).read_text(errors='replace').splitlines()
    recent = text[-lines:]
    count = 0
    for line in recent:
        p = _parse(line, source)
        if p:
            _save(p, verbosity)
            count += 1
    return count


def _tail_file(path: str, source: str, verbosity: int, stop_event):
    """Open file, seek to end, then yield new lines as they appear."""
    with open(path, 'r', errors='replace') as f:
        f.seek(0, 2)  # seek to end
        if verbosity >= 1:
            print(f'  Tailing {path} …')
        while not stop_event.is_set():
            line = f.readline()
            if line:
                p = _parse(line, source)
                if p:
                    _save(p, verbosity)
            else:
                time.sleep(0.5)


class Command(BaseCommand):
    help = 'Live-tail Ubuntu host logs into the SIEM (dataset_type=host)'

    def add_arguments(self, parser):
        parser.add_argument('--backfill', type=int, default=200,
                            help='Lines to backfill from each log file before tailing (default: 200)')
        parser.add_argument('--no-tail', action='store_true',
                            help='Backfill only, do not tail')

    def handle(self, *args, **options):
        import threading
        backfill_n = options['backfill']
        no_tail    = options['no_tail']
        v          = options['verbosity']

        # ── Backfill ────────────────────────────────────────────────────────
        total = 0
        for path, source in HOST_LOG_FILES:
            if not Path(path).exists():
                self.stdout.write(self.style.WARNING(f'  skip {path} (not found)'))
                continue
            self.stdout.write(f'Backfilling {path} (last {backfill_n} lines) …')
            n = _backfill(path, source, backfill_n, v)
            total += n
            self.stdout.write(self.style.SUCCESS(f'  ✓ {n} logs ingested'))

        self.stdout.write(self.style.SUCCESS(f'\nBackfill complete — {total} host logs saved.'))

        if no_tail:
            return

        # ── Live tail ───────────────────────────────────────────────────────
        self.stdout.write('\nLive tailing host logs (Ctrl+C to stop)…\n')
        stop = threading.Event()

        def _sig(*_):
            self.stdout.write('\nStopping…')
            stop.set()

        signal.signal(signal.SIGINT,  _sig)
        signal.signal(signal.SIGTERM, _sig)

        threads = []
        for path, source in HOST_LOG_FILES:
            if not Path(path).exists():
                continue
            t = threading.Thread(
                target=_tail_file, args=(path, source, v, stop), daemon=True
            )
            t.start()
            threads.append(t)

        stop.wait()
        for t in threads:
            t.join(timeout=2)
        self.stdout.write(self.style.SUCCESS('Host log collection stopped.'))
