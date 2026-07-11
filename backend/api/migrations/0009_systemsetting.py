from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_add_performance_indexes'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=80, unique=True)),
                ('value', models.JSONField(default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
