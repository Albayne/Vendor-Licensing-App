const axios = require('axios');
(async () => {
  try {
    console.log('=== GET / ===');
    let r = await axios.get('http://localhost:5000/');
    console.log(r.data);

    console.log('=== POST /api/auth/register ===');
    try {
      r = await axios.post('http://localhost:5000/api/auth/register', {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Pass123!'
      });
      console.log(r.data);
    } catch (err) {
      if (err.response) console.log('register status', err.response.status, err.response.data);
      else console.log('register error', err.message);
    }

    console.log('=== POST /api/auth/login ===');
    r = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'test2@example.com',
      password: 'Pass123!'
    });
    console.log(r.data);

    const token = r.data.token;
    console.log('token', token);

    console.log('=== POST /api/payments/ecocash ===');
    try {
      r = await axios.post(
        'http://localhost:5000/api/payments/ecocash',
        { applicationId: 1, amount: '10.00', phoneNumber: '263771234567' },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      console.log(r.data);
    } catch (err) {
      if (err.response) console.log('payment status', err.response.status, err.response.data);
      else console.log('payment error', err.message);
    }
  } catch (err) {
    console.error('fatal', err);
  }
  process.exit(0);
})();