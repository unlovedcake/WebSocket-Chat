const mysql = require('mysql');

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'chat_app',
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit if connection fails
  }
  console.log('Connected to database');
});

module.exports = db;
