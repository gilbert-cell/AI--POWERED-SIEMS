from django.db import models

class Log(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=50)
    message = models.TextField()
    level = models.CharField(max_length=20, default='INFO')

    def __str__(self):
        return f"{self.source} - {self.timestamp}"


class Anomaly(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewing', 'Under Review'),
        ('confirmed', 'Confirmed Threat'),
        ('resolved', 'Resolved'),
        ('false_positive', 'False Positive'),
    ]
    
    log = models.OneToOneField(Log, on_delete=models.CASCADE, related_name='anomaly')
    anomaly_type = models.CharField(max_length=100, default='unknown')
    score = models.FloatField(default=0.0)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved = models.BooleanField(default=False)  # Keep for backward compatibility

    def __str__(self):
        return f"Anomaly for Log {self.log_id} ({self.anomaly_type}, score={self.score})"


class Rule(models.Model):
    SEVERITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')]
    TYPE_CHOICES = [('pattern', 'Pattern'), ('threshold', 'Threshold'), ('behavior', 'Behavioral'), ('ml', 'ML')]
    ACTION_CHOICES = [('alert', 'Alert'), ('block', 'Block'), ('notify', 'Notify'), ('log', 'Log Only')]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    rule_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='pattern')
    condition = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, default='alert')
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.severity})"


class Threshold(models.Model):
    ALERT_ON_CHOICES = [('exceed', 'Exceeds Value'), ('drop', 'Below Value'), ('deviation', 'Deviation')]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    metric = models.CharField(max_length=100, blank=True)
    value = models.FloatField(default=50)
    min_value = models.FloatField(default=0)
    max_value = models.FloatField(default=100)
    unit = models.CharField(max_length=50, blank=True)
    alert_on = models.CharField(max_length=20, choices=ALERT_ON_CHOICES, default='exceed')
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.value}{self.unit})"
