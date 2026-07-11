from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_userprofile'),
    ]

    operations = [
        # Log table — most-queried filter columns
        migrations.AddIndex(
            model_name='log',
            index=models.Index(fields=['timestamp'],   name='api_log_timestamp_idx'),
        ),
        migrations.AddIndex(
            model_name='log',
            index=models.Index(fields=['source'],      name='api_log_source_idx'),
        ),
        migrations.AddIndex(
            model_name='log',
            index=models.Index(fields=['severity'],    name='api_log_severity_idx'),
        ),
        migrations.AddIndex(
            model_name='log',
            index=models.Index(fields=['event_type'],  name='api_log_event_type_idx'),
        ),
        migrations.AddIndex(
            model_name='log',
            index=models.Index(fields=['level'],       name='api_log_level_idx'),
        ),
        # Composite: source + timestamp (dashboard source-stats with time filter)
        migrations.AddIndex(
            model_name='log',
            index=models.Index(fields=['source', 'timestamp'], name='api_log_source_ts_idx'),
        ),
        # Anomaly table
        migrations.AddIndex(
            model_name='anomaly',
            index=models.Index(fields=['score'],       name='api_anomaly_score_idx'),
        ),
        migrations.AddIndex(
            model_name='anomaly',
            index=models.Index(fields=['status'],      name='api_anomaly_status_idx'),
        ),
        migrations.AddIndex(
            model_name='anomaly',
            index=models.Index(fields=['created_at'],  name='api_anomaly_created_idx'),
        ),
    ]
