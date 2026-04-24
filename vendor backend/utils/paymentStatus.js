/**
 * Shared helper to normalize Paynow status text into
 * our local app payment status values.
 */
function mapPaynowStatus(statusValue, paidFlag = false) {
  const status = String(statusValue || '').toLowerCase();

  if (paidFlag || status.includes('paid') || status.includes('success')) {
    return 'completed';
  }

  if (
    status.includes('sent') ||
    status.includes('awaiting') ||
    status.includes('pending') ||
    status.includes('created')
  ) {
    return 'pending';
  }

  if (
    status.includes('failed') ||
    status.includes('cancelled') ||
    status.includes('error')
  ) {
    return 'failed';
  }

  return 'pending';
}

module.exports = {
  mapPaynowStatus,
};