from django.core.management.base import BaseCommand
from api.ai_model import load_dataset_to_logs


class Command(BaseCommand):
    help = "Load UNSW_NB15 dataset into database as Log records"

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-rows',
            type=int,
            default=1000,
            help='Maximum number of rows to load from dataset',
        )

    def handle(self, *args, **options):
        max_rows = options.get('max_rows', 1000)
        self.stdout.write(f'Loading dataset (max {max_rows} rows)...')

        try:
            result = load_dataset_to_logs(max_rows=max_rows)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Successfully loaded {result["loaded_logs"]} logs from {result["dataset"]}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error loading dataset: {e}'))
