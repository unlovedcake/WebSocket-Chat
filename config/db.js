const mysql = require('mysql2');
require('dotenv').config();

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user:  process.env.MYSQL_USER,
  password:  process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit if connection fails
  }
  console.log('Connected to database');
});

module.exports = db;
