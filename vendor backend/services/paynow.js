const { Paynow } = require('paynow');

/**
 * Paynow service wrapper.
 *
 * Supports:
 * 1. Real Paynow requests
 * 2. Local mock responses for faster development/testing
 */
class PaynowService {
  constructor() {
    const integrationId = process.env.PAYNOW_INTEGRATION_ID;
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;

    this.mockEnabled = String(process.env.ENABLE_PAYNOW_MOCK || 'false').toLowerCase() === 'true';

    if (!this.mockEnabled) {
      if (!integrationId || !integrationKey) {
        throw new Error(
          'Missing Paynow credentials: set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY'
        );
      }

      this.paynow = new Paynow(integrationId, integrationKey);

      this.paynow.resultUrl =
        process.env.PAYNOW_RESULT_URL ||
        'http://localhost:5000/api/payments/paynow/update';

      this.paynow.returnUrl =
        process.env.PAYNOW_RETURN_URL ||
        'http://localhost:5000/paynow/return';
    }
  }

  /**
   * Simulate Paynow mobile payment locally.
   *
   * Test numbers aligned to Paynow docs:
   * 0771111111 -> success
   * 0772222222 -> delayed success
   * 0773333333 -> cancelled/failed
   * 0774444444 -> insufficient balance
   */
  async _mockInitiateMobilePayment({
    reference,
    email,
    amount,
    phone,
    method = 'ecocash',
    additionalInfo,
  }) {
    const normalizedPhone = String(phone).trim();

    if (normalizedPhone === '0774444444') {
      return {
        success: false,
        status: 'failed',
        error: 'Insufficient balance',
        reference,
        pollUrl: `mock://paynow/${reference}-${phone}`,
        instructions: 'Mock payment failed due to insufficient balance.',
        amount,
        email,
        method,
        additionalInfo,
      };
    }

    if (normalizedPhone === '0773333333') {
      return {
        success: true,
        status: 'failed',
        reference,
        pollUrl: `mock://paynow/${reference}-${phone}`,
        instructions: 'Mock payment created. Simulating user cancellation.',
        amount,
        email,
        method,
        additionalInfo,
      };
    }

    if (normalizedPhone === '0772222222') {
      return {
        success: true,
        status: 'pending',
        reference,
        pollUrl: `mock://paynow/${reference}-${phone}`,
        instructions: 'Mock delayed success payment request sent to phone.',
        amount,
        email,
        method,
        additionalInfo,
      };
    }

    // Default success path, including 0771111111
    return {
      success: true,
      status: 'pending',
      reference,
      pollUrl: `mock://paynow/${reference}-${phone}`,
      instructions: 'Mock payment request sent successfully.',
      amount,
      email,
      method,
      additionalInfo,
    };
  }

  async initiateMobilePayment({
    reference,
    email,
    amount,
    phone,
    method = 'ecocash',
    additionalInfo,
  }) {
    if (this.mockEnabled) {
      return this._mockInitiateMobilePayment({
        reference,
        email,
        amount,
        phone,
        method,
        additionalInfo,
      });
    }

    const payment = this.paynow.createPayment(reference, email || undefined);
    payment.add(
      additionalInfo || 'Vendor licensing payment',
      Number(amount)
    );

    return await this.paynow.sendMobile(payment, phone, method);
  }

  /**
   * Poll transaction status.
   * Supports mock:// poll URLs in local test mode.
   */
  async pollTransaction(pollUrl) {
  // 🔥 HANDLE MOCK PAYMENTS
  if (this.mockEnabled && String(pollUrl).startsWith('mock://')) {
    console.log('[MOCK PAYNOW] Polling mock transaction:', pollUrl);

    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // simulate different outcomes
    if (pollUrl.includes('0773333333')) {
      return {
        status: 'failed',
        paid: () => false,
      };
    }

    if (pollUrl.includes('0772222222')) {
      return {
        status: 'paid',
        paid: () => true,
      };
    }

    return {
      status: 'paid',
      paid: () => true,
    };
  }

  // REAL PAYNOW
  return await this.paynow.pollTransaction(pollUrl);
}
}

module.exports = PaynowService;