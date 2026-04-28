import requests
import json
import subprocess
import os

API_URL = "http://localhost:8000/api/logs/create/"

def send_log(message, source, level='INFO'):
    """Send a log entry to the SIEM API"""
    data = {
        "message": message,
        "source": source,
        "level": level
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
        result = subprocess.run(
            ['journalctl', '--since', '1 hour ago', '--no-pager', '-n', '20'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if line.strip():
                    send_log(line, "systemd", "INFO")
        else:
            print("⚠ journalctl command failed")
    except FileNotFoundError:
        print("⚠ journalctl not available")
    except Exception as e:
        print(f"✗ Error collecting journalctl logs: {e}")

def collect_logs():
    """Collect logs from all available sources"""
    print("🔍 Starting comprehensive log collection...")

    # System logs
    collect_file_logs("/var/log/syslog", "syslog", "INFO", 15)
    collect_file_logs("/var/log/kern.log", "kernel", "WARNING", 15)
    collect_file_logs("/var/log/auth.log", "auth", "WARNING", 15)
    collect_file_logs("/var/log/ufw.log", "firewall", "WARNING", 15)

    # Package management
    collect_file_logs("/var/log/dpkg.log", "packages", "INFO", 10)

    # Database logs
    collect_file_logs("/var/log/postgresql/postgresql-16-main.log", "postgresql", "INFO", 10)

    # Boot and system initialization
    collect_file_logs("/var/log/boot.log", "boot", "INFO", 10)

    # Cloud-init (if applicable)
    collect_file_logs("/var/log/cloud-init.log", "cloud-init", "INFO", 5)

    # Systemd journal (if available)
    collect_journalctl_logs()

    # Check for web servers
    web_logs = [
        "/var/log/apache2/access.log",
        "/var/log/apache2/error.log",
        "/var/log/nginx/access.log",
        "/var/log/nginx/error.log",
    ]
    for log_file in web_logs:
        collect_file_logs(log_file, "webserver", "INFO", 10)

    # Check for mail server
    mail_logs = [
        "/var/log/mail.log",
        "/var/log/mail.err",
    ]
    for log_file in mail_logs:
        collect_file_logs(log_file, "mail", "INFO", 10)

    # Check for intrusion detection/prevention
    security_logs = [
        "/var/log/fail2ban.log",
        "/var/log/suricata/fast.log",
        "/var/log/suricata/alerts.log",
    ]
    for log_file in security_logs:
        collect_file_logs(log_file, "ids", "ALERT", 15)

    print("✅ Log collection complete!")

if __name__ == "__main__":
    collect_logs()