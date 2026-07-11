"""Management command: collect live network connections and system process snapshots."""
from __future__ import annotations

import re
import socket
import struct
import threading
import time
from collections import defaultdict
from pathlib import Path
from django.core.management.base import BaseCommand

try:
    import psutil
except Exception:
    psutil = None

from api.models import Log, Anomaly
from api.views import normalize_event_type, normalize_severity, score_log_anomaly

_UFW_SRC  = re.compile(r'SRC=([\d.]+)')
_UFW_DST  = re.compile(r'DST=([\d.]+)')
_UFW_DPT  = re.compile(r'DPT=(\d+)')
_UFW_SPT  = re.compile(r'SPT=(\d+)')
_UFW_PROTO= re.compile(r'PROTO=(\w+)')

# ── Port Scan Detector ────────────────────────────────────────────────────────
class PortScanDetector(threading.Thread):
    """
    Tails /var/log/ufw.log and groups UFW BLOCK entries by source IP.
    When a single IP hits >= THRESHOLD distinct destination ports within
    WINDOW_SECONDS, it creates a PORT_SCAN log + Anomaly in the SIEM.
    """
    THRESHOLD      = 5    # distinct ports to trigger detection
    WINDOW_SECONDS = 60   # sliding window

    def __init__(self):
        super().__init__(daemon=True)
        self._stop_event = threading.Event()
        # {src_ip: [(timestamp, dst_port), ...]}
        self._hits: dict[str, list] = defaultdict(list)
        self._alerted: set[str] = set()  # IPs already alerted in current window

    def _ingest_ufw_line(self, line: str):
        if 'UFW BLOCK' not in line:
            return
        src_m = _UFW_SRC.search(line)
        dpt_m = _UFW_DPT.search(line)
        dst_m = _UFW_DST.search(line)
        proto_m = _UFW_PROTO.search(line)
        if not src_m or not dpt_m:
            return

        src_ip  = src_m.group(1)
        dst_port = int(dpt_m.group(1))
        dst_ip  = dst_m.group(1) if dst_m else ''
        proto   = proto_m.group(1).lower() if proto_m else 'tcp'
        now     = time.time()

        # Slide window
        self._hits[src_ip] = [
            (ts, p) for ts, p in self._hits[src_ip]
            if now - ts < self.WINDOW_SECONDS
        ]
        self._hits[src_ip].append((now, dst_port))

        distinct_ports = {p for _, p in self._hits[src_ip]}

        if len(distinct_ports) >= self.THRESHOLD and src_ip not in self._alerted:
            self._alerted.add(src_ip)
            ports_str = ','.join(str(p) for p in sorted(distinct_ports))
            msg = (
                f"PORT_SCAN detected: src={src_ip} scanned {len(distinct_ports)} ports "
                f"[{ports_str}] on {dst_ip} within {self.WINDOW_SECONDS}s via {proto.upper()}"
            )
            try:
                log = Log.objects.create(
                    source='firewall',
                    message=msg,
                    level='WARNING',
                    event_type='PORT_SCAN',
                    severity='HIGH',
                    attack_category='RECONNAISSANCE',
                    dataset_type='host',
                    src_ip=src_ip,
                    dst_ip=dst_ip or None,
                    port=dst_port,
                    protocol=proto,
                )
                result = score_log_anomaly(msg, 'WARNING', 'firewall', record={})
                log.anomaly_score = max(result['score'], 0.75)
                log.if_score = result.get('if_score', 0.0)
                log.rf_score = result.get('rf_score', 0.0)
                log.save(update_fields=['anomaly_score', 'if_score', 'rf_score'])
                Anomaly.objects.update_or_create(
                    log=log,
                    defaults={
                        'anomaly_type': 'Port Scan',
                        'score': log.anomaly_score,
                        'details': msg,
                        'status': 'confirmed',
                    }
                )
                print(f'  [PORT_SCAN] {src_ip} → {len(distinct_ports)} ports: {ports_str}')
            except Exception as e:
                print(f'PortScanDetector log error: {e}')

        # Reset alert after window expires
        if src_ip in self._alerted:
            oldest = min(ts for ts, _ in self._hits[src_ip]) if self._hits[src_ip] else now
            if now - oldest >= self.WINDOW_SECONDS:
                self._alerted.discard(src_ip)

    def run(self):
        ufw_log = Path('/var/log/ufw.log')
        if not ufw_log.exists():
            print('PortScanDetector: /var/log/ufw.log not found, skipping')
            return
        print('→ Starting port scan detector (tailing /var/log/ufw.log)')
        with open(ufw_log, 'r', errors='replace') as f:
            f.seek(0, 2)  # seek to end — only watch new entries
            while not self._stop_event.is_set():
                line = f.readline()
                if line:
                    self._ingest_ufw_line(line.strip())
                else:
                    time.sleep(0.5)

    def stop(self):
        self._stop_event.set()


