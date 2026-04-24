import { apiRequest } from './client';

export function loginOfficer(email, password) {
  return apiRequest('/auth/officer/login', {
    method: 'POST',
    body: { email, password },
  });
}
