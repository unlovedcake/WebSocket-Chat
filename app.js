const express = require('express');
const { WebSocketServer } = require('ws');
const bodyParser = require('body-parser');
const db = require('./database');

const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const productsRoutes = require('./routes/products');
const authenticateToken = require('./middleware/authMiddleware');




const fs = require('fs');
const path = require('path');


const app = express();
const PORT = 3000;


// Middleware
app.use(express.json()); // For parsing JSON requests
app.use(express.urlencoded({ extended: true })); // For parsing form data

// Serve static files
app.use(express.static('public'));
app.use(bodyParser.json());



// Route imports
app.use('/api/products',authenticateToken, productsRoutes); // Products route



// MySQL database connection
const dbapi = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });


// Create an "uploads" folder to store images
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));






// REST API for fetching chat history
app.get('/messages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});


// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
  });

 
  const upload = multer({ storage: storage });

  
  
  // Connect to MySQL database
//   dbapi.connect((err) => {
//     if (err) {
//       console.error('Error connecting to MySQL:', err.stack);
//       return;
//     }
//     console.log('Connected to MySQL database.');
//   });
  
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



  // User Signup Route
app.post('/signup', upload.single('image'), async (req, res) => {
    const { id,name, email, password } = req.body;
    const image = req.file ? req.file.path : null; // Image is optional
  
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
  
    try {
      // Check if email already exists
      const [rows] = await dbapi.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert user into database
      const [result] = await dbapi.promise().query(
        'INSERT INTO users (id,name, email, password, image_url) VALUES (?,?, ?, ?, ?)',
        [id,name, email, hashedPassword, image]
      );
  
      const userId = result.insertId;
      const token = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);
  
      res.status(201).json({
        message: 'User registered successfully',
        token,
        refreshToken,
        user: { id: userId, name, email, image_url: image }
      });
    } catch (err) {
      console.error('Error during signup:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // User Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    try {
      // Check if user exists
      const [rows] = await dbapi.promise().query('SELECT * FROM users WHERE email = ?', [email]);
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
  
//   // Middleware to protect routes with JWT
//   const authenticateToken = (req, res, next) => {
//     const token = req.headers['authorization']?.split(' ')[1];
  
//     if (!token) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
  
//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//       if (err) {
//         return res.status(403).json({ message: 'Invalid or expired token' });
//       }
//       req.user = user;
//       next();
//     });
//   };
  
  // Example of a protected route (can be extended for user-specific chat or data)
//   app.get('/protected', authenticateToken, (req, res) => {
//     res.json({ message: 'This is a protected route', user: req.user });
//   });

  
  

// WebSocket server setup
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New client connected!');
  
    ws.on('message', async (data) => {
      //const parsedData = JSON.parse(data);

      const { username, message, image} = JSON.parse(data);
  
      // If an image is sent
      if (image) {
        const imageBuffer = Buffer.from(image, 'base64');
        const imageName = `uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
  
        // Save the image
        fs.writeFileSync(path.join(__dirname, imageName), imageBuffer);
  
        // Broadcast the image URL
        const imageUrl = `http://localhost:3000/${imageName}`;
        image.image_url = imageUrl;
  
        // Save message with image URL to the database
        try {
          await db.query(
            'INSERT INTO messages (username, message, image_url) VALUES (?, ?, ?)',
            [username, message || '', imageUrl]
          );
  
          // Broadcast the message to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                username: username,
                message: message,
                image_url: imageUrl,
                created_at: new Date(),
              }));
            }
          });
        } catch (error) {
          console.error('Error saving message:', error);
        }
      } else {
            try {
      await db.query('INSERT INTO messages (username, message) VALUES (?, ?)', [username, message]);

      // Broadcast the message to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({ username, message, created_at: new Date() }));
        }
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
      }
    });

// wss.on('connection', (ws) => {
//   console.log('New client connected!');

//   ws.on('message', async (data) => {
//     const { username, message } = JSON.parse(data);

//     // Save message to the database
//     try {
//       await db.query('INSERT INTO messages (username, message) VALUES (?, ?)', [username, message]);

//       // Broadcast the message to all connected clients
//       wss.clients.forEach((client) => {
//         if (client.readyState === ws.OPEN) {
//           client.send(JSON.stringify({ username, message, created_at: new Date() }));
//         }
//       });
//     } catch (error) {
//       console.error('Error saving message:', error);
//     }
//   });

  

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
