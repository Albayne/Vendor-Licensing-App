const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const { authenticateVendor } = require('../middleware/auth');

/**
 * GET /api/stalls/my-stall
 * Vendor sees their allocated stall after approval.
 */
router.get('/my-stall', authenticateVendor, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        s.*,
        a.id AS application_id,
        a.status AS application_status
      FROM stalls s
      JOIN license_applications a ON a.allocated_stall_id = s.id
      WHERE a.vendor_id = $1
        AND a.status = 'approved'
      ORDER BY a.reviewed_date DESC NULLS LAST
      LIMIT 1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No stall allocated yet.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('GET MY STALL ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch stall.' });
  }
});

module.exports = router;