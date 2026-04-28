from django.urls import path
from . import views

urlpatterns = [
    # Root
    path('', views.api_root, name='api-root'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/source-stats/', views.dashboard_source_stats, name='dashboard-source-stats'),
    path('dashboard/trends/', views.dashboard_trends, name='dashboard-trends'),
    path('dashboard/top-alerts/', views.dashboard_top_alerts, name='dashboard-top-alerts'),
    path('dashboard/health/', views.dashboard_health, name='dashboard-health'),
    
    # Logs endpoints
    path('logs/', views.logs_list, name='logs-list'),
    path('logs/create/', views.create_log, name='create-log'),
    path('logs/search/', views.logs_search, name='logs-search'),
    path('logs/duplicates/', views.logs_duplicates, name='logs-duplicates'),
    path('logs/remove-duplicate/', views.remove_duplicate, name='remove-duplicate'),
    
    # Behavior Analysis endpoints
    path('behavior/analysis/', views.behavior_analysis, name='behavior-analysis'),
    path('behavior/anomalies/', views.behavior_anomalies, name='behavior-anomalies'),
    path('behavior/user/<str:user_id>/', views.behavior_user_analysis, name='behavior-user-analysis'),
    path('behavior/host/<str:host_id>/', views.behavior_host_analysis, name='behavior-host-analysis'),
    path('behavior/user/<str:user_id>/', views.behavior_user, name='behavior-user'),
    path('behavior/host/<str:host_id>/', views.behavior_host, name='behavior-host'),

    # AI anomaly detection endpoints
    path('detection/run/', views.run_anomaly_detection, name='run-anomaly-detection'),
    path('detection/anomalies/', views.behavior_anomalies, name='detection-anomalies'),

    # AI service endpoints
    path('ai/models/', views.ai_models_list, name='ai-models-list'),
    path('ai/models/<int:model_id>/', views.ai_model_detail, name='ai-model-detail'),
    path('ai/models/<int:model_id>/weights/', views.ai_model_weights, name='ai-model-weights'),
    path('ai/decisions/', views.ai_decisions, name='ai-decisions'),
    path('ai/decisions/advanced/', views.ai_advanced_decisions, name='ai-advanced-decisions'),
    path('ai/decisions/<int:decision_id>/override/', views.ai_override_decision, name='ai-override-decision'),
    path('ai/accuracy/', views.ai_accuracy, name='ai-accuracy'),
    path('ai/train/', views.ai_train, name='ai-train'),
    path('ai/predict/', views.ai_predict, name='ai-predict'),
    path('ai/dataset/preview/', views.ai_dataset_preview, name='ai-dataset-preview'),
    path('ai/dataset/load/', views.ai_load_dataset, name='ai-dataset-load'),
    
    # Anomaly management endpoints
    path('anomalies/<int:anomaly_id>/mark-false-positive/', views.mark_anomaly_false_positive, name='mark-anomaly-false-positive'),
    path('anomalies/<int:anomaly_id>/confirm-threat/', views.confirm_anomaly_threat, name='confirm-anomaly-threat'),
    
    # Rules endpoints
    path('rules/', views.rules_list, name='rules-list'),
    path('rules/<int:rule_id>/', views.rule_detail, name='rule-detail'),
    path('rules/<int:rule_id>/toggle/', views.rule_toggle, name='rule-toggle'),

    # Thresholds endpoints
    path('thresholds/', views.thresholds_list, name='thresholds-list'),
    path('thresholds/<int:threshold_id>/', views.threshold_detail, name='threshold-detail'),
    path('thresholds/<int:threshold_id>/toggle/', views.threshold_toggle, name='threshold-toggle'),
    path('thresholds/reset/', views.thresholds_reset, name='thresholds-reset'),
    
    # Analytics endpoints
    path('analytics/summary/', views.analytics_summary, name='analytics-summary'),
    path('analytics/severity-distribution/', views.analytics_severity_distribution, name='analytics-severity-distribution'),
    path('analytics/event-types/', views.analytics_event_types, name='analytics-event-types'),
    path('analytics/source-metrics/', views.analytics_source_metrics, name='analytics-source-metrics'),
    path('analytics/hourly-trends/', views.analytics_hourly_trends, name='analytics-hourly-trends'),
    path('analytics/response-metrics/', views.analytics_response_metrics, name='analytics-response-metrics'),
    path('analytics/detection-accuracy/', views.analytics_detection_accuracy, name='analytics-detection-accuracy'),
    path('analytics/top-hosts/', views.analytics_top_hosts, name='analytics-top-hosts'),
    path('analytics/export/', views.analytics_export, name='analytics-export'),
]
