import requests
import json
import subprocess  # nosec B404 — used only with fixed, hardcoded command lists, no user input
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))
from log_formatter import clean_message_for_formatting, format_log_line

API_URL = "http://localhost:8000/api/logs/create/"

def send_log(message, source, level='INFO'):
    """Send a log entry to the SIEM API"""
    # Clean and format the message in ISO 8601 style
    cleaned_message = clean_message_for_formatting(message)
    formatted_message = format_log_line(cleaned_message, source)
    
    data = {
        "message": formatted_message,
        "source": source,
        "level": level,
        "dataset_type": "network"
    }
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 200:
            print(f"✓ Sent {source} log")
        else:
            print(f"✗ Failed to send {source} log: {response.status_code}")
    except Exception as e:
        print(f"✗ Error sending {source} log: {e}")

def collect_file_logs(log_file, source, level='INFO', max_lines=20):
    """Collect logs from a file"""
    try:
        if not os.path.exists(log_file):
            print(f"⚠ {log_file} not found")
            return

        with open(log_file, "r", encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            # Get last max_lines entries
            recent_lines = lines[-max_lines:] if len(lines) > max_lines else lines

            for line in recent_lines:
                line = line.strip()
                if line:  # Skip empty lines
                    send_log(line, source, level)
    except PermissionError:
        print(f"⚠ Permission denied: {log_file}")
    except Exception as e:
        print(f"✗ Error reading {log_file}: {e}")

def collect_journalctl_logs():
    """Collect systemd journal logs"""
    try:
        # Get last 20 journal entries
        result = subprocess.run(  # nosec B603 B607 — fixed command list, no user-controlled input
            ['journalctl', '--since', '1 hour ago', '--no-pager', '-n', '20'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if line.strip():
                    send_log(line, "system", "INFO")
        else:
            print("⚠ journalctl command failed")
    except FileNotFoundError:
        print("⚠ journalctl not available")
    except Exception as e:
        print(f"✗ Error collecting journalctl logs: {e}")

def collect_logs():
    """Collect logs from all available sources"""
    print("🔍 Starting comprehensive log collection...")

    # Firewall logs
    collect_file_logs("/var/log/ufw.log",    "firewall",     "WARNING", 15)

    # System logs
    collect_file_logs("/var/log/syslog",     "system",       "INFO",    15)
    collect_file_logs("/var/log/kern.log",   "system",       "WARNING", 15)
    collect_file_logs("/var/log/boot.log",   "system",       "INFO",    10)

    # SSH logs
    collect_file_logs("/var/log/secure",     "ssh",          "WARNING", 15)

    # Auth-Service logs
    collect_file_logs("/var/log/auth.log",   "auth-service", "WARNING", 15)

    # File System logs
    collect_file_logs("/var/log/audit/audit.log", "file-system", "WARNING", 15)
    collect_file_logs("/var/log/dpkg.log",   "file-system",  "INFO",    10)
    collect_file_logs("/var/log/cloud-init.log", "file-system", "INFO",  5)

    # IDS-System logs
    security_logs = [
        "/var/log/fail2ban.log",
        "/var/log/suricata/fast.log",
        "/var/log/suricata/alerts.log",
    ]
    for log_file in security_logs:
        collect_file_logs(log_file, "ids-system", "WARNING", 15)

    # Web-Server logs
    web_logs = [
        "/var/log/apache2/access.log",
        "/var/log/apache2/error.log",
        "/var/log/nginx/access.log",
        "/var/log/nginx/error.log",
    ]
    for log_file in web_logs:
        collect_file_logs(log_file, "web-server", "INFO", 10)

    # Systemd journal (if available)
    collect_journalctl_logs()

    print("✅ Log collection complete!")

if __name__ == "__main__":
    collect_logs()