"""
Log formatter utility to format logs in ISO 8601 style matching Linux auth.log format.

Format: 2026-06-22T23:25:01.707834+03:00 ubuntu CRON[180568]: message

This module provides utilities to:
1. Format timestamps in ISO 8601 with timezone
2. Add hostname and process information
3. Parse existing logs to extract these components
"""

import socket
import os
import re
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_HOSTNAME = socket.gethostname()
DEFAULT_TIMEZONE_OFFSET = "+00:00"  # Will be overridden by system timezone


def get_timezone_offset():
    """Get the system timezone offset in ISO 8601 format (e.g., '+03:00')"""
    try:
        import time
        if time.daylight:
            offset_seconds = -time.altzone
        else:
            offset_seconds = -time.timezone
        
        hours, remainder = divmod(abs(offset_seconds), 3600)
        minutes = remainder // 60
        sign = '+' if offset_seconds >= 0 else '-'
        return f"{sign}{hours:02d}:{minutes:02d}"
    except Exception:
        return DEFAULT_TIMEZONE_OFFSET


def format_timestamp_iso8601(dt=None, include_microseconds=True):
    """
    Format a datetime object to ISO 8601 with timezone.
    
    Args:
        dt: datetime object (defaults to now)
        include_microseconds: whether to include microseconds
    
    Returns:
        ISO 8601 formatted timestamp string (e.g., 2026-06-22T23:25:01.707834+03:00)
    """
    if dt is None:
        dt = datetime.now()
    
    # Get timezone info
    tz_offset = get_timezone_offset()
    
    if include_microseconds:
        return dt.strftime(f'%Y-%m-%dT%H:%M:%S.%f') + tz_offset
    else:
        return dt.strftime(f'%Y-%m-%dT%H:%M:%S') + tz_offset


def parse_log_message(message, source='auth-service', process_name=None, process_pid=None):
    """
    Parse a log message and extract or infer process information.
    
    Args:
        message: the log message body
        source: the source/service name (e.g., 'auth-service', 'firewall')
        process_name: process name (e.g., 'sshd', 'CRON'). If None, infer from source/message
        process_pid: process PID. If None, generate a realistic one
    
    Returns:
        dict with extracted info: {process_name, process_pid, message_body}
    """
    if process_name is None:
        # Infer from source
        source_to_process = {
            'auth-service': 'sshd',
            'system': 'systemd',
            'kernel': 'kernel',
            'firewall': 'ufw',
            'syslog': 'syslogd',
            'web-server': 'apache2',
            'nginx': 'nginx',
            'postgresql': 'postgres',
        }
        process_name = source_to_process.get(source.lower(), 'systemd')
    
    # Check if message starts with common process markers
    process_patterns = [
        (r'^(sshd)\[(\d+)\]:', 'sshd'),
        (r'^(CRON)\[(\d+)\]:', 'CRON'),
        (r'^(sudo)\[(\d+)\]:', 'sudo'),
        (r'^(kernel)\[', 'kernel'),
        (r'^(ufw):', 'ufw'),
        (r'^(systemd)\[(\d+)\]:', 'systemd'),
    ]
    
    for pattern, proc in process_patterns:
        match = re.match(pattern, message)
        if match:
            process_name = match.group(1)
            if len(match.groups()) > 1:
                process_pid = match.group(2)
            break
    
    # Generate realistic PID if not provided
    if process_pid is None:
        import random
        process_pid = random.randint(100, 999999)
    
    return {
        'process_name': process_name,
        'process_pid': int(process_pid) if process_pid else 0,
        'message_body': message.strip()
    }


def format_log_line(message, source='auth-service', hostname=None, process_name=None, 
                   process_pid=None, timestamp=None, include_microseconds=True):
    """
    Format a log message in Linux auth.log style (ISO 8601).
    
    Args:
        message: the log message
        source: the source/service (used to infer process name)
        hostname: the hostname (defaults to system hostname)
        process_name: the process name (e.g., 'sshd', 'CRON')
        process_pid: the process PID
        timestamp: datetime object (defaults to now)
        include_microseconds: whether to include microseconds in timestamp
    
    Returns:
        Formatted log line string
        Example: 2026-06-22T23:25:01.707834+03:00 ubuntu sshd[123456]: Failed password for root from 192.168.1.1
    """
    # Default hostname
    if hostname is None:
        hostname = DEFAULT_HOSTNAME
    
    # Parse and extract process info
    parsed = parse_log_message(message, source, process_name, process_pid)
    
    # Format timestamp
    iso_timestamp = format_timestamp_iso8601(timestamp, include_microseconds)
    
    # Build the formatted line
    formatted = f"{iso_timestamp} {hostname} {parsed['process_name']}[{parsed['process_pid']}]: {parsed['message_body']}"
    
    return formatted


def parse_formatted_log_line(log_line):
    """
    Parse a formatted log line and extract components.
    
    Args:
        log_line: a formatted log line
    
    Returns:
        dict with: {timestamp, hostname, process_name, process_pid, message}
        or None if parsing fails
    """
    # Pattern: 2026-06-22T23:25:01.707834+03:00 ubuntu CRON[180568]: message
    pattern = r'^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+[+-]\d{2}:\d{2})\s+(\S+)\s+(\w+)\[(\d+)\]:\s*(.*)$'
    
    match = re.match(pattern, log_line)
    if match:
        return {
            'timestamp': match.group(1),
            'hostname': match.group(2),
            'process_name': match.group(3),
            'process_pid': int(match.group(4)),
            'message': match.group(5),
        }
    
    return None


def clean_message_for_formatting(message):
    """
    Clean a message by removing existing process/timestamp prefixes.
    
    This allows re-formatting messages that already have syslog/journald prefixes.
    """
    # Remove ISO 8601 timestamp prefix (journald)
    message = re.sub(r'^\d{4}-\d{2}-\d{2}T[\d:.+\-]+\s+\S+\s+', '', message)
    
    # Remove syslog prefix (e.g., "Jan  1 00:00:00 host sshd:")
    message = re.sub(r'^\w{3}\s+\d+\s+[\d:]+\s+\S+\s+', '', message)
    
    # Remove hostname at start
    message = re.sub(r'^\S+\s+', '', message)
    
    # Remove process[pid]: prefix (keep the rest of the message)
    message = re.sub(r'^\w+\[\d+\]:\s*', '', message)
    
    return message.strip()