def _parse_proc_net(proto: str) -> set[tuple]:
    """Read /proc/net/tcp or /proc/net/udp, return set of (src_ip, src_port, dst_ip, dst_port)."""
    path = Path(f'/proc/net/{proto}')
    if not path.exists():
        return set()
    conns = set()
    try:
        lines = path.read_text().splitlines()[1:]  # skip header
        for line in lines:
            parts = line.split()
            if len(parts) < 4:
                continue
            def decode_addr(hex_addr):
                addr, port = hex_addr.split(':')
                ip = socket.inet_ntoa(struct.pack('<I', int(addr, 16)))
                return ip, int(port, 16)
            src_ip, src_port = decode_addr(parts[1])
            dst_ip, dst_port = decode_addr(parts[2])
            conns.add((src_ip, src_port, dst_ip, dst_port))
    except Exception:
        pass
    return conns


class ConnectionPoller(threading.Thread):
    """Polls /proc/net/tcp and /proc/net/udp for new connections — no root needed."""

    def __init__(self, interval: int = 5):
        super().__init__(daemon=True)
        self.interval = interval
        self._stop_event = threading.Event()
        self._seen: set[tuple] = set()

    def _log_connection(self, proto: str, src_ip: str, src_port: int, dst_ip: str, dst_port: int):
        rec = {'src_ip': src_ip, 'dst_ip': dst_ip, 'port': dst_port, 'protocol': proto,
               'bytes_sent': 0, 'packets_sent': 1, 'duration': 0.0}
        msg = f"Connection {proto.upper()} {src_ip}:{src_port} -> {dst_ip}:{dst_port}"
        level = 'INFO'
        src = 'network'
        etype = normalize_event_type(msg, '', level)
        sev = normalize_severity(msg, level, '')
        log = Log.objects.create(
            source=src, message=msg, level=level, event_type=etype, severity=sev,
            src_ip=src_ip, dst_ip=dst_ip, port=dst_port, protocol=proto,
            packets_sent=1, bytes_sent=0, duration=0.0,
        )
        start_time = time.time()
        result = score_log_anomaly(msg, level, src, record=rec)
        response_time_ms = (time.time() - start_time) * 1000
        log.anomaly_score = result['score']
        log.if_score = result.get('if_score', 0.0) or 0.0
        log.rf_score = result.get('rf_score', 0.0) or 0.0
        log.response_time_ms = response_time_ms
        log.save(update_fields=['anomaly_score', 'if_score', 'rf_score', 'response_time_ms'])
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

    def run(self):
        print('→ Starting connection poller via /proc/net (no root required)')
        while not self._stop_event.is_set():
            try:
                current: set[tuple] = set()
                for proto in ('tcp', 'udp'):
                    for conn in _parse_proc_net(proto):
                        current.add((proto,) + conn)
                new_conns = current - self._seen
                for proto, src_ip, src_port, dst_ip, dst_port in new_conns:
                    if dst_ip == '0.0.0.0':
                        continue
                    try:
                        self._log_connection(proto, src_ip, src_port, dst_ip, dst_port)
                    except Exception as e:
                        print(f'Connection log error: {e}')
                self._seen = current
            except Exception as e:
                print(f'Connection poller error: {e}')
            self._stop_event.wait(self.interval)

    def stop(self):
        self._stop_event.set()


class ProcessPoller(threading.Thread):
    def __init__(self, interval: int = 10, top_n: int = 5, cpu_threshold: float = 10.0):
        super().__init__(daemon=True)
        self.interval = interval
        self.top_n = top_n
        self.cpu_threshold = cpu_threshold
        self._stop_event = threading.Event()

    def run(self):
        if psutil is None:
            print('psutil not installed; skipping process polling')
            return
        while not self._stop_event.is_set():
            try:
                procs = []
                for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
                    try:
                        cpu = float(p.info.get('cpu_percent') or 0.0)
                        mem = getattr(p.info.get('memory_info'), 'rss', 0) if p.info.get('memory_info') else 0
                        procs.append((cpu, mem, p.info.get('pid'), p.info.get('name')))
                    except Exception:
                        continue
                procs.sort(reverse=True, key=lambda x: x[0])
                for cpu, mem, pid, name in procs[: self.top_n]:
                    if cpu < self.cpu_threshold:
                        continue
                    msg = f"Process {name} (pid={pid}) CPU={cpu:.1f}% MEM={mem // 1024}KB"
                    level = 'WARNING' if cpu >= 50.0 else 'INFO'
                    src = 'host-process'
                    etype = normalize_event_type(msg, '', level)
                    sev = normalize_severity(msg, level, '')
                    log = Log.objects.create(
                        source=src,
                        message=msg,
                        level=level,
                        event_type=etype,
                        severity=sev,
                        process_name=name or '',
                        process_pid=pid,
                    )
                    start_time = time.time()
                    result = score_log_anomaly(msg, level, src, record={})
                    response_time_ms = (time.time() - start_time) * 1000
                    
                    log.anomaly_score = result['score']
                    log.if_score = result.get('if_score', 0.0) or 0.0
                    log.rf_score = result.get('rf_score', 0.0) or 0.0
                    log.response_time_ms = response_time_ms
                    log.save(update_fields=['anomaly_score', 'if_score', 'rf_score', 'response_time_ms'])
            except Exception as e:
                print('Process poller error:', e)
            self._stop_event.wait(self.interval)

    def stop(self):
        self._stop_event.set()


class Command(BaseCommand):
    help = 'Collect live network connections (/proc/net) and host processes (psutil) into SIEM logs.'

    def add_arguments(self, parser):
        parser.add_argument('--iface', help='(ignored, kept for compatibility)', default=None)
        parser.add_argument('--timeout', type=int, help='(ignored, kept for compatibility)', default=None)
        parser.add_argument('--proc-interval', type=int, help='Process poll interval seconds', default=10)
        parser.add_argument('--proc-top', type=int, help='Top-N CPU processes to consider', default=5)
        parser.add_argument('--proc-cpu-threshold', type=float, help='Minimum CPU%% to log process', default=10.0)
        parser.add_argument('--conn-interval', type=int, help='Connection poll interval seconds', default=5)

    def handle(self, *args, **options):
        proc_interval = options.get('proc_interval')
        proc_top = options.get('proc_top')
        proc_cpu = options.get('proc_cpu_threshold')
        conn_interval = options.get('conn_interval')

        scan_detector = PortScanDetector()
        scan_detector.start()

        conn_poller = ConnectionPoller(interval=conn_interval)
        conn_poller.start()

        poller = ProcessPoller(interval=proc_interval, top_n=proc_top, cpu_threshold=proc_cpu)
        poller.start()

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Interrupted — stopping collectors'))
        finally:
            scan_detector.stop()
            conn_poller.stop()
            poller.stop()
            scan_detector.join(timeout=2)
            conn_poller.join(timeout=2)
            poller.join(timeout=2)
            self.stdout.write(self.style.SUCCESS('Collectors stopped'))
