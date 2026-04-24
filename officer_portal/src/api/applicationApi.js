import { apiRequest } from './client';

export function fetchPendingApplications(token) {
  return apiRequest('/applications/pending', { token });
}

export function fetchApplicationDetails(token, applicationId) {
  return apiRequest(`/applications/${applicationId}`, { token });
}

export function approveApplication(token, applicationId) {
  return apiRequest(`/applications/${applicationId}/approve`, {
    method: 'POST',
    token,
  });
}

export function rejectApplication(token, applicationId, reviewComments) {
  return apiRequest(`/applications/${applicationId}/reject`, {
    method: 'POST',
    token,
    body: { reviewComments },
  });
}
