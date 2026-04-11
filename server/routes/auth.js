const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Check admin credentials
  if (username === process.env.ADMIN_USERNAME) {
    const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, role: 'admin' });
  }

  // Check manager credentials
  if (username === process.env.MANAGER_USERNAME) {
    const match = await bcrypt.compare(password, process.env.MANAGER_PASSWORD_HASH);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ username, role: 'manager' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, role: 'manager' });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role || 'admin' });
});

module.exports = router;
