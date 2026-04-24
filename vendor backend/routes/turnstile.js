const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/verify-captcha', async (req, res) => {
  const { token } = req.body;
  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.success) {
      res.json({ success: true });
    } else {
      res.json({ success: false, errors: response.data['error-codes'] });
    }
  } catch (error) {
    console.error('Turnstile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;