# api/services.py — business logic layer (views stay thin)
import logging
from datetime import datetime, timedelta
from django.db.models import Count, Q, Case, When, IntegerField, Sum
from django.utils import timezone

from .config import (
    ANOMALY_THRESHOLD, FALSE_POSITIVE_SEVERITY,
    DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE,
    TIME_RANGE_MAP, TOP_ALERTS_LIMIT, TOP_HOSTS_LIMIT,
    CRITICAL_SCORE, HIGH_SCORE,
)

logger = logging.getLogger(__name__)


# ── Shared queryset helpers ───────────────────────────────────────────────────

def apply_time_and_source_filter(qs, request, ts_field='timestamp'):
    """Apply ?range= and ?source= filters to any queryset."""
    source    = request.GET.get('source', '').strip()
    range_key = request.GET.get('range', request.GET.get('time_range', '')).strip()

    src_field = 'source__iexact' if ts_field == 'timestamp' else 'log__source__iexact'
    if source and source != 'all':
        qs = qs.filter(**{src_field: source})

    delta = TIME_RANGE_MAP.get(range_key)
    if delta:
        qs = qs.filter(**{f'{ts_field}__gte': timezone.now() - delta})

    return qs


def paginate(qs, request):
    """Return (page_qs, total_count, page, page_size)."""
    try:
        page      = max(1, int(request.GET.get('page', 1)))
        page_size = min(MAX_PAGE_SIZE, max(1, int(request.GET.get('page_size', DEFAULT_PAGE_SIZE))))
    except (ValueError, TypeError):
        page, page_size = 1, DEFAULT_PAGE_SIZE

    total  = qs.count()
    offset = (page - 1) * page_size
    return qs[offset:offset + page_size], total, page, page_size


# ── Dashboard services ────────────────────────────────────────────────────────

def get_dashboard_stats(minutes=None):
    from .models import Log, Anomaly
    qs  = Log.objects.all()
    aqs = Anomaly.objects.all()
    if minutes:
        cutoff = timezone.now() - timedelta(minutes=minutes)
        qs  = qs.filter(timestamp__gte=cutoff)
        aqs = aqs.filter(log__timestamp__gte=cutoff)

    total_logs = qs.count()

    # Total alerts = anomalies detected by AI
    total_alerts = aqs.count()

    # Critical alerts
    critical_alerts = qs.filter(severity='CRITICAL').count()

    # Severity breakdown
    severity_counts = {}
    for row in qs.values('severity').annotate(count=Count('id')):
        severity_counts[(row['severity'] or 'INFORMATIONAL').upper()] = row['count']

    # False positives — match the same logic as build_log_payload display_status
    # 1. Explicitly marked false_positive by analyst
    # 2. Derived: anomaly exists with LOW/INFORMATIONAL severity log + score >= threshold
    from django.db.models import Q as _Q
    false_positives = aqs.filter(
        _Q(status='false_positive') |
        _Q(log__severity__in=['LOW', 'INFORMATIONAL'], score__gte=ANOMALY_THRESHOLD)
    ).distinct().count()

    # True positives
    true_positives = aqs.filter(score__gte=0.45).exclude(status='false_positive').count()

    # Detection Rate capped at 99.5%
    if (true_positives + false_positives) > 0:
        detection_rate = round(min(true_positives / (true_positives + false_positives) * 100, 99.5), 1)
    elif total_logs > 0:
        attack_events = qs.filter(severity__in=['MEDIUM', 'HIGH', 'CRITICAL']).count()
        detection_rate = round(min(attack_events / total_logs * 100, 99.5), 1)
    else:
        detection_rate = 0.0

    return {
        'total_logs':       total_logs,
        'total_alerts':     total_alerts,
        'critical_alerts':  critical_alerts,
        'false_positives':  false_positives,
        'detection_rate':   detection_rate,
        'severity_counts': {
            'informational': severity_counts.get('INFORMATIONAL', 0),
            'low':           severity_counts.get('LOW', 0),
            'medium':        severity_counts.get('MEDIUM', 0),
            'high':          severity_counts.get('HIGH', 0),
            'critical':      severity_counts.get('CRITICAL', 0),
        },
    }


def get_source_stats(minutes=None):
    from .models import Log, Anomaly
    qs = Log.objects.all()
    aqs = Anomaly.objects.all()
    if minutes:
        cutoff = timezone.now() - timedelta(minutes=minutes)
        qs = qs.filter(timestamp__gte=cutoff)
        aqs = aqs.filter(log__timestamp__gte=cutoff)
    source_counts = {
        row['source']: row['count']
        for row in qs.values('source').annotate(count=Count('id'))
    }
    fp_counts = {
        row['log__source']: row['count']
        for row in aqs.filter(
            Q(status='false_positive') | Q(log__severity=FALSE_POSITIVE_SEVERITY)
        ).distinct().values('log__source').annotate(count=Count('id'))
    }
    return {
        'source_counts':         source_counts,
        'false_positive_counts': fp_counts,
        'total_logs':            sum(source_counts.values()),
    }


def get_alert_trends(days: int):
    from .models import Log, Anomaly
    now    = timezone.now()
    trends = []
    for i in range(days):
        start    = now - (now - now.__class__(now.year, now.month, now.day, tzinfo=now.tzinfo)) + \
                   __import__('datetime').timedelta(days=i - days + 1)
        # simpler: just bucket by day offset
        day_start = now - __import__('datetime').timedelta(days=days - i)
        day_end   = now - __import__('datetime').timedelta(days=days - i - 1)
        alerts    = Log.objects.filter(timestamp__gte=day_start, timestamp__lt=day_end).count()
        resolved  = Anomaly.objects.filter(
            created_at__gte=day_start, created_at__lt=day_end, status='resolved'
        ).count()
        trends.append({'date': day_start.strftime('%Y-%m-%d'), 'alerts': alerts, 'resolved': resolved})
    return trends


def get_top_alerts(limit: int = TOP_ALERTS_LIMIT, minutes=None):
    from .models import Anomaly
    def _sev(atype):
        atype = (atype or '').lower()
        # Critical — confirmed/severe attack requiring immediate response
        if any(k in atype for k in ['privilege', 'escalation', 'root', 'ransomware', 'backdoor', 'exfiltration', 'shellcode', 'rce']):
            return 'critical'
        # High — likely attack or policy violation
        if any(k in atype for k in ['brute', 'sql', 'malware', 'ddos', 'exploit', 'intrusion', 'web']):
            return 'high'
        # Medium — suspicious activity
        if any(k in atype for k in ['port', 'xss', 'worm', 'recon', 'scan', 'login']):
            return 'medium'
        # Low — minor events
        if any(k in atype for k in ['logout', 'config', 'usb', 'access']):
            return 'low'
        return 'informational'

    aqs = Anomaly.objects.all()
    if minutes:
        cutoff = timezone.now() - timedelta(minutes=minutes)
        aqs = aqs.filter(log__timestamp__gte=cutoff)
    rows = aqs.values('anomaly_type').annotate(count=Count('id')).order_by('-count')[:limit]
    return [{'alert_type': r['anomaly_type'], 'count': r['count'], 'severity': _sev(r['anomaly_type'])} for r in rows]


# ── Analytics services ────────────────────────────────────────────────────────

def get_analytics_summary(request):
    from .models import Log, Anomaly
    logs           = apply_time_and_source_filter(Log.objects.all(), request)
    total          = logs.count()
    false_positives = apply_time_and_source_filter(
        Anomaly.objects.filter(
            Q(status='false_positive') | Q(log__severity=FALSE_POSITIVE_SEVERITY)
        ).select_related('log'), request, ts_field='log__timestamp'
    ).distinct().count() if total else 0
    accuracy = round(min((total - false_positives) / total * 100, 100.0), 1) if total else 0.0
    response_metrics = get_response_metrics(request)
    return {
        'total_events':       total,
        'false_positives':    false_positives,
        'detection_accuracy': accuracy,
        'avg_response_time':  response_metrics['avg_response_time'],
        'system_uptime':      None,
    }


def get_severity_distribution(request):
    from .models import Log
    logs = apply_time_and_source_filter(Log.objects.all(), request)
    rows = logs.values('severity').annotate(count=Count('id'))
    dist = {r['severity'].lower(): r['count'] for r in rows if r['severity']}
    return [{'severity': s, 'count': c} for s, c in dist.items() if c > 0]


def get_response_metrics(request):
    from .models import Anomaly
    anomalies = apply_time_and_source_filter(
        Anomaly.objects.exclude(status='new').select_related('log'),
        request,
        ts_field='log__timestamp',
    )
    durations = [
        max((a.updated_at - a.created_at).total_seconds(), 0.0)
        for a in anomalies
        if a.updated_at and a.created_at and a.updated_at > a.created_at
    ]
    if not durations:
        return {
            'avg_response_time': 0,
            'min_response_time': 0,
            'max_response_time': 0,
            'median_response_time': 0,
            'p95_response_time': 0,
            'p99_response_time': 0,
        }

    durations.sort()

    def percentile(p):
        index = min(len(durations) - 1, max(0, round((len(durations) - 1) * p)))
        return round(durations[index], 1)

    mid = len(durations) // 2
    median = durations[mid] if len(durations) % 2 else (durations[mid - 1] + durations[mid]) / 2
    return {
        'avg_response_time': round(sum(durations) / len(durations), 1),
        'min_response_time': round(durations[0], 1),
        'max_response_time': round(durations[-1], 1),
        'median_response_time': round(median, 1),
        'p95_response_time': percentile(0.95),
        'p99_response_time': percentile(0.99),
    }


def get_detection_accuracy_by_severity(request):
    from .models import Log, Anomaly
    logs = apply_time_and_source_filter(Log.objects.all(), request)
    totals = {
        (row['severity'] or 'unknown').lower(): row['count']
        for row in logs.values('severity').annotate(count=Count('id'))
    }
    false_positives = {
        (row['log__severity'] or 'unknown').lower(): row['count']
        for row in apply_time_and_source_filter(
            Anomaly.objects.filter(
                Q(status='false_positive') | Q(log__severity=FALSE_POSITIVE_SEVERITY)
            ).select_related('log'),
            request,
            ts_field='log__timestamp',
        ).values('log__severity').annotate(count=Count('id'))
    }
    result = []
    for severity, total in totals.items():
        fp_count = false_positives.get(severity, 0)
        accuracy = round(max((total - fp_count) / total * 100, 0), 1) if total else 0
        fp_rate = round(fp_count / total * 100, 1) if total else 0
        result.append({'severity': severity, 'accuracy': accuracy, 'false_positive_rate': fp_rate})
    severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    return sorted(result, key=lambda row: severity_order.get(row['severity'], 99))


def get_event_type_counts(request, limit: int = 10):
    from .models import Log
    from .views import _EVENT_TYPE_LABELS
    logs = apply_time_and_source_filter(Log.objects.all(), request)
    rows = logs.values('event_type').annotate(count=Count('id')).order_by('-count')[:limit]
    return [{'event_type': _EVENT_TYPE_LABELS.get(r['event_type'], r['event_type']), 'count': r['count']} for r in rows]


def get_source_metrics(request):
    from .models import Log, Anomaly
    logs = apply_time_and_source_filter(Log.objects.all(), request)
    breakdown = logs.values('source').annotate(
        total    = Count('id'),
        critical = Sum(Case(When(level='CRITICAL', then=1), default=0, output_field=IntegerField())),
        high     = Sum(Case(When(level='ERROR',    then=1), default=0, output_field=IntegerField())),
        medium   = Sum(Case(When(level='WARNING',  then=1), default=0, output_field=IntegerField())),
        low      = Sum(Case(When(level='INFO',     then=1), default=0, output_field=IntegerField())),
    ).order_by('-total')
    fp_map = {
        r['log__source']: r['count']
        for r in Anomaly.objects.filter(
            Q(status='false_positive') | Q(log__severity=FALSE_POSITIVE_SEVERITY)
        ).distinct().values('log__source').annotate(count=Count('id'))
    }
    return {
        row['source']: {
            'total':           row['total'],
            'critical':        row['critical'] or 0,
            'high':            row['high']     or 0,
            'medium':          row['medium']   or 0,
            'low':             row['low']      or 0,
            'false_positives': fp_map.get(row['source'], 0),
            'duplicates':      0,
        }
        for row in breakdown
    }


def get_top_hosts(request, limit: int = TOP_HOSTS_LIMIT):
    from .models import Log
    logs = apply_time_and_source_filter(Log.objects.exclude(src_ip=None), request)
    rows = logs.values('src_ip').annotate(event_count=Count('id')).order_by('-event_count')[:limit]
    return [{'host': r['src_ip'], 'event_count': r['event_count']} for r in rows]


def get_hourly_trends(request):
    from .models import Log
    now     = timezone.now()
    buckets = {
        (now - __import__('datetime').timedelta(hours=23 - i)).strftime('%H:00'):
        {'hour': (now - __import__('datetime').timedelta(hours=23 - i)).strftime('%H:00'), 'events': 0, 'critical': 0, 'detected': 0}
        for i in range(24)
    }
    logs = apply_time_and_source_filter(
        Log.objects.filter(timestamp__gte=now - __import__('datetime').timedelta(hours=24)), request
    )
    for log in logs:
        label = log.timestamp.strftime('%H:00')
        if label in buckets:
            buckets[label]['events']   += 1
            buckets[label]['detected'] += 1
            if log.level in ('ERROR', 'CRITICAL'):
                buckets[label]['critical'] += 1
    return list(buckets.values())


# ── Log Aggregation & Correlation service ───────────────────────────────────

def correlate_logs(window_minutes: int = 10, min_events: int = 2):
    """
    Aggregate recent logs into CorrelatedEvent groups by (src_ip, event_type)
    within a sliding time window. Returns list of created/updated CorrelatedEvent ids.
    """
    import hashlib
    from .models import Log, CorrelatedEvent

    cutoff = timezone.now() - __import__('datetime').timedelta(minutes=window_minutes)
    logs = (
        Log.objects
        .filter(timestamp__gte=cutoff)
        .exclude(src_ip=None)
        .order_by('src_ip', 'event_type', 'timestamp')
    )

    # Group by (src_ip, event_type)
    groups = {}
    for log in logs:
        key = (str(log.src_ip), log.event_type)
        groups.setdefault(key, []).append(log)

    affected_ids = []
    for (src_ip, event_type), group_logs in groups.items():
        if len(group_logs) < min_events:
            continue

        correlation_id = hashlib.md5(f"{src_ip}:{event_type}".encode()).hexdigest()[:16]  # nosec B324
        timestamps = [l.timestamp for l in group_logs]
        max_score = max((l.anomaly_score for l in group_logs), default=0.0)

        # Map score → severity (5-level scale)
        if max_score >= 0.9:
            severity = 'CRITICAL'
        elif max_score >= 0.75:
            severity = 'HIGH'
        elif max_score >= 0.45:
            severity = 'MEDIUM'
        elif max_score >= 0.15:
            severity = 'LOW'
        else:
            severity = 'INFORMATIONAL'

        ce, _ = CorrelatedEvent.objects.update_or_create(
            correlation_id=correlation_id,
            defaults={
                'event_type':      event_type,
                'src_ip':          src_ip,
                'event_count':     len(group_logs),
                'severity':        severity,
                'aggregate_score': round(max_score, 3),
                'first_seen':      min(timestamps),
                'last_seen':       max(timestamps),
            },
        )
        ce.logs.set(group_logs)
        affected_ids.append(ce.id)

    return affected_ids


def get_correlated_events(request):
    """Return correlated events, optionally filtered by ?min_score= and ?severity=."""
    from .models import CorrelatedEvent

    qs = CorrelatedEvent.objects.prefetch_related('logs').order_by('-aggregate_score', '-last_seen')

    min_score = request.GET.get('min_score')
    if min_score:
        try:
            qs = qs.filter(aggregate_score__gte=float(min_score))
        except ValueError:
            pass

    severity = (request.GET.get('severity') or '').upper()
    if severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'):
        qs = qs.filter(severity=severity)

    page_qs, total, page, page_size = paginate(qs, request)

    results = [
        {
            'id':              ce.id,
            'correlation_id':  ce.correlation_id,
            'event_type':      ce.event_type,
            'src_ip':          str(ce.src_ip) if ce.src_ip else None,
            'event_count':     ce.event_count,
            'severity':        ce.severity,
            'aggregate_score': ce.aggregate_score,
            'first_seen':      ce.first_seen.isoformat(),
            'last_seen':       ce.last_seen.isoformat(),
            'log_ids':         list(ce.logs.values_list('id', flat=True)),
        }
        for ce in page_qs
    ]
    return results, total, page, page_size


# ── Anomaly scoring service ───────────────────────────────────────────────────

def run_anomaly_detection_for_logs(logs):
    """Score a queryset of Log objects and persist results. Returns created anomalies."""
    from .models import Anomaly
    from .views import score_log_anomaly
    anomalies = []
    for log in logs:
        try:
            result = score_log_anomaly(log.message or '', log.level, log.source, record={
                'duration': log.duration, 'packets_sent': log.packets_sent, 'bytes_sent': log.bytes_sent,
            })
            log.anomaly_score = result['score']
            log.if_score      = result['if_score']
            log.rf_score      = result['rf_score']
            log.save(update_fields=['anomaly_score', 'if_score', 'rf_score'])

            if result['score'] >= ANOMALY_THRESHOLD:
                anomaly, _ = Anomaly.objects.update_or_create(
                    log=log,
                    defaults={
                        'anomaly_type': result['types'][0],
                        'score':        result['score'],
                        'details':      result['reason'],
                    }
                )
                anomalies.append(anomaly)
        except Exception:
            logger.exception('Anomaly scoring failed for log id=%s', log.id)
    return anomalies
