/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

/**
 * Format datetime to readable string
 */
export const formatDateTime = (datetime) => {
  return new Date(datetime).toLocaleString();
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
 * Get severity color
 */
export const getSeverityColor = (severity) => {
  const colors = {
    critical: '#d32f2f',
    high: '#f57c00',
    medium: '#fbc02d',
    low: '#388e3c',
  };
  return colors[severity?.toLowerCase()] || '#999';
};

/**
 * Get risk level color
 */
export const getRiskColor = (risk) => {
  const colors = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
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
