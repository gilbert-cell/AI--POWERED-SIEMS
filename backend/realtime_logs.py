"""
Real-time Log Monitoring Simulator
Simulates logs entering the SIEM system every few seconds
"""
import time
import random
from datetime import datetime
from pathlib import Path
import requests

# Simulated events — keywords match ANOMALY_PATTERNS in views.py
EVENTS = [
    {"type": "Login Failed",         "category": "auth",     "keyword": "authentication failure for user"},
    {"type": "Brute Force",           "category": "auth",     "keyword": "failed password attempt invalid user"},
    {"type": "Port Scan",             "category": "network",  "keyword": "UFW BLOCK DPT=22 SYN flood detected"},
    {"type": "Privilege Escalation",  "category": "security", "keyword": "sudo: privilege escalation attempt"},
    {"type": "SQL Injection",         "category": "web",      "keyword": "sql injection attempt detected in query"},
    {"type": "XSS Attack",            "category": "web",      "keyword": "xss cross-site scripting payload blocked"},
    {"type": "DDoS Attack",           "category": "network",  "keyword": "UFW BLOCK connection reset SYN flood"},
    {"type": "Malware Activity",      "category": "security", "keyword": "failed login malware signature match"},
    {"type": "Firewall Block",        "category": "network",  "keyword": "blocked port scan DPT=443"},
    {"type": "Login Success",         "category": "auth",     "keyword": "user authenticated successfully"},
    {"type": "File Access",           "category": "file",     "keyword": "file accessed by process"},
    {"type": "Config Change",         "category": "system",   "keyword": "config modified by admin"},
]

SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"]

SOURCES = [
    "firewall",
    "web-server",
    "database",
    "auth-service",
    "network-monitor",
    "ids-system",
    "filesystem",
    "application"
]

SOURCE_IPS = [
    "192.168.1.100",
    "192.168.1.101",
    "10.0.0.50",
    "10.0.0.51",
    "203.0.113.25",
    "198.51.100.42"
]

DEST_IPS = [
    "192.168.1.1",
    "10.0.0.1",
    "8.8.8.8",
    "1.1.1.1"
]


def generate_log():
    """Generate a simulated security event"""
    event = random.choice(EVENTS)
    severity = random.choice(SEVERITY_LEVELS)
    source = random.choice(SOURCES)
    src_ip = random.choice(SOURCE_IPS)
    dst_ip = random.choice(DEST_IPS)
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Construct log message
    message = (
        f"[{event['category'].upper()}] {event['type']} - "
        f"{event['keyword']} | "
        f"src={src_ip} dst={dst_ip} "
    )
    
    return {
        'timestamp': timestamp,
        'event_type': event['type'],
        'severity': severity,
        'source': source,
        'message': message,
        'category': event['category'],
    }


def send_to_siem(log, api_url="http://localhost:8000/api/logs/create/"):
    """Send log to SIEM API"""
    # Map simulator severity to Django log levels that trigger anomaly scoring
    level_map = {"Low": "INFO", "Medium": "WARNING", "High": "ERROR", "Critical": "CRITICAL"}
    try:
        data = {
            "message": log['message'],
            "source": log['source'],
            "level": level_map.get(log['severity'], 'INFO'),
        }
        response = requests.post(api_url, json=data, timeout=2)
        return response.status_code in (200, 201)
    except Exception:
        return False


def display_log(log, count, api_sent=False):
    """Display log in formatted way"""
    severity_emoji = {
        "Low": "🟢",
        "Medium": "🟡",
        "High": "🔴",
        "Critical": "🔴🔴"
    }
    emoji = severity_emoji.get(log['severity'], "🟡")
    api_icon = "✓" if api_sent else "✗"
    
    print(
        f"\n[{count:04d}] {emoji} [{log['timestamp']}] "
        f"API:{api_icon} | {log['event_type']:<25} | "
        f"{log['severity']:<8} | {log['source']}"
    )


def monitor_logs(duration=None, interval=2, send_to_api=False):
    """
    Monitor and display logs in real-time
    
    Args:
        duration: How many seconds to run (None = infinite)
        interval: Seconds between log events
        send_to_api: Whether to send logs to SIEM API
    """
    print("=" * 100)
    print("🔍 REAL-TIME LOG MONITORING SYSTEM")
    print("=" * 100)
    print(f"Starting log simulation | Interval: {interval}s | Send to API: {send_to_api}")
    print(f"Press Ctrl+C to stop\n")
    print("-" * 100)
    
    start_time = time.time()
    log_count = 0
    api_success = 0
    api_failed = 0
    
    try:
        while True:
            # Check if duration exceeded
            if duration and (time.time() - start_time) > duration:
                break
            
            # Generate and display log
            log = generate_log()
            log_count += 1
            
            # Try to send to API if enabled
            api_sent = False
            if send_to_api:
                api_sent = send_to_siem(log)
                if api_sent:
                    api_success += 1
                else:
                    api_failed += 1
            
            display_log(log, log_count, api_sent)
            
            # Display stats periodically
            if log_count % 10 == 0:
                elapsed = int(time.time() - start_time)
                print(f"\n📊 Stats: {log_count} logs in {elapsed}s | ", end="")
                if send_to_api:
                    print(f"API Success: {api_success}, Failed: {api_failed}")
                else:
                    print("API: Disabled")
            
            time.sleep(interval)
    
    except KeyboardInterrupt:
        print("\n\n" + "=" * 100)
        print("✅ Monitoring stopped by user")
        print("=" * 100)
        print(f"\n📈 Final Statistics:")
        print(f"  Total logs generated: {log_count}")
        print(f"  Duration: {int(time.time() - start_time)}s")
        print(f"  Avg rate: {log_count / (time.time() - start_time):.2f} logs/sec")
        if send_to_api:
            print(f"  API sends: {api_success} successful, {api_failed} failed")
        print("=" * 100)


if __name__ == "__main__":
    import sys
    
    # Parse arguments
    duration = None
    interval = 2
    send_api = False
    
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if arg.startswith("--duration="):
                duration = int(arg.split("=")[1])
            elif arg.startswith("--interval="):
                interval = int(arg.split("=")[1])
            elif arg == "--api":
                send_api = True
    
    monitor_logs(duration=duration, interval=interval, send_to_api=send_api)
