from django.core.management.base import BaseCommand
from api.ai_model import load_dataset_to_logs, load_host_logs
from api.models import Log


class Command(BaseCommand):
    help = "Load network and/or host datasets into the database"

    def add_arguments(self, parser):
        parser.add_argument('--max-rows', type=int, default=1000)
        parser.add_argument('--skip-if-existing', action='store_true')
        parser.add_argument(
            '--dataset-type',
            choices=['network', 'host', 'both'],
            default='both',
        )

    def handle(self, *args, **options):
        max_rows = options['max_rows']
        dtype = options['dataset_type']

        if options['skip_if_existing'] and Log.objects.exists():
            self.stdout.write(self.style.WARNING(
                f'Skipping — {Log.objects.count()} logs already exist.'
            ))
            return

        if dtype in ('network', 'both'):
            try:
                r = load_dataset_to_logs(max_rows=max_rows)
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Network: loaded {r["loaded_logs"]} logs'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Network error: {e}'))

        if dtype in ('host', 'both'):
            try:
                r = load_host_logs(max_rows=max_rows // 2)
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Host: loaded {r["loaded_logs"]} logs'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Host error: {e}'))
