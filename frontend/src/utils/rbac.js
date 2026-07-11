export const ROLES = {
  SYSTEM_ADMINISTRATOR: 'System Administrator',
  SECURITY_ANALYST: 'Security Analyst',
  SECURITY_AUDITOR: 'Security Auditor / Audit Manager',
};

export const DEFAULT_ROLE = ROLES.SYSTEM_ADMINISTRATOR;
export const ROLE_STORAGE_KEY = 'siem_current_role';
export const ROLE_CHANGE_EVENT = 'siem-role-change';

const ROLE_ALIASES = {
  'Security Administrator': ROLES.SECURITY_ANALYST,
  'Auditor Management': ROLES.SECURITY_AUDITOR,
  Auditor: ROLES.SECURITY_AUDITOR,
  'Audit Manager': ROLES.SECURITY_AUDITOR,
  'Security Auditor': ROLES.SECURITY_AUDITOR,
};

export const roleDefinitions = {
  [ROLES.SYSTEM_ADMINISTRATOR]: {
    description: 'Owns platform administration, access control, infrastructure, storage, availability, and maintenance.',
    color: 'error',
    permissions: [
      'Manage users and access permissions',
      'Configure SIEM infrastructure and integrations',
      'Manage log aggregation, storage, and backups',
      'Monitor system performance and availability',
      'Maintain server and database security',
      'Apply updates, patches, and system maintenance',
      'Configure system parameters and operational settings',
    ],
    paths: ['/dashboard', '/logs', '/log-viewer', '/rules', '/analytics', '/admin', '/profile', '/settings'],
  },
  [ROLES.SECURITY_ANALYST]: {
    description: 'Monitors security events, investigates incidents, tunes detections, and hunts for threats.',
    color: 'warning',
    permissions: [
      'Monitor security events and alerts',
      'Analyse logs using AI and correlation rules',
      'Detect anomalies and suspicious activities',
      'Investigate and respond to security incidents',
      'Tune SIEM rules and detection models',
      'Conduct threat hunting activities',
      'Generate incident analysis reports',
    ],
    paths: ['/dashboard', '/logs', '/log-viewer', '/behavior', '/rules', '/ai-decisions', '/analytics', '/profile', '/settings'],
  },
  [ROLES.SECURITY_AUDITOR]: {
    description: 'Reviews audit trails, compliance evidence, detection effectiveness, reports, and governance improvements.',
    color: 'info',
    permissions: [
      'Review audit trails and system activity logs',
      'Verify compliance with security policies',
      'Evaluate SIEM detection effectiveness',
      'Review generated reports and incident records',
      'Assess alert handling and response procedures',
      'Produce audit and compliance reports',
      'Recommend security and governance improvements',
    ],
    paths: ['/dashboard', '/logs', '/log-viewer', '/analytics', '/profile'],
  },
};

export const allPermissions = Array.from(
  new Set(Object.values(roleDefinitions).flatMap((role) => role.permissions))
);

export const normalizeRole = (role) => {
  const value = (role || '').trim();
  return roleDefinitions[value] ? value : ROLE_ALIASES[value] || DEFAULT_ROLE;
};

export const getStoredRole = () => {
  return normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY));
};

export const setStoredRole = (role) => {
  const nextRole = normalizeRole(role);
  localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
  window.dispatchEvent(new CustomEvent(ROLE_CHANGE_EVENT, { detail: nextRole }));
  return nextRole;
};

export const canAccessPath = (role, pathname) => {
  const definition = roleDefinitions[normalizeRole(role)];
  return definition.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

export const hasPermission = (role, permission) => {
  const definition = roleDefinitions[normalizeRole(role)];
  return definition.permissions.includes(permission);
};
