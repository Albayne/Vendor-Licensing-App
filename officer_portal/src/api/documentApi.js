import { apiRequest } from './client';

export function verifyDocument(token, documentId, verificationStatus, rejectionReason = '') {
  return apiRequest(`/documents/${documentId}/verify`, {
    method: 'POST',
    token,
    body: {
      verificationStatus,
      rejectionReason,
    },
  });
}
