const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(session({
    secret: 'secret-key-here', // Change this to a secure key in production
    resave: false,
    saveUninitialized: true,
}));

  // Connect to database
let db;
(async () => {
    try {
      db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'DogWalkService',
      });
      console.log('Connected to MySQL');
    } catch (err) {
      console.error('Database connection failed:', err);
    }
})();

  // Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute(
        'SELECT user_id, username, role FROM Users WHERE username = ? AND password_hash = ?',
        [username, password]
      );

      if (rows.length === 1) {
        req.session.user = rows[0]; // Store user in session
        res.json({ role: rows[0].role });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
});

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;