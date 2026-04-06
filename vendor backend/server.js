require('dotenv').config();

const express = require('express');
const cors = require('cors');

const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const businessTypesRoutes = require('./routes/businessTypes');
const applicationsRoutes = require('./routes/applications');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const stallsRoutes = require('./routes/stalls');
const financialsRoutes = require('./routes/financials');
const { mapPaynowStatus } = require('./utils/paymentStatus');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/ping', (req, res) => {
  res.json({
    status: 'pong',
    service: 'vendor-licensing-backend',
    timestamp: new Date(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Vendor Licensing Backend is running!',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/business-types', businessTypesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stalls', stallsRoutes);
app.use('/api/financials', financialsRoutes);

app.get('/paynow/return', (req, res) => {
  res.send('Payment process completed. You can return to the mobile app.');
});

/**
 * Paynow result callback endpoint.
 * This endpoint tries to locate a payment by external reference or transaction id
 * and updates its status.
 */
app.post('/api/payments/paynow/update', async (req, res) => {
  const client = await pool.connect();

  try {
    console.log('PAYNOW RESULT CALLBACK:', req.body);

    const incomingReference =
      req.body?.reference ||
      req.body?.merchantReference ||
      req.body?.external_reference ||
      req.body?.paynowreference ||
      req.body?.paynow_reference ||
      null;

    const paidFlag =
      req.body?.paid === true ||
      String(req.body?.status || '').toLowerCase().includes('paid');

    const paymentStatus = mapPaynowStatus(req.body?.status, paidFlag);

    if (!incomingReference) {
      return res.status(200).send('OK');
    }

    await client.query('BEGIN');

    const paymentResult = await client.query(
      `
      SELECT *
      FROM payments
      WHERE external_reference = $1
         OR transaction_id = $1
      LIMIT 1
      `,
      [incomingReference]
    );

    if (paymentResult.rows.length > 0) {
      const payment = paymentResult.rows[0];

      await client.query(
        `
        UPDATE payments
        SET status = $2,
            external_payload = $3,
            paid_at = CASE
              WHEN $2 = 'completed' THEN COALESCE(paid_at, NOW())
              ELSE paid_at
            END,
            updated_at = NOW()
        WHERE id = $1
        `,
        [payment.id, paymentStatus, JSON.stringify(req.body)]
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
    }

    await client.query('COMMIT');
    return res.status(200).send('OK');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    console.error('PAYNOW CALLBACK ERROR:', error);
    return res.status(500).send('ERROR');
  } finally {
    client.release();
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('UNHANDLED SERVER ERROR:', err);

  res.status(500).json({
    error: 'Internal server error',
    detail: err.message,
  });
});

pool
  .query('SELECT NOW()')
  .then((result) => {
    console.log('PostgreSQL connected:', result.rows[0]);
  })
  .catch((err) => {
    console.error('PostgreSQL connection failed:', err.message);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});