const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Format date using the same locale convention as the SIEM dashboard.
 */
export const formatDate = (date, fallback = '—') => {
  const parsed = toValidDate(date);
  return parsed ? parsed.toLocaleDateString() : fallback;
};

/**
 * Format datetime using the same locale convention as the SIEM dashboard.
 */
export const formatDateTime = (datetime, fallback = '—') => {
  const parsed = toValidDate(datetime);
  return parsed ? parsed.toLocaleString() : fallback;
};

/**
 * Format time using the same locale convention as the SIEM dashboard refresh label.
 */
export const formatTime = (datetime, fallback = '—') => {
  const parsed = toValidDate(datetime);
  return parsed ? parsed.toLocaleTimeString() : fallback;
};

const SYSLOG_RE = /^(\d{4}-\d{2}-\d{2}T\S+|\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:\s]+)(?:\[(\d+)\])?:\s*(.*)$/;

const pickField = (text, field) => {
  const match = (text || '').match(new RegExp(`${field}=([^\\]\\s;]+)`, 'i'));
  return match?.[1] || '';
};

export const parseSyslogMessage = (message = '') => {
  const match = message.match(SYSLOG_RE);
  if (!match) {
    return {
      rawTimestamp: '',
      host: '',
      process: '',
      pid: '',
      body: message || '',
      user: pickField(message, 'USER'),
      tty: pickField(message, 'TTY'),
      pwd: pickField(message, 'PWD'),
      command: pickField(message, 'COMMAND'),
    };
  }

  const [, rawTimestamp, host, process, pid = '', body = ''] = match;
  return {
    rawTimestamp,
    host,
    process,
    pid,
    body,
    user: pickField(body, 'USER'),
    tty: pickField(body, 'TTY'),
    pwd: pickField(body, 'PWD'),
    command: pickField(body, 'COMMAND'),
  };
};

export const isHostLog = (log = {}) => {
  const datasetType = (log.dataset_type || '').toLowerCase();
  const message = log.message || '';
  return datasetType === 'host' || /\b(sudo|sudo-i|CRON|pkexec|sshd|auditd|clamav|pam_unix)\b/i.test(message);
};

export const isNetworkLog = (log = {}) => {
  const datasetType = (log.dataset_type || '').toLowerCase();
  if (datasetType === 'network') return true;
  if (datasetType === 'host') return false;
  return !isHostLog(log);
};

export const getAuthResult = (log = {}) => {
  const eventType = (log.event_type || '').toUpperCase();
  const message = log.message || '';
  if (['LOGIN_FAILED', 'BRUTE_FORCE'].includes(eventType) || /failed password|authentication failure|invalid user/i.test(message)) return 'failed';
  if (['LOGIN_SUCCESS'].includes(eventType) || /accepted password|accepted publickey|session opened for user|new session/i.test(message)) return 'success';
  return 'info';
};

export const getHostLogCategory = (log = {}) => {
  const eventType = (log.event_type || '').toUpperCase();
  const message = log.message || '';
  // Network events are handled by the Network tab — exclude from host sections
  if (['PORT_SCAN', 'DDOS_ATTACK', 'DOS_ATTACK', 'RECONNAISSANCE', 'FIREWALL_BLOCK'].includes(eventType)) return null;
  if (
    ['LOGIN_FAILED', 'BRUTE_FORCE', 'LOGIN_SUCCESS'].includes(eventType) ||
    /failed password|authentication failure|invalid user|accepted password|accepted publickey|session opened for user|new session/i.test(message)
  ) return 'auth';
  if (eventType === 'PRIVILEGE_ESCALATION' || /\b(sudo|sudo-i|pkexec)\b/i.test(message)) return 'privilege_activity';
  if (/\bCRON\[/i.test(message)) return 'scheduled_tasks';
  if (['MALWARE_ACTIVITY', 'WORM', 'SHELLCODE', 'BACKDOOR'].includes(eventType) || /clamav|trojan|reverse shell|execve/i.test(message)) return 'process_security';
  if (/oom killer|out of memory|earlyoom|mem avail|segfault|kernel panic/i.test(message)) return 'system_activity';
  if (/networkmanager|network.*failed|connection.*failed|device.*state/i.test(message)) return 'system_activity';
  if (/kernel:|systemd-|gdm|gnome-shell/i.test(message)) return 'system_activity';
  return 'system_activity';
};

export const formatLogForDisplay = (log = {}) => {
  const parsed = parseSyslogMessage(log.message || '');
  const host = parsed.host || log.metadata?.host || log.source || 'host';
  const process = parsed.pid ? `${parsed.process}[${parsed.pid}]` : parsed.process || log.source || 'system';
  const details = [
    parsed.user && `user=${parsed.user}`,
    parsed.tty && `tty=${parsed.tty}`,
    parsed.pwd && `pwd=${parsed.pwd}`,
    parsed.command && `cmd=${parsed.command}`,
  ].filter(Boolean).join(' | ');

  return {
    timestamp: formatDateTime(log.timestamp),
    rawTimestamp: parsed.rawTimestamp,
    host,
    process,
    summary: parsed.body || log.message || 'N/A',
    details,
    score: Number(log.attacker_score || log.anomaly_score || log.ml_scores?.anomaly_score || 0),
  };
};

/**
 * Calculate duration between two dates
 */
export const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
};

/**
 * Get severity color — 5-level SIEM scale
 * 🔵 Informational | 🟢 Low | 🟡 Medium | 🟠 High | 🔴 Critical
 */
export const getSeverityColor = (severity) => {
  const colors = {
    informational: '#1565c0',  // 🔵 Blue
    critical:      '#c62828',  // 🔴 Red
    high:          '#e65100',  // 🟠 Orange
    medium:        '#f9a825',  // 🟡 Yellow
    low:           '#2e7d32',  // 🟢 Green
  };
  return colors[severity?.toLowerCase()] || '#607d8b';
};

/**
 * Get risk level color — maps severity levels to MUI color props
 */
export const getRiskColor = (risk) => {
  const colors = {
    critical:      'error',
    high:          'warning',
    medium:        'info',
    low:           'success',
    informational: 'primary',
  };
  return colors[risk?.toLowerCase()] || 'default';
};

/**
 * Format large numbers
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

/**
 * Truncate text
 */
export const truncateText = (text, length = 50) => {
  return text?.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
