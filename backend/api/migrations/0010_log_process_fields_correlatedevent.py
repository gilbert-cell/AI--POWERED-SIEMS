from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_systemsetting'),
    ]

    operations = [
        # System Activity & Process Behavior fields on Log
        migrations.AddField(
            model_name='log',
            name='process_name',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='log',
            name='process_pid',
            field=models.IntegerField(blank=True, null=True),
        ),
        # Event Correlation & Aggregation model
        migrations.CreateModel(
            name='CorrelatedEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('correlation_id', models.CharField(db_index=True, max_length=64)),
                ('event_type', models.CharField(blank=True, max_length=30)),
                ('src_ip', models.GenericIPAddressField(blank=True, null=True)),
                ('event_count', models.IntegerField(default=1)),
                ('severity', models.CharField(
                    choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')],
                    default='LOW', max_length=10,
                )),
                ('aggregate_score', models.FloatField(default=0.0)),
                ('first_seen', models.DateTimeField()),
                ('last_seen', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('logs', models.ManyToManyField(related_name='correlated_events', to='api.log')),
            ],
        ),
        migrations.AddIndex(
            model_name='correlatedevent',
            index=models.Index(fields=['correlation_id'], name='api_correv_correid_idx'),
        ),
        migrations.AddIndex(
            model_name='correlatedevent',
            index=models.Index(fields=['aggregate_score'], name='api_correv_score_idx'),
        ),
        migrations.AddIndex(
            model_name='correlatedevent',
            index=models.Index(fields=['last_seen'], name='api_correv_lastseen_idx'),
        ),
    ]
