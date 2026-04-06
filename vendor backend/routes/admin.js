const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/applications
 * Admin sees all applications from vendors.
 */
router.get('/applications', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        a.*,
        v.username,
        v.email,
        v.phone AS vendor_phone,
        v.full_name,
        bt.name AS business_type,
        s.stall_number,
        s.location AS stall_location
      FROM license_applications a
      JOIN vendor_login v ON v.id = a.vendor_id
      LEFT JOIN business_types bt ON bt.id = a.business_type_id
      LEFT JOIN stalls s ON s.id = a.allocated_stall_id
      ORDER BY a.created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ADMIN GET APPLICATIONS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

/**
 * GET /api/admin/stalls/available
 * Admin gets stalls that are still available for allocation.
 */
router.get('/stalls/available', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM stalls
      WHERE status = 'available'
      ORDER BY stall_number ASC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ADMIN GET AVAILABLE STALLS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch available stalls.' });
  }
});

/**
 * GET /api/admin/stalls
 * Admin sees all stalls.
 */
router.get('/stalls', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        s.*,
        v.username,
        v.email,
        v.full_name
      FROM stalls s
      LEFT JOIN vendor_login v ON v.id = s.current_vendor_id
      ORDER BY s.stall_number ASC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ADMIN GET STALLS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch stalls.' });
  }
});

/**
 * POST /api/admin/applications/:id/approve
 * Approve an application and allocate a stall.
 */
router.post('/applications/:id/approve', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { stallId } = req.body;
    const applicationId = req.params.id;

    if (!stallId) {
      return res.status(400).json({ error: 'stallId is required.' });
    }

    await client.query('BEGIN');

    const appResult = await client.query(
      `
      SELECT *
      FROM license_applications
      WHERE id = $1
      FOR UPDATE
      `,
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found.' });
    }

    const application = appResult.rows[0];

    if (application.payment_status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Application cannot be approved before payment is completed.',
      });
    }

    const stallResult = await client.query(
      `
      SELECT *
      FROM stalls
      WHERE id = $1
      FOR UPDATE
      `,
      [stallId]
    );

    if (stallResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Selected stall not found.' });
    }

    const stall = stallResult.rows[0];

    if (stall.status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Selected stall is not available.' });
    }

    const approved = await client.query(
      `
      UPDATE license_applications
      SET status = 'approved',
          reviewed_by = $1,
          reviewed_date = NOW(),
          allocated_stall_id = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [req.user.username || 'admin', stallId, applicationId]
    );

    const licenseNumber = `LIC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    await client.query(
      `
      INSERT INTO approved_licenses
        (application_id, vendor_id, license_number, approved_by, approved_at, valid_from, status)
      VALUES
        ($1, $2, $3, $4, NOW(), CURRENT_DATE, 'active')
      ON CONFLICT (application_id) DO NOTHING
      `,
      [
        approved.rows[0].id,
        approved.rows[0].vendor_id,
        licenseNumber,
        req.user.username || 'admin',
      ]
    );

    await client.query(
      `
      UPDATE stalls
      SET status = 'occupied',
          current_vendor_id = $2,
          allocated_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      `,
      [stallId, approved.rows[0].vendor_id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Application approved and stall allocated successfully.',
      application: approved.rows[0],
      licenseNumber,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    console.error('ADMIN APPROVE APPLICATION ERROR:', error);
    return res.status(500).json({
      error: 'Failed to approve application.',
      detail: error.message,
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/applications/:id/reject
 * Reject an application.
 */
router.post('/applications/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const result = await pool.query(
      `
      UPDATE license_applications
      SET status = 'rejected',
          reviewed_by = $1,
          reviewed_date = NOW(),
          rejection_reason = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [req.user.username || 'admin', rejectionReason || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json({
      success: true,
      message: 'Application rejected successfully.',
      application: result.rows[0],
    });
  } catch (error) {
    console.error('ADMIN REJECT APPLICATION ERROR:', error);
    return res.status(500).json({ error: 'Failed to reject application.' });
  }
});

/**
 * GET /api/admin/payments
 * Admin sees all vendor payments.
 */
router.get('/payments', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        v.username,
        v.email,
        v.full_name
      FROM payments p
      JOIN vendor_login v ON v.id = p.vendor_id
      ORDER BY p.created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ADMIN GET PAYMENTS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

module.exports = router;