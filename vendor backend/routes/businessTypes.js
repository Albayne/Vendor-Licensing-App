const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const { authenticateVendor } = require('../middleware/auth');

router.get('/', authenticateVendor, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        application_fee,
        annual_license_fee
      FROM business_types
      ORDER BY name ASC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('GET BUSINESS TYPES ERROR:', error);
    return res.status(500).json({
      error: 'Failed to fetch business types.',
    });
  }
});

module.exports = router;