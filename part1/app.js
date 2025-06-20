var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

let db;

(async () => {
  try {
    // Connect to MySQL and select the DogWalkService database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root', // Change if needed
      password: '', // Your MySQL password
      database: 'DogWalkService'
    });

    // Insert data only if Users table is empty
    const [users] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (users[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('angus123', 'angus@example.com', 'hashed420', 'owner'),
        ('danielwalks', 'dan@example.com', 'hashed234', 'walker')
      `);

      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'danielwalks'), 'Donkey', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Daisy', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Baby', 'small')
      `);

      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Donkey'), '2025-06-11 12:00:00', 60, 'Mile End', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Daisy'), '2025-06-12 12:15:00', 20, 'Banana Land', 'cancelled'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Baby'), '2025-06-13 12:30:00', 25, 'Beachview', 'completed')
      `);

      await db.execute(`
        INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
        (2, (SELECT user_id FROM Users WHERE username='bobwalker'), (SELECT user_id FROM Users WHERE username='carol123'), 5, 'Great walk!'),
        (5, (SELECT user_id FROM Users WHERE username='bobwalker'), (SELECT user_id FROM Users WHERE username='alice123'), 4, 'Nice job!')
      `);
    }

  } catch (err) {
    console.error('Error setting up database', err);
  }
})();

module.exports = app;
