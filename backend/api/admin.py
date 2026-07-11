from django.contrib import admin
from .models import Anomaly, Log, Rule, SystemSetting, Threshold, UserProfile

admin.site.register(Log)
admin.site.register(Anomaly)
admin.site.register(Rule)
admin.site.register(Threshold)
admin.site.register(UserProfile)
admin.site.register(SystemSetting)
