import { apiRequest } from './client';

export function fetchAuditLogs(token) {
  return apiRequest('/audit-logs', { token });
}
