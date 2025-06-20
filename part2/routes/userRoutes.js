const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login (dummy version)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE email = ? AND password_hash = ?
    `, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute(
        'SELECT user_id, username, role FROM Users WHERE username = ? AND password_hash = ?',
        [username, password] // get username and password from login if they match
      );

      // checks if rows is not empty meaning username and password is correct
      if (rows.length === 1) {
        req.session.user = rows[0];
        res.json({ role: rows[0].role }); // returns the role of user
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;