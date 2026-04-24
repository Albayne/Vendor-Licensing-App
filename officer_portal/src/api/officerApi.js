import { apiRequest } from './client';

export function fetchDashboardSummary(token) {
  return apiRequest('/officer/dashboard', { token });
}
