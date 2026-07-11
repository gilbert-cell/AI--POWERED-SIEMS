from django.core.management.base import BaseCommand
from api.models import Log, Anomaly
from api.config import ANOMALY_THRESHOLD
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


class Command(BaseCommand):
    help = 'Print AI model evaluation metrics (accuracy, precision, recall, f1, false positive rate, detection time)'

    def add_arguments(self, parser):
        parser.add_argument('--threshold', type=float, default=ANOMALY_THRESHOLD, help='Anomaly score threshold for predictions')
        parser.add_argument('--limit', type=int, default=None, help='Limit number of labeled anomalies to evaluate')

    def handle(self, *args, **options):
        threshold = options['threshold']
        limit = options['limit']

        labeled_qs = Anomaly.objects.filter(status__in=['confirmed', 'false_positive']).select_related('log').order_by('-id')
        if limit:
            labeled_qs = labeled_qs[:limit]

        if not labeled_qs.exists():
            self.stdout.write(self.style.WARNING('No labeled anomalies available for evaluation.'))
            return

        y_true = []
        y_pred = []
        response_times = []

        tp = fp = tn = fn = 0

        for anom in labeled_qs:
            log = anom.log
            truth = 1 if anom.status == 'confirmed' else 0
            pred = 1 if (getattr(log, 'anomaly_score', 0.0) or 0.0) >= threshold else 0
            y_true.append(truth)
            y_pred.append(pred)
            if getattr(log, 'response_time_ms', 0) and log.response_time_ms > 0:
                response_times.append(log.response_time_ms)

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

        if response_times:
            rt_avg = float(np.mean(response_times))
            rt_p50 = float(np.percentile(response_times, 50))
            rt_p95 = float(np.percentile(response_times, 95))
            rt_p99 = float(np.percentile(response_times, 99))
        else:
            rt_avg = rt_p50 = rt_p95 = rt_p99 = 0.0

        # Print as plain lines (percent format) per user request
        self.stdout.write('Model Evaluation Results:')
        self.stdout.write(f'Accuracy:            {acc * 100:.1f}%')
        self.stdout.write(f'Precision:           {prec * 100:.1f}%')
        self.stdout.write(f'Recall:              {rec * 100:.1f}%')
        self.stdout.write(f'F1-score:            {f1 * 100:.1f}%')
        self.stdout.write(f'False Positive Rate: {fpr * 100:.1f}%')
        self.stdout.write('')
        # Keep summary details below
        self.stdout.write(f'Total labeled anomalies: {labeled_qs.count()}')
        self.stdout.write(f'Confusion matrix: TP={tp} FP={fp} TN={tn} FN={fn}')
