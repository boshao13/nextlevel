const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth');

const router = express.Router();

// A real (never-matching) bcrypt hash. When the submitted username matches no
// account we still run one bcrypt.compare against this, so the response time
// does not reveal whether a username exists (closes the enumeration oracle).
const DUMMY_HASH = '$2a$10$Nexw0nuOz.ExNWPGIjg56umw8Frof5ClsxYl2czMfN.mE2mNLaYWm';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Reject missing / non-string input BEFORE bcrypt. bcryptjs.compare()
    // REJECTS with 'Illegal arguments' on a non-string password; in an async
    // handler that unhandled rejection would crash the whole process.
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const accounts = [
      { username: process.env.ADMIN_USERNAME,   hash: process.env.ADMIN_PASSWORD_HASH,   role: 'admin' },
      { username: process.env.MANAGER_USERNAME, hash: process.env.MANAGER_PASSWORD_HASH, role: 'manager' },
      { username: process.env.PAYROLL_USERNAME, hash: process.env.PAYROLL_PASSWORD_HASH, role: 'payroll' },
    ];
    const account = accounts.find((a) => a.username && a.username === username);

    // Always run exactly one compare (real hash if matched, else dummy) so the
    // response time does not reveal whether the username exists.
    const match = await bcrypt.compare(password, account && account.hash ? account.hash : DUMMY_HASH);
    if (!account || !match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: account.username, role: account.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, role: account.role });
  } catch (err) {
    console.error('[auth] login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role || 'admin' });
});

module.exports = router;
