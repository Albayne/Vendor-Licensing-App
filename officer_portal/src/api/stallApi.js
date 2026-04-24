import { apiRequest } from './client';

export function fetchApplicationsAwaitingAllocation(token) {
  return apiRequest('/applications/awaiting-allocation', { token });
}

export function fetchVacantStalls(token, marketId = '') {
  const query = marketId ? `?marketId=${marketId}` : '';
  return apiRequest(`/stalls/vacant${query}`, { token });
}

export function allocateStall(token, applicationId, stallId) {
  return apiRequest('/stalls/allocate', {
    method: 'POST',
    token,
    body: { applicationId, stallId },
  });
}
