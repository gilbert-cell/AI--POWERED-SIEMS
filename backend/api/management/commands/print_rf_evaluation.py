from django.core.management.base import BaseCommand
from api.models import Anomaly
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


class Command(BaseCommand):
    help = 'Print Random Forest model evaluation metrics using `rf_score` stored on logs.'

    def add_arguments(self, parser):
        parser.add_argument('--threshold', type=float, default=0.45, help='Score threshold for RF predictions')
        parser.add_argument('--limit', type=int, default=None, help='Limit number of labeled anomalies to evaluate')

    def handle(self, *args, **options):
        threshold = options['threshold']
        limit = options['limit']

        labeled_qs = Anomaly.objects.filter(status__in=['confirmed', 'false_positive']).select_related('log').order_by('-id')
        if limit:
            labeled_qs = labeled_qs[:limit]

        if not labeled_qs.exists():
            self.stdout.write(self.style.WARNING('No labeled anomalies available for RF evaluation.'))
            return

        y_true = []
        y_pred = []

        tp = fp = tn = fn = 0

        for anom in labeled_qs:
            log = anom.log
            truth = 1 if anom.status == 'confirmed' else 0
            rf_score = getattr(log, 'rf_score', 0.0) or 0.0
            pred = 1 if rf_score >= threshold else 0
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

        self.stdout.write('Random Forest Evaluation Results:')
        self.stdout.write(f'Accuracy:            {acc * 100:.1f}%')
        self.stdout.write(f'Precision:           {prec * 100:.1f}%')
        self.stdout.write(f'Recall:              {rec * 100:.1f}%')
        self.stdout.write(f'F1-score:            {f1 * 100:.1f}%')
        self.stdout.write(f'False Positive Rate: {fpr * 100:.1f}%')
        self.stdout.write('')
        self.stdout.write(f'Total labeled anomalies: {labeled_qs.count()}')
        self.stdout.write(f'Confusion matrix: TP={tp} FP={fp} TN={tn} FN={fn}')
