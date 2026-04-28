"""
Management command to initialize the AI-powered SIEM with real ML model training and data loading.
Orchestrates: Model Training → Dataset Loading → Real Predictions → Anomaly Detection
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.ai_model import train_model, load_dataset_to_logs, predict_record
from api.models import Log, Anomaly
import pandas as pd
from pathlib import Path


class Command(BaseCommand):
    help = 'Setup AI SIEM: Train ML model, load dataset, and perform real anomaly detection'

    def add_arguments(self, parser):
        parser.add_argument(
            '--train-only',
            action='store_true',
            help='Only train the model without loading data',
        )
        parser.add_argument(
            '--load-data',
            action='store_true',
            help='Load dataset into database as logs',
        )
        parser.add_argument(
            '--detect-anomalies',
            action='store_true',
            help='Run anomaly detection on loaded logs',
        )
        parser.add_argument(
            '--full-setup',
            action='store_true',
            help='Complete setup: train + load data + detect anomalies',
        )
        parser.add_argument(
            '--max-rows',
            type=int,
            default=500,
            help='Maximum rows to load from dataset (default: 500)',
        )

    def handle(self, *args, **options):
        # If no specific action, do full setup
        if not any([options['train_only'], options['load_data'], options['detect_anomalies'], options['full_setup']]):
            options['full_setup'] = True

        if options['full_setup']:
            options['train_only'] = True
            options['load_data'] = True
            options['detect_anomalies'] = True

        if options['train_only']:
            self.train_model()

        if options['load_data']:
            self.load_dataset(options['max_rows'])

        if options['detect_anomalies']:
            self.run_anomaly_detection()

        self.stdout.write(
            self.style.SUCCESS('\n✓ AI SIEM setup complete!')
        )

    def train_model(self):
        self.stdout.write(self.style.WARNING('\n→ Training ML model from UNSW_NB15 dataset...'))
        try:
            result = train_model()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Model trained successfully!\n'
                    f'  Accuracy: {result["accuracy"]:.4f}\n'
                    f'  Features: {result["feature_count"]}\n'
                    f'  Path: {result["model_path"]}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Training failed: {str(e)}'))
            raise

    def load_dataset(self, max_rows):
        self.stdout.write(self.style.WARNING(f'\n→ Loading UNSW_NB15 dataset ({max_rows} rows) into database...'))
        try:
            result = load_dataset_to_logs(max_rows=max_rows)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Dataset loaded successfully!\n'
                    f'  Logs created: {result["loaded_logs"]}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Dataset loading failed: {str(e)}'))
            raise

    def run_anomaly_detection(self):
        self.stdout.write(self.style.WARNING('\n→ Running real ML-based anomaly detection on logs...'))
        
        # Get dataset to map features
        BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
        csv_path = BASE_DIR / "data" / "UNSW_NB15_training-set.csv"
        
        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f'✗ Dataset not found: {csv_path}'))
            return

        try:
            df = pd.read_csv(csv_path, low_memory=False)
            feature_columns = [col for col in df.columns if col not in ['label', 'attack_cat']]
            
            # Get recent logs that don't have anomaly analysis yet
            logs = Log.objects.filter(anomaly__isnull=True).order_by('-id')[:100]
            
            anomaly_count = 0
            threat_count = 0
            
            for log in logs:
                try:
                    # Extract features from log message
                    record = self._extract_features_from_log(log, df)
                    
                    # Get prediction from trained model
                    prediction = predict_record(record)
                    threat_score = prediction.get('probabilities', [0, 0])[1] if 'probabilities' in prediction else 0
                    
                    is_threat = prediction.get('threat', 0) == 1 or threat_score > 0.5
                    
                    if is_threat:
                        # Create anomaly record
                        anomaly_type = self._map_threat_to_type(log.message, threat_score)
                        Anomaly.objects.update_or_create(
                            log_id=log.id,
                            defaults={
                                'anomaly_type': anomaly_type,
                                'score': threat_score,
                                'details': f'ML prediction confidence: {threat_score:.2%}',
                                'resolved': False,
                            }
                        )
                        anomaly_count += 1
                        threat_count += 1
                        log.level = 'CRITICAL' if threat_score > 0.8 else 'WARNING'
                        log.save()
                
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'  Note: Could not analyze log {log.id}: {str(e)[:50]}'))
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Anomaly detection complete!\n'
                    f'  Logs analyzed: {len(logs)}\n'
                    f'  Threats detected: {threat_count}\n'
                    f'  Anomalies created: {anomaly_count}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Anomaly detection failed: {str(e)}'))

    def _extract_features_from_log(self, log, df):
        """Extract feature dictionary from log message."""
        record = {}
        
        # Parse message to extract available features
        message = log.message.lower()
        
        # Set default values for numeric features from dataset
        numeric_defaults = {
            'dur': 0.5,
            'spkts': 8,
            'dpkts': 8,
            'sbytes': 400,
            'dbytes': 400,
            'rate': 20,
            'sttl': 64,
            'dttl': 64,
            'sload': 5000,
            'dload': 5000,
            'sloss': 0,
            'dloss': 0,
        }
        
        for col in df.columns:
            if col in ['label', 'attack_cat', 'id']:
                continue
            if col in numeric_defaults:
                record[col] = numeric_defaults[col]
            elif col == 'proto':
                record[col] = 'tcp' if 'tcp' in message else 'udp' if 'udp' in message else '-'
            elif col == 'service':
                if 'ftp' in message:
                    record[col] = 'ftp'
                elif 'http' in message:
                    record[col] = 'http'
                elif 'dns' in message:
                    record[col] = 'dns'
                else:
                    record[col] = '-'
            elif col == 'state':
                record[col] = 'FIN' if 'fin' in message else 'SYN' if 'syn' in message else 'FIN'
            else:
                # Categorical or other features default to 0 or empty
                record[col] = 0 if df[col].dtype in ['int64', 'float64'] else ''
        
        return record

    def _map_threat_to_type(self, message, score):
        """Map log message and score to threat type."""
        message_lower = message.lower()
        
        if score > 0.9:
            if 'dos' in message_lower or 'ddos' in message_lower:
                return 'DoS/DDoS Attack'
            elif 'backdoor' in message_lower or 'shellcode' in message_lower:
                return 'Backdoor/Shellcode'
            elif 'fuzzer' in message_lower or 'exploit' in message_lower:
                return 'Exploit/Fuzzing Attack'
            else:
                return 'Critical Threat'
        elif score > 0.7:
            if 'recon' in message_lower or 'scan' in message_lower:
                return 'Reconnaissance'
            else:
                return 'High-Risk Activity'
        else:
            if 'login' in message_lower or 'auth' in message_lower:
                return 'Authentication Anomaly'
            else:
                return 'Suspicious Behavior'
