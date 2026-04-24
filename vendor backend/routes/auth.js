const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const pool = require('../config/db');
const { signToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

/**
 * Return only safe user fields to Flutter.
 */
function sanitizeVendor(vendor) {
  return {
    id: vendor.id,
    username: vendor.username,
    email: vendor.email,
    phone: vendor.phone,
    full_name: vendor.full_name,
    auth_provider: vendor.auth_provider,
    status: vendor.status,
    created_at: vendor.created_at,
    updated_at: vendor.updated_at,
  };
}

function makeUsernameFromName(nameOrEmail) {
  return String(nameOrEmail || 'vendor')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20);
}

async function generateUniqueUsername(baseName) {
  let base = makeUsernameFromName(baseName);
  if (!base) base = 'vendor';

  let username = base;
  let counter = 1;

  while (true) {
    const exists = await pool.query(
      `SELECT id FROM vendor_login WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username]
    );

    if (exists.rows.length === 0) {
      return username;
    }

    username = `${base}_${counter}`;
    counter += 1;
  }
}

// Register vendor with local credentials
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, full_name } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({
        error: 'username, email, phone and password are required',
      });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM vendor_login
      WHERE LOWER(email) = LOWER($1)
         OR LOWER(username) = LOWER($2)
         OR phone = $3
      LIMIT 1
      `,
      [email, username, phone]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Vendor already exists with that email, username or phone number',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await pool.query(
      `
      INSERT INTO vendor_login
        (username, email, phone, password_hash, auth_provider, status, full_name)
      VALUES
        ($1, $2, $3, $4, 'local', 'active', $5)
      RETURNING *
      `,
      [username, email, phone, passwordHash, full_name || null]
    );

    const vendor = created.rows[0];

    const token = signToken({
      id: vendor.id,
      role: 'vendor',
      email: vendor.email,
      username: vendor.username,
    });

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeVendor(vendor),
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({
      error: 'Failed to register vendor.',
      detail: error.message,
    });
  }
});

// Vendor login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        error: 'login and password are required',
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM vendor_login
      WHERE LOWER(email) = LOWER($1)
         OR LOWER(username) = LOWER($1)
      LIMIT 1
      `,
      [login]
    );

    const vendor = result.rows[0];

    if (!vendor || !vendor.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (vendor.status !== 'active') {
      return res.status(403).json({
        error: `This vendor account is ${vendor.status}.`,
      });
    }

    const ok = await bcrypt.compare(password, vendor.password_hash);

    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      id: vendor.id,
      role: 'vendor',
      email: vendor.email,
      username: vendor.username,
    });

    return res.json({
      success: true,
      token,
      user: sanitizeVendor(vendor),
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({
      error: 'Failed to log in.',
      detail: error.message,
    });
  }
});

// Google sign-in / register
router.post('/google', async (req, res) => {
  const client = await pool.connect();

  try {
    const { googleId, email, name, phone, photoUrl, idToken } = req.body;

    if (!email || !idToken) {
      return res.status(400).json({
        error: 'email and idToken are required for Google sign-in.',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    const verifiedEmail = payload.email;
    const verifiedGoogleSub = payload.sub;
    const verifiedName = payload.name || name || verifiedEmail;
    const verifiedPicture = payload.picture || photoUrl || null;

    if (!verifiedEmail) {
      return res.status(400).json({ error: 'Google account email not found.' });
    }

    if (String(verifiedEmail).toLowerCase() !== String(email).toLowerCase()) {
      return res.status(401).json({ error: 'Google email verification mismatch.' });
    }

    await client.query('BEGIN');

    let vendorResult = await client.query(
      `
      SELECT v.*
      FROM vendor_google_accounts g
      JOIN vendor_login v ON v.id = g.vendor_id
      WHERE g.google_id = $1
         OR LOWER(g.email) = LOWER($2)
      LIMIT 1
      `,
      [verifiedGoogleSub || googleId, verifiedEmail]
    );

    if (vendorResult.rows.length === 0) {
      vendorResult = await client.query(
        `
        SELECT *
        FROM vendor_login
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [verifiedEmail]
      );
    }

    let vendor;

    if (vendorResult.rows.length > 0) {
      vendor = vendorResult.rows[0];

      await client.query(
        `
        UPDATE vendor_login
        SET auth_provider = CASE
          WHEN auth_provider = 'local' THEN 'google'
          ELSE auth_provider
        END,
        updated_at = NOW()
        WHERE id = $1
        `,
        [vendor.id]
      );
    } else {
      const username = await generateUniqueUsername(
        verifiedName || verifiedEmail.split('@')[0]
      );

      const inserted = await client.query(
        `
        INSERT INTO vendor_login
          (username, email, phone, password_hash, auth_provider, status, full_name)
        VALUES
          ($1, $2, $3, NULL, 'google', 'active', $4)
        RETURNING *
        `,
        [username, verifiedEmail, phone || null, verifiedName]
      );

      vendor = inserted.rows[0];
    }

    await client.query(
      `
      INSERT INTO vendor_google_accounts
        (vendor_id, google_id, email, display_name, profile_picture, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (vendor_id)
      DO UPDATE SET
        google_id = EXCLUDED.google_id,
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        profile_picture = EXCLUDED.profile_picture,
        updated_at = NOW()
      `,
      [
        vendor.id,
        verifiedGoogleSub || googleId,
        verifiedEmail,
        verifiedName,
        verifiedPicture,
      ]
    );

    await client.query('COMMIT');

    const token = signToken({
      id: vendor.id,
      role: 'vendor',
      email: vendor.email,
      username: vendor.username,
    });

    return res.json({
      success: true,
      token,
      user: sanitizeVendor(vendor),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('GOOGLE AUTH ERROR:', error);
    return res.status(500).json({
      error: 'Failed to sign in with Google',
      detail: error.message,
    });
  } finally {
    client.release();
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const configuredUser = process.env.ADMIN_USERNAME || 'admin';
    const configuredPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (!username || !password) {
      return res.status(400).json({
        error: 'username and password are required',
      });
    }

    if (username !== configuredUser || password !== configuredPass) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = signToken({
      id: 'admin-local',
      role: 'admin',
      username,
      is_admin: true,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: 'admin-local',
        username,
        role: 'admin',
        is_admin: true,
      },
    });
  } catch (error) {
    console.error('ADMIN LOGIN ERROR:', error);
    return res.status(500).json({
      error: 'Failed to log in admin.',
      detail: error.message,
    });
  }
});

// Current authenticated user
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({
        id: req.user.id,
        username: req.user.username,
        role: 'admin',
        is_admin: true,
      });
    }

    const result = await pool.query(
      `SELECT * FROM vendor_login WHERE id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(sanitizeVendor(result.rows[0]));
  } catch (error) {
    console.error('GET ME ERROR:', error);
    return res.status(500).json({
      error: 'Failed to fetch current user.',
      detail: error.message,
    });
  }
});

module.exports = router;