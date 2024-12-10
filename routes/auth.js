const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const multer = require('multer');

require('dotenv').config();




const fs = require('fs');
const path = require('path');


// Create an "uploads" folder to store images
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}



// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

  // File Filter to Allow Only JPG, JPEG, and PNG
  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
  
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error("Only JPG, JPEG, and PNG files are allowed!"), false); // Reject the file
    }
  };


const upload = multer({ 
  fileFilter: fileFilter,
limits: { fileSize: 1024 * 1024 * 5 },
  storage: storage });



// JWT Token generation
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });
};



// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  });
};


function validateFields(req, res, next) {
  const { name,email , password } = req.body;
  const errors = {};
  let isError = false;
 


  // Check if fields are empty
  if (!name || name.trim() === "") {
    isError = true;
    errors.name = "Name is required";
  }
  if (!email || email.toString().trim() === "") {
    errors.email = "Email is required";
    isError = true;
  }
  if (!password || password.toString().trim() === "") {
    isError = true;
    errors.password = "Password is required";
  }
  

  if (isError && req.file) {
   
    // remove image files to uploads folder if exist
    fs.unlinkSync(`uploads/${req.file.filename}`);
  }

  // If errors exist, return error response
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Proceed to the next middleware or route handler
  next();
}


// User Signup Route
router.post('/signup', upload.single('image'),validateFields, async (req, res) => {
  const { name, email, password } = req.body;
  const image = req.file ? req.file.path : null; // Image is optional


  try {
    // Check if email already exists
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
       // If an error occurs, delete the uploaded file
       fs.unlinkSync(image);
      return res.status(400).json({ message: 'Email is already taken' });
    }

    const id = Math.floor(100000 + Math.random() * 900000);

 
    const imageUrl = `http://localhost:3000/${image}`;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const [result] = await db.promise().query(
      'INSERT INTO users (id,name, email, password, image_url) VALUES (?,?, ?, ?, ?)',
      [id,name, email, hashedPassword, imageUrl]
    );

    const userId = result.insertId;
    const token = generateToken(userId);
    // const refreshToken = generateRefreshToken(userId);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, name, email, image_url: image }
    });
  } catch (err) {
    console.error('Error during signup:', err);
    fs.unlinkSync(image);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, image_url: user.image_url }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export the router
module.exports = router;
