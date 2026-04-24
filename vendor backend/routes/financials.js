const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const { authenticateVendor, authenticateAdmin } = require('../middleware/auth');

router.post('/', authenticateVendor, async (req, res) => {
  try {
    const {
      reportingPeriod,
      revenue,
      expenses,
      profit,
      margin,
      pdfBase64,
      pdfFileName,
      graphData,
      notes,
    } = req.body;

    if (!reportingPeriod) {
      return res.status(400).json({
        error: 'reportingPeriod is required.',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO vendor_financial_reports
        (
          vendor_id,
          reporting_period,
          revenue,
          expenses,
          profit,
          margin,
          graph_data,
          pdf_file_name,
          pdf_base64,
          notes,
          sent_to_admin,
          sent_to_zimra,
          created_at,
          updated_at
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, FALSE, NOW(), NOW())
      RETURNING *
      `,
      [
        req.user.id,
        reportingPeriod,
        Number(revenue ?? 0),
        Number(expenses ?? 0),
        Number(profit ?? 0),
        Number(margin ?? 0),
        graphData ? JSON.stringify(graphData) : null,
        pdfFileName || null,
        pdfBase64 || null,
        notes || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Financial report submitted successfully.',
      report: result.rows[0],
    });
  } catch (error) {
    console.error('CREATE FINANCIAL REPORT ERROR:', error);
    return res.status(500).json({ error: 'Failed to create financial report.' });
  }
});

router.get('/my-reports', authenticateVendor, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM vendor_financial_reports
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('GET MY FINANCIAL REPORTS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch financial reports.' });
  }
});

router.get('/admin/financials', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        f.*,
        v.username,
        v.email,
        v.full_name
      FROM vendor_financial_reports f
      JOIN vendor_login v ON v.id = f.vendor_id
      ORDER BY f.created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ADMIN GET FINANCIAL REPORTS ERROR:', error);
    return res.status(500).json({ error: 'Failed to fetch admin financials.' });
  }
});

router.post('/admin/financials/:id/send-to-zimra', authenticateAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reportResult = await client.query(
      `
      SELECT *
      FROM vendor_financial_reports
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (reportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Financial report not found.' });
    }

    const report = reportResult.rows[0];
    const submissionReference = `ZIMRA-${Date.now()}`;

    await client.query(
      `
      UPDATE vendor_financial_reports
      SET sent_to_zimra = TRUE,
          zimra_sent_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      `,
      [req.params.id]
    );

    await client.query(
      `
      INSERT INTO zimra_submissions
        (
          financial_report_id,
          vendor_id,
          submitted_by,
          submission_reference,
          status,
          remarks,
          submitted_at
        )
      VALUES
        ($1, $2, $3, $4, 'sent', $5, NOW())
      `,
      [
        report.id,
        report.vendor_id,
        req.user.username || 'admin',
        submissionReference,
        'Submitted by admin through system.',
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Financial report sent to ZIMRA successfully.',
      submissionReference,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    console.error('SEND TO ZIMRA ERROR:', error);
    return res.status(500).json({
      error: 'Failed to send report to ZIMRA.',
      detail: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;