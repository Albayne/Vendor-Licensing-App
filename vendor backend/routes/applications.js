const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const { authenticateVendor } = require('../middleware/auth');

router.post('/', authenticateVendor, async (req, res) => {
  try {
    const {
      businessTypeId,
      businessName,
      nationalId,
      businessDescription,
      businessAddress,
      phone,
      email,
    } = req.body;

    if (!businessTypeId || !businessName || !nationalId) {
      return res.status(400).json({
        error: 'businessTypeId, businessName and nationalId are required',
      });
    }

    const typeResult = await pool.query(
      `
      SELECT id, application_fee
      FROM business_types
      WHERE id = $1
      LIMIT 1
      `,
      [businessTypeId]
    );

    if (typeResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Selected business type was not found',
      });
    }

    const applicationFee =
      Number(typeResult.rows[0].application_fee ?? 0) || 0;

    const result = await pool.query(
      `
      INSERT INTO license_applications (
        vendor_id,
        business_type_id,
        business_name,
        national_id,
        business_description,
        business_address,
        phone,
        email,
        status,
        payment_status,
        application_fee,
        submitted_at,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        'draft',
        'unpaid',
        $9,
        NULL,
        NOW(),
        NOW()
      )
      RETURNING *
      `,
      [
        req.user.id,
        businessTypeId,
        businessName,
        nationalId,
        businessDescription || null,
        businessAddress || null,
        phone || null,
        email || null,
        applicationFee,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Application created successfully.',
      application: result.rows[0],
    });
  } catch (error) {
    console.error('CREATE APPLICATION ERROR:', error);
    return res.status(500).json({ error: 'Failed to create application.' });
  }
});

router.get('/my-applications', authenticateVendor, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        a.*,
        bt.name AS business_type,
        s.stall_number,
        s.location,
        s.rental_cost,
        CASE
          WHEN a.status = 'approved' THEN 'Your licence was approved.'
          WHEN a.status = 'rejected' THEN COALESCE(a.rejection_reason, 'Your application was rejected.')
          WHEN a.status = 'pending' THEN 'Your application was sent and is waiting for approval.'
          WHEN a.status = 'draft' THEN 'Your application is waiting for payment.'
          ELSE 'Application status unavailable.'
        END AS vendor_message
      FROM license_applications a
      LEFT JOIN business_types bt ON bt.id = a.business_type_id
      LEFT JOIN stalls s ON s.id = a.allocated_stall_id
      WHERE a.vendor_id = $1
      ORDER BY a.created_at DESC NULLS LAST, a.submitted_at DESC NULLS LAST
      `,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('GET MY APPLICATIONS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

router.get('/:id', authenticateVendor, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        a.*,
        bt.name AS business_type,
        s.stall_number,
        s.location,
        s.rental_cost
      FROM license_applications a
      LEFT JOIN business_types bt ON bt.id = a.business_type_id
      LEFT JOIN stalls s ON s.id = a.allocated_stall_id
      WHERE a.id = $1 AND a.vendor_id = $2
      LIMIT 1
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('GET APPLICATION BY ID ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch application.' });
  }
});

module.exports = router;