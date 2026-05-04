export const ROLES = {
  SECURITY_ADMINISTRATOR: 'Security Administrator',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
  AUDITOR_MANAGEMENT: 'Auditor Management',
};

export const DEFAULT_ROLE = ROLES.SYSTEM_ADMINISTRATOR;
export const ROLE_STORAGE_KEY = 'siem_current_role';
export const ROLE_CHANGE_EVENT = 'siem-role-change';

export const roleDefinitions = {
  [ROLES.SECURITY_ADMINISTRATOR]: {
    description: 'Operates the SOC workflow, investigates alerts, tunes detection, and manages threat response.',
    color: 'warning',
    permissions: [
      'Collect Security Logs',
      'Explore Threats',
      'Monitor Security Events',
      'Analyse Events Using AI',
      'Detect Anomalies',
      'Update AI Models',
      'Classify Threats',
      'Review and Investigate Generated Alerts',
      'Prioritize and Respond to Security Incidents',
      'Configure SIEM Rules and System Parameters',
    ],
    paths: ['/dashboard', '/logs', '/log-viewer', '/behavior', '/rules', '/ai-decisions', '/analytics', '/profile', '/settings'],
  },
  [ROLES.SYSTEM_ADMINISTRATOR]: {
    description: 'Owns platform administration, users and roles, storage, system settings, and performance.',
    color: 'error',
    permissions: [
      'Manage Users and Roles',
      'Maintain System Performance',
      'Manage Log Aggregation and Storage',
      'Configure SIEM Rules and System Parameters',
      'Audit Security Events and System Logs',
      'Monitor Security Events',
    ],
    paths: ['/dashboard', '/logs', '/log-viewer', '/rules', '/analytics', '/admin', '/profile', '/settings'],
  },
  [ROLES.AUDITOR_MANAGEMENT]: {
    description: 'Reviews evidence, reports, audit trails, and system effectiveness without changing detection logic.',
    color: 'info',
    permissions: [
      'Review Generated Security Reports',
      'Audit Security Events and System Logs',
      'Evaluate System Effectiveness',
      'Review and Investigate Generated Alerts',
      'Maintain System',
    ],
    paths: ['/dashboard', '/logs', '/log-viewer', '/analytics', '/profile'],
  },
};

export const allPermissions = Array.from(
  new Set(Object.values(roleDefinitions).flatMap((role) => role.permissions))
);

export const getStoredRole = () => {
  const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
  return roleDefinitions[storedRole] ? storedRole : DEFAULT_ROLE;
};

export const setStoredRole = (role) => {
  const nextRole = roleDefinitions[role] ? role : DEFAULT_ROLE;
  localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
  window.dispatchEvent(new CustomEvent(ROLE_CHANGE_EVENT, { detail: nextRole }));
  return nextRole;
};

export const canAccessPath = (role, pathname) => {
  const definition = roleDefinitions[role] || roleDefinitions[DEFAULT_ROLE];
  return definition.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

export const hasPermission = (role, permission) => {
  const definition = roleDefinitions[role] || roleDefinitions[DEFAULT_ROLE];
  return definition.permissions.includes(permission);
};
