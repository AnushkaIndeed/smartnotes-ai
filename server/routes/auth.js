const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper — creates a signed JWT for a user
const createToken = (userId) => {
  return jwt.sign(
    { userId },               // payload — what we store in the token
    process.env.JWT_SECRET,   // secret key to sign with
    { expiresIn: '7d' }       // token expires in 7 days
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // 2. Hash the password (never store plain text)
    const passwordHash = await bcrypt.hash(password, 10);
    // 10 = salt rounds 

    // 3. Create and save the user
    const user = await User.create({ email, passwordHash });

    // 4. Create token and send it back
    const token = createToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 2. Compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 3. Create token and send it back
    const token = createToken(user._id);

    res.json({
      token,
      user: { id: user._id, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;