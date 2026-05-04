"""
Management command: ingest real Linux system logs into the SIEM.
Reads /var/log/auth.log, /var/log/syslog, /var/log/kern.log, /var/log/ufw.log
and runs the full hybrid ML scoring pipeline on each line.
"""
import re
from datetime import datetime, timezone
from pathlib import Path
from django.core.management.base import BaseCommand
from api.models import Log, Anomaly
from api.views import (
    normalize_event_type, normalize_severity, normalize_attack_category,
    score_log_anomaly, _EVENT_DEFAULTS, _SERVICE_PORT,
)

# ISO timestamp: 2026-05-02T11:25:01.167144+03:00 ubuntu PROCESS[pid]: message
_TS_RE  = re.compile(r'^(\d{4}-\d{2}-\d{2}T[\d:.+\-]+)\s+\S+\s+(.+)$')
_SRC_RE = re.compile(r'SRC=([\d a-fA-F:.]+?)(?:\s|$)')
_DST_RE = re.compile(r'DST=([\d a-fA-F:.]+?)(?:\s|$)')
_SPT_RE = re.compile(r'SPT=(\d+)')
_DPT_RE = re.compile(r'DPT=(\d+)')
_LEN_RE = re.compile(r'\bLEN=(\d+)')
_TTL_RE = re.compile(r'TTL=(\d+)')
_PROTO_RE = re.compile(r'PROTO=(\w+)')

LOG_FILES = [
    ('/var/log/auth.log',  'auth-service'),
    ('/var/log/syslog',    'system'),
    ('/var/log/kern.log',  'kernel'),
    ('/var/log/ufw.log',   'firewall'),
]


def _parse_line(line: str, source: str) -> dict | None:
    """Parse a Linux log line into a SIEM-ready dict. Returns None to skip."""
    line = line.strip()
    if not line:
        return None

    m = _TS_RE.match(line)
    body = m.group(2) if m else line
    ts_str = m.group(1) if m else None

    # Skip pure noise
    if re.search(r'CRON\[\d+\].*session (opened|closed)', body):
        return None
    if 'sysstat-collect' in body or 'systemd-logind' in body.lower():
        return None

    # Determine level from content
    body_lower = body.lower()
    if any(k in body_lower for k in ['failed password', 'authentication failure',
                                      'invalid user', 'ufw block', 'error', 'fail']):
        level = 'ERROR'
    elif any(k in body_lower for k in ['warning', 'warn', 'sudo:', 'privilege']):
        level = 'WARNING'
    elif any(k in body_lower for k in ['critical', 'panic', 'oom', 'segfault']):
        level = 'CRITICAL'
    else:
        level = 'INFO'

    # Extract network fields from UFW / kernel lines
    src_ip = dst_ip = proto = None
    port = None
    bytes_sent = None

    src_m = _SRC_RE.search(body)
    dst_m = _DST_RE.search(body)
    dpt_m = _DPT_RE.search(body)
    spt_m = _SPT_RE.search(body)
    len_m = _LEN_RE.search(body)
    proto_m = _PROTO_RE.search(body)

    if src_m:
        raw = src_m.group(1).strip()
        # skip IPv6 for GenericIPAddressField simplicity
        if ':' not in raw:
            src_ip = raw
    if dst_m:
        raw = dst_m.group(1).strip()
        if ':' not in raw:
            dst_ip = raw
    if dpt_m:
        port = int(dpt_m.group(1))
    elif spt_m:
        port = int(spt_m.group(1))
    if len_m:
        bytes_sent = int(len_m.group(1))
    if proto_m:
        proto = proto_m.group(1).lower()

    return {
        'message': body,
        'level': level,
        'source': source,
        'src_ip': src_ip,
        'dst_ip': dst_ip,
        'port': port,
        'bytes_sent': bytes_sent,
        'protocol': proto or '',
        'ts_str': ts_str,
    }


def _ingest_file(path: str, source: str, tail: int, verbosity: int) -> tuple[int, int]:
    """Read `tail` lines from `path`, create Log+Anomaly records. Returns (loaded, anomalies)."""
    lines = Path(path).read_text(errors='replace').splitlines()
    lines = lines[-tail:]  # only recent lines

    loaded = anomalies = 0
    for line in lines:
        parsed = _parse_line(line, source)
        if parsed is None:
            continue

        msg    = parsed['message']
        level  = parsed['level']
        src    = parsed['source']
        etype  = normalize_event_type(msg, '', level)
        sev    = normalize_severity(msg, level, '')
        cat    = normalize_attack_category(etype, '')
        defs   = _EVENT_DEFAULTS.get(etype, {})

        log = Log.objects.create(
            source       = src,
            message      = msg,
            level        = level,
            event_type   = etype,
            severity     = sev,
            attack_category = cat,
            protocol     = parsed['protocol'] or defs.get('protocol', ''),
            service      = defs.get('service', ''),
            state        = defs.get('state', ''),
            src_ip       = parsed['src_ip'],
            dst_ip       = parsed['dst_ip'],
            port         = parsed['port'] or defs.get('port'),
            bytes_sent   = parsed['bytes_sent'],
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
            anomalies += 1
            if verbosity >= 2:
                print(f"  ANOMALY [{result['score']:.2f}] {etype} — {msg[:80]}")

        loaded += 1

    return loaded, anomalies


class Command(BaseCommand):
    help = 'Ingest real Linux system logs (/var/log/*) into the SIEM with ML scoring'

    def add_arguments(self, parser):
        parser.add_argument('--tail', type=int, default=200,
                            help='Lines to read from the end of each log file (default: 200)')

    def handle(self, *args, **options):
        tail = options['tail']
        v    = options['verbosity']
        total_loaded = total_anomalies = 0

        for path, source in LOG_FILES:
            if not Path(path).exists():
                if v >= 1:
                    self.stdout.write(self.style.WARNING(f'  skip {path} (not found)'))
                continue
            self.stdout.write(f'→ {path} ({source}) …')
            loaded, anoms = _ingest_file(path, source, tail, v)
            total_loaded    += loaded
            total_anomalies += anoms
            self.stdout.write(self.style.SUCCESS(
                f'  ✓ {loaded} logs ingested, {anoms} anomalies detected'
            ))

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — {total_loaded} total logs, {total_anomalies} anomalies'
        ))
