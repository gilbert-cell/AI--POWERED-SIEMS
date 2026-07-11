// Re-exports from split service files.
// All existing imports (e.g. `import { aiService } from '../services/api'`) continue to work.
export { authService }                                                from './authService';
export { adminService }                                               from './adminService';
export { logService }                                                 from './logService';
export { dashboardService }                                           from './dashboardService';
export { analyticsService }                                           from './analyticsService';
export { aiService, rulesService, thresholdsService, alertsService, behaviorService } from './domainServices';
export { default }                                                    from './apiClient';
