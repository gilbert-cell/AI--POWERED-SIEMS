from django.db import models
from django.contrib.auth.models import User

class Log(models.Model):
    SEVERITY_CHOICES = [('LOW','Low'),('MEDIUM','Medium'),('HIGH','High'),('CRITICAL','Critical')]
    EVENT_TYPE_CHOICES = [
        ('LOGIN_SUCCESS','Login Success'), ('LOGIN_FAILED','Login Failed'),
        ('BRUTE_FORCE','Brute Force'), ('SQL_INJECTION','SQL Injection'),
        ('XSS_ATTACK','XSS Attack'), ('PORT_SCAN','Port Scan'),
        ('PRIVILEGE_ESCALATION','Privilege Escalation'), ('EXPLOIT_ATTEMPT','Exploit Attempt'),
        ('MALWARE_ACTIVITY','Malware Activity'), ('DDOS_ATTACK','DDoS Attack'),
        ('FIREWALL_BLOCK','Firewall Block'), ('RECONNAISSANCE','Reconnaissance'),
        ('BACKDOOR','Backdoor'), ('SHELLCODE','Shellcode'),
        ('FUZZER','Fuzzer'), ('WORM','Worm'),
        ('DOS_ATTACK','DoS Attack'), ('CONFIG_CHANGE','Config Change'),
        ('FILE_ACCESS','File Access'), ('GENERIC_ATTACK','Generic Attack'), ('UNKNOWN','Unknown'),
    ]

    # Core fields
    timestamp   = models.DateTimeField(auto_now_add=True)
    source      = models.CharField(max_length=100)
    message     = models.TextField()
    level       = models.CharField(max_length=20, default='INFO')   # Django log level (INFO/WARNING/ERROR/CRITICAL)

    # Structured fields — ML-ready
    event_type      = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES, default='UNKNOWN')
    severity        = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    attack_category = models.CharField(max_length=50, blank=True, default='')
    protocol        = models.CharField(max_length=10, blank=True, default='')
    service         = models.CharField(max_length=20, blank=True, default='')
    state           = models.CharField(max_length=10, blank=True, default='')
    src_ip          = models.GenericIPAddressField(null=True, blank=True)
    dst_ip          = models.GenericIPAddressField(null=True, blank=True)
    port            = models.IntegerField(null=True, blank=True)

    # Numeric features for ML
    duration        = models.FloatField(null=True, blank=True)
    packets_sent    = models.IntegerField(null=True, blank=True)
    bytes_sent      = models.IntegerField(null=True, blank=True)

    # ML output — stored directly so rule engine can query without joining Anomaly table
    anomaly_score   = models.FloatField(default=0.0, db_index=True)
    if_score        = models.FloatField(default=0.0)   # Isolation Forest score
    rf_score        = models.FloatField(default=0.0)   # Random Forest score

    def __str__(self):
        return f"{self.event_type} | {self.source} - {self.timestamp}"


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
    # Time-window in minutes for count-based / behavioral rules (0 = no window)
    time_window = models.PositiveIntegerField(default=0)
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


class UserProfile(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=64, default='System Administrator')
    phone = models.CharField(max_length=32, blank=True, default='')
    department = models.CharField(max_length=120, blank=True, default='Security Operations (SOC)')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email or self.user.username} ({self.role})"
