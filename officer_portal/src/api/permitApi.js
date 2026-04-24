import { apiRequest } from './client';

export function verifyPermit(token, qrPayload) {
  return apiRequest('/permits/verify', {
    method: 'POST',
    token,
    body: { qrPayload },
  });
}
