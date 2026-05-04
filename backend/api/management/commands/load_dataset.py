from django.core.management.base import BaseCommand
from api.ai_model import load_dataset_to_logs
from api.models import Log


class Command(BaseCommand):
    help = "Load UNSW_NB15 dataset into database as Log records"

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-rows',
            type=int,
            default=1000,
            help='Maximum number of rows to load from dataset',
        )
        parser.add_argument(
            '--skip-if-existing',
            action='store_true',
            help='Skip loading when logs already exist in the database',
        )

    def handle(self, *args, **options):
        max_rows = options.get('max_rows', 1000)
        if options.get('skip_if_existing') and Log.objects.exists():
            existing_count = Log.objects.count()
            self.stdout.write(
                self.style.WARNING(
                    f'Skipping dataset load because database already has {existing_count} logs.'
                )
            )
            return

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
