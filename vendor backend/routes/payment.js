const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const { authenticateVendor } = require('../middleware/auth');
const PaynowService = require('../services/paynow');
const { mapPaynowStatus } = require('../utils/paymentStatus');

const paynow = new PaynowService();

router.post('/paynow', authenticateVendor, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      applicationId,
      amount,
      phoneNumber,
      paymentFor = 'application_fee',
      stallId,
      useMockPayment = false,
    } = req.body;

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0 || !phoneNumber) {
      return res.status(400).json({
        error: 'Valid amount and phoneNumber are required',
      });
    }

    if (paymentFor === 'application_fee' && !applicationId) {
      return res.status(400).json({
        error: 'applicationId is required for application fee payment',
      });
    }

    if (paymentFor === 'rent' && !stallId) {
      return res.status(400).json({
        error: 'stallId is required for rent payment',
      });
    }

    if (paymentFor === 'application_fee') {
      const appCheck = await client.query(
        `
        SELECT id, vendor_id
        FROM license_applications
        WHERE id = $1 AND vendor_id = $2
        LIMIT 1
        `,
        [applicationId, req.user.id]
      );

      if (appCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Application not found for this vendor.',
        });
      }
    }

    if (paymentFor === 'rent') {
      const stallCheck = await client.query(
        `
        SELECT id
        FROM stalls
        WHERE id = $1
        LIMIT 1
        `,
        [stallId]
      );

      if (stallCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Stall not found.',
        });
      }
    }

    const vendorResult = await client.query(
      `SELECT email FROM vendor_login WHERE id = $1 LIMIT 1`,
      [req.user.id]
    );

    const vendorEmail = vendorResult.rows[0]?.email || 'vendor@example.com';

    const merchantReference =
      paymentFor === 'rent'
        ? `RENT-${stallId}-${phoneNumber}-${Date.now()}`
        : `APP-${applicationId}-${phoneNumber}-${Date.now()}`;

    // In practice, useMockPayment is just an explicit signal for frontend;
    // actual behavior depends on ENABLE_PAYNOW_MOCK in the service.
    const paynowResponse = await paynow.initiateMobilePayment({
      reference: merchantReference,
      email: vendorEmail,
      amount: numericAmount,
      phone: phoneNumber,
      method: 'ecocash',
      additionalInfo:
        paymentFor === 'rent'
          ? `Stall rent payment for stall ${stallId}`
          : `License application fee for application ${applicationId}`,
    });

    const paymentStatus = mapPaynowStatus(
      paynowResponse.status,
      typeof paynowResponse.paid === 'function' ? paynowResponse.paid() : false
    );

    const transactionId =
      paynowResponse.reference ||
      paynowResponse.pollUrl ||
      merchantReference;

    await client.query('BEGIN');

    const payment = await client.query(
      `
      INSERT INTO payments
        (
          vendor_id,
          application_id,
          stall_id,
          amount,
          payment_for,
          payment_method,
          transaction_id,
          external_reference,
          status,
          phone_number,
          external_payload,
          paid_at,
          created_at,
          updated_at
        )
      VALUES
        (
          $1, $2, $3, $4, $5, 'paynow', $6, $7, $8, $9, $10,
          CASE WHEN $11::text = 'completed' THEN NOW() ELSE NULL END,
          NOW(), NOW()
        )
      RETURNING *
      `,
      [
        req.user.id,
        applicationId || null,
        stallId || null,
        numericAmount,
        paymentFor,
        transactionId,
        merchantReference,
        paymentStatus,
        phoneNumber,
        JSON.stringify(paynowResponse),
        paymentStatus,
      ]
    );

    if (paymentFor === 'application_fee') {
      if (paymentStatus === 'completed') {
        await client.query(
          `
          UPDATE license_applications
          SET payment_status = 'paid',
              status = 'pending',
              submitted_at = NOW(),
              updated_at = NOW()
          WHERE id = $1 AND vendor_id = $2
          `,
          [applicationId, req.user.id]
        );
      } else if (paymentStatus === 'failed') {
        await client.query(
          `
          UPDATE license_applications
          SET payment_status = 'failed',
              updated_at = NOW()
          WHERE id = $1 AND vendor_id = $2
          `,
          [applicationId, req.user.id]
        );
      }
    }

    await client.query('COMMIT');

    let message = 'Payment request sent successfully.';

    if (paymentFor === 'application_fee') {
      if (paymentStatus === 'completed') {
        message = 'Application was sent and is waiting for approval.';
      } else if (paymentStatus === 'pending') {
        message =
          paynowResponse.instructions ||
          'Payment request sent to your phone. Complete it to submit the application.';
      } else {
        message = paynowResponse.error || 'Payment failed.';
      }
    } else {
      if (paymentStatus === 'completed') {
        message = 'Rent payment completed successfully.';
      } else if (paymentStatus === 'pending') {
        message =
          paynowResponse.instructions ||
          'Rent payment request sent to your phone. Complete it to finish payment.';
      } else {
        message = paynowResponse.error || 'Rent payment failed.';
      }
    }

    return res.json({
      success: paynowResponse.success === true,
      message,
      paymentStatus,
      mockMode: paynow.mockEnabled || useMockPayment,
      payment: payment.rows[0],
      paynowResponse,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    console.error('PAYNOW PAYMENT ERROR:', error);

    return res.status(500).json({
      error: 'Failed to process Paynow payment.',
      detail: error.message,
    });
  } finally {
    client.release();
  }
});

router.get('/paynow/status/:paymentId', authenticateVendor, async (req, res) => {
  const client = await pool.connect();

  try {
    const paymentResult = await client.query(
      `
      SELECT *
      FROM payments
      WHERE id = $1 AND vendor_id = $2
      LIMIT 1
      `,
      [req.params.paymentId, req.user.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found.' });
    }

    const payment = paymentResult.rows[0];
    const payload = payment.external_payload || {};
    const pollUrl = payload.pollUrl || payload.pollurl;

    if (!pollUrl) {
      return res.status(400).json({
        error: 'No Paynow pollUrl stored for this payment.',
      });
    }

    const statusResponse = await paynow.pollTransaction(pollUrl);

    const paymentStatus = mapPaynowStatus(
      statusResponse.status,
      typeof statusResponse.paid === 'function' ? statusResponse.paid() : false
    );

    await client.query('BEGIN');

    await client.query(
      `
      UPDATE payments
      SET status = $2,
          external_payload = $3,
          paid_at = CASE
            WHEN $2::text = 'completed' THEN COALESCE(paid_at, NOW())
            ELSE paid_at
          END,
          updated_at = NOW()
      WHERE id = $1
      `,
      [payment.id, paymentStatus, JSON.stringify(statusResponse)]
    );

    if (
      payment.payment_for === 'application_fee' &&
      payment.application_id &&
      paymentStatus === 'completed'
    ) {
      await client.query(
        `
        UPDATE license_applications
        SET payment_status = 'paid',
            status = 'pending',
            submitted_at = COALESCE(submitted_at, NOW()),
            updated_at = NOW()
        WHERE id = $1
        `,
        [payment.application_id]
      );
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      paymentStatus,
      statusResponse,
      mockMode: paynow.mockEnabled,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    console.error('PAYNOW STATUS POLL ERROR:', error);
    return res.status(500).json({
      error: 'Failed to poll Paynow transaction status.',
      detail: error.message,
    });
  } finally {
    client.release();
  }
});

router.get('/my-payments', authenticateVendor, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM payments
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('GET MY PAYMENTS ERROR:', error);
    return res.status(500).json({
      error: 'Failed to fetch payments.',
    });
  }

});

module.exports = router;