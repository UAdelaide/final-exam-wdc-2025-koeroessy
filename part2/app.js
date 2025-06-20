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
    secret: 'key',
    resave: false,
    saveUninitialized: true,
}));


let db;
(async () => {
    try {
      db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'DogWalkService',
      });
    } catch (err) {
      console.error('Database connection failed:', err);
    }
})();


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

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;