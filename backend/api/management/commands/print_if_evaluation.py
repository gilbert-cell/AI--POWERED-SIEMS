from django.core.management.base import BaseCommand
from api.models import Anomaly, Log
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


class Command(BaseCommand):
    help = 'Print Isolation Forest model evaluation metrics using `if_score` stored on logs.'

    def add_arguments(self, parser):
        parser.add_argument('--threshold', type=float, default=0.45, help='Score threshold for IF predictions')
        parser.add_argument('--limit', type=int, default=None, help='Limit number of labeled anomalies to evaluate')

    def handle(self, *args, **options):
        threshold = options['threshold']
        limit = options['limit']

        labeled_qs = Anomaly.objects.filter(status__in=['confirmed', 'false_positive']).select_related('log').order_by('-id')
        if limit:
            labeled_qs = labeled_qs[:limit]

        if not labeled_qs.exists():
            self.stdout.write(self.style.WARNING('No labeled anomalies available for IF evaluation.'))
            return

        y_true = []
        y_pred = []

        tp = fp = tn = fn = 0

        for anom in labeled_qs:
            log = anom.log
            truth = 1 if anom.status == 'confirmed' else 0
            if_score = getattr(log, 'if_score', 0.0) or 0.0
            pred = 1 if if_score >= threshold else 0
            y_true.append(truth)
            y_pred.append(pred)

        try:
            acc = accuracy_score(y_true, y_pred)
            prec = precision_score(y_true, y_pred, zero_division=0)
            rec = recall_score(y_true, y_pred, zero_division=0)
            f1 = f1_score(y_true, y_pred, zero_division=0)
            cm = confusion_matrix(y_true, y_pred)
            tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        except Exception:
            acc = prec = rec = f1 = fpr = 0.0

        # Print summary metrics specifically for Isolation Forest detection counts
        total_network = Log.objects.filter(dataset_type='network').count()
        detected = Log.objects.filter(dataset_type='network', if_score__gte=threshold).count()
        normal = total_network - detected
        anomaly_pct = (detected / total_network * 100) if total_network > 0 else 0.0

        self.stdout.write('Isolation Forest Evaluation Summary')
        self.stdout.write('Metric              Value')
        self.stdout.write('------------------- ------')
        self.stdout.write(f'Total Network Records\t{total_network:,}')
        self.stdout.write(f'Detected Anomalies\t{detected:,}')
        self.stdout.write(f'Normal Traffic\t{normal:,}')
        self.stdout.write(f'Anomaly Percentage\t{anomaly_pct:.1f}%')
