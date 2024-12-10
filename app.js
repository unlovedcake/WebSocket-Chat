const express = require('express');
const { fromBuffer } = require('file-type');
const { WebSocketServer } = require('ws');
const bodyParser = require('body-parser');
const db = require('./database');
const multer = require('multer');

require('dotenv').config();
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
//const chatRoutes = require('./routes/chat');
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



// Create an "uploads" folder to store images
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Route imports
app.use('/api/products',authenticateToken, productsRoutes); 
app.use('/api/auth', authRoutes); 
//app.use('/api/chat', chatRoutes); 

// Error-handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Handle other errors
    return res.status(400).json({ error: err.message });
  }
  next();
});







// // Set up multer for image uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
//     }
//   });

 
//   const upload = multer({ storage: storage });

  
//   // JWT Token generation
//   const generateToken = (userId) => {
//     return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });
//   };



//   // Generate refresh token
// const generateRefreshToken = (userId) => {
//     return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
//         expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
//     });
// };



//   // User Signup Route
// app.post('/signup', upload.single('image'), async (req, res) => {
//     const { name, email, password } = req.body;
//     const image = req.file ? req.file.path : null; // Image is optional
  
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'Name, email, and password are required' });
//     }
  
//     try {
//       // Check if email already exists
//       const [rows] = await dbapi.promise().query('SELECT * FROM users WHERE email = ?', [email]);
//       if (rows.length > 0) {
//         return res.status(400).json({ message: 'Email is already taken' });
//       }

//       const id = Math.floor(100000 + Math.random() * 900000);

   
//         const imageUrl = `http://localhost:3000/${image}`;

        
  
//       // Hash the password
//       const hashedPassword = await bcrypt.hash(password, 10);
  
//       // Insert user into database
//       const [result] = await dbapi.promise().query(
//         'INSERT INTO users (id,name, email, password, image_url) VALUES (?,?, ?, ?, ?)',
//         [id,name, email, hashedPassword, imageUrl]
//       );
  
//       const userId = result.insertId;
//       const token = generateToken(userId);
//       // const refreshToken = generateRefreshToken(userId);
  
//       res.status(201).json({
//         message: 'User registered successfully',
//         token,
//         refreshToken,
//         user: { id: userId, name, email, image_url: image }
//       });
//     } catch (err) {
//       console.error('Error during signup:', err);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });

//   // User Login Route
// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;
  
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }
  
//     try {
//       // Check if user exists
//       const [rows] = await dbapi.promise().query('SELECT * FROM users WHERE email = ?', [email]);
//       if (rows.length === 0) {
//         return res.status(400).json({ message: 'Invalid email or password' });
//       }
  
//       const user = rows[0];
  
//       // Compare the password with the hashed password
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: 'Invalid email or password' });
//       }
  
//       const token = generateToken(user.id);
  
//       res.status(200).json({
//         message: 'Login successful',
//         token,
//         user: { id: user.id, name: user.name, email: user.email, image_url: user.image_url }
//       });
//     } catch (err) {
//       console.error('Error during login:', err);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });
  
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

const allowedMimeTypes = ['image/png', 'image/jpeg',  'image/gif', 'video/mp4', 'video/avi', 'video/mkv', 'video/mov'];

// REST API for fetching chat history

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

  app.get('/group-messages', async (req, res) => {

    const groupId = 1; // Replace with dynamic input
  const userId = 1;  // Replace with dynamic input

  const query = `
    SELECT 
        m.id AS message_id,
        m.sender_id,
        u.username AS sender_name,
        m.message,
        m.created_at AS message_time,
        GROUP_CONCAT(
            CONCAT(
                '[{"reaction_type":"', r.reaction_type,
                '", "user_id":', r.user_id,
                ', "username":"', ru.username, '"}]'
            )
            SEPARATOR ','
        ) AS reactions
    FROM group_messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN reactions r ON m.id = r.message_id
    LEFT JOIN users ru ON r.user_id = ru.id
    WHERE m.group_id = ?
      AND m.created_at >= (
          SELECT gm.joined_at 
          FROM group_members gm 
          WHERE gm.group_id = ? AND gm.user_id = ?
      )
    GROUP BY m.id
    ORDER BY m.created_at ASC;
  `;
    try {
      // Execute the query
    const [rows] = await await db.query(query, [groupId, groupId, userId]);

    // Process reactions to ensure proper JSON format
    const formattedRows = rows.map(row => {
      return {
        ...row,
        reactions: row.reactions ? JSON.parse(`[${row.reactions}]`) : [],
      };
    });

    // Send the response
    res.json(formattedRows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });


  app.post('/conversation', async (req, res) => {

    const { user_one_id, user_two_id } = req.body; 


    console.log(req.body);

    const id = Math.floor(100000 + Math.random() * 900000);
    
  
    const query = `
  INSERT INTO conversations (id,user_one_id, user_two_id)
  VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
  `;
    try {
      const [rows] = await db.query(query,[id ,user_one_id, user_two_id]);
  
      res.status(200).json({ status: 'success', conversations: rows });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });


  app.post('/reaction', async (req, res) => {

    const { message_id, user_id,reaction_type } = req.body; 


    console.log(req.body);
    
  
    const query = `
   INSERT INTO reactions (message_id, user_id, reaction_type) 
    VALUES (?, ?, ?)
  `;
    try {
      const [rows] = await db.query(query,[message_id,user_id,reaction_type]);
      //res.json(rows);
      res.status(200).json({ status: 'success', reaction: rows });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });

  // app.put('/reaction', async (req, res) => {

    app.put('/reaction/:messageId', async (req, res) => {
      const messageId = req.params.messageId;

    const { user_id,reaction_type } = req.body; 

    console.log(req.body);
    console.log(' messageId' +  messageId);
    
  
    const query = `
    UPDATE reactions 
    SET reaction_type = ? 
    WHERE message_id = ? AND user_id = ?;
  `;
    try {
      const [rows] = await db.query(query,[reaction_type,messageId,user_id]);
    
      res.status(200).json({ status: 'success', reaction: reaction_type });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });

  app.put('/reaction/:messageId', async (req, res) => {
      const messageId = req.params.messageId;

    const { user_id,reaction_type } = req.body; 

    console.log(req.body);
    console.log(' messageId' +  messageId);
    
  
    const query = `
    UPDATE reactions 
    SET reaction_type = ? 
    WHERE message_id = ? AND user_id = ?;
  `;
    try {
      const [rows] = await db.query(query,[reaction_type,messageId,user_id]);
    
      res.status(200).json({ status: 'success', reaction: reaction_type });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });
  

app.get('/messages/:conversation_id', async (req, res) => {

  const conversationId = req.params.conversation_id;
  

  console.log('Sender ID' +conversationId);
  const query = `
  SELECT messages.*, 
         users.name AS sender_name, 
         users.image_url AS sender_profile,
         reactions.reaction_type AS reaction_type
  FROM messages
  JOIN users ON messages.sender_id =  users.id
  LEFT JOIN reactions ON messages.id =  reactions.message_id
  WHERE messages.conversation_id = ?
  ORDER BY messages.created_at ASC
`;
  try {
    const [rows] = await db.query(query,[conversationId]);
    //res.json(rows);
    res.status(200).json({ status: 'success', messages: rows });
  } catch (error) {
    res.status(500).json({ error: 'Database error' + error});
  }
});

// app.post('/send-message', upload.single('image'), (req, res) => {
//   const { text, user, user_image, image } = req.body; // Expecting `user_image` in request body
//   const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
//   const timestamp = new Date();

//   // Save message to the database
//   const sql = `INSERT INTO messages (user, user_image, text, image, created_at) VALUES (?, ?, ?, ?, ?)`;
//   db.query(sql, [user, user_image, text, image, timestamp], (err, result) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ status: 'error', message: 'Database error' });
//     }

//     // Notify WebSocket clients
//     const newMessage = {
//       id: result.insertId,
//       user,
//       user_image,
//       text,
//       image: imageUrl ?? '',
//       createdAt: timestamp,
//     };
//     for (const client of clients) {
//       if (client.readyState === ws.OPEN) {
//         client.send(JSON.stringify(newMessage));
//       }
//     }

//     console.log('Data Send Message' + newMessage);

//     res.status(200).json({ status: 'success', message: 'Message sent', messages: newMessage });
//   });
// });

// app.get('/messages', (req, res) => {
//   const sql = `SELECT * FROM messages ORDER BY created_at ASC`;
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ status: 'error', message: 'Database error' });
//     }
//     res.status(200).json({ status: 'success', data: results });
//   });
// });



wss.on('connection', (ws) => {
    console.log('New client connected!');
  
    ws.on('message', async (data) => {
      

    let mediaUrl = '';

      const { conversation_id, sender_id,text, media_url,media_type,sender_name,sender_profile} = JSON.parse(data);

      console.log('Data' +JSON.parse(data));


        if (media_url) {
        const imageBuffer = Buffer.from(media_url, 'base64');

        const fileType = await fromBuffer(imageBuffer);
  
       

        if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
         ws.send(JSON.stringify({ 'status': 'error', 'message': 'unsupported image type ' +fileType.mime}));

           return;
          
        }

        
        const imageName = `uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileType.ext}`;
  
        // Save the image
        fs.writeFileSync(path.join(__dirname, imageName), imageBuffer);
  
        // Broadcast the image URL
        mediaUrl = `http://localhost:3000/${imageName}`;
      
       

       
        
        // await db.query(
        //   'INSERT INTO messages (user, user_image, text, image) VALUES (?, ?, ?,?)',
        //   [user,user_image, text || '', imageUrl]
        // );

    }
    const id = Math.floor(100000 + Math.random() * 900000);
    

    await db.query(
      'INSERT INTO messages (id,conversation_id, sender_id, text, media_url,media_type) VALUES (?,?, ?, ?,?,?)',
      [id,conversation_id,sender_id, text || '', mediaUrl,media_type]
    );


          //     await db.query(
          //   'INSERT INTO messages (user, user_image, text, image) VALUES (?, ?, ?,?)',
          //   [user,user_image, text || '', imageUrl]
          // );
  


    
        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
              id: id,
              sender_name: sender_name,
              sender_profile:sender_profile,
              text: text,
              media_url: mediaUrl,
              created_at: new Date(),
            }));
          }
        });
  
      // If an image is sent
    //   if (image) {
    //     const imageBuffer = Buffer.from(image, 'base64');

    //     const fileType = await fromBuffer(imageBuffer);
  
    //     console.log('TYPE IMAGE' +fileType.ext);

    //     if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
    //      ws.send(JSON.stringify({ 'status': 'error', 'message': 'unsupported image type ' +fileType.mime}));

    //        return;
          
    //     }

        
    //     const imageName = `uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
  
    //     // Save the image
    //     fs.writeFileSync(path.join(__dirname, imageName), imageBuffer);
  
    //     // Broadcast the image URL
    //     const imageUrl = `http://localhost:3000/${imageName}`;
    //     image.image_url = imageUrl;
  
    //     // Save message with image URL to the database
    //     try {
          


    //       await db.query(
    //         'INSERT INTO messages (id,username, username_image, message, image_url) VALUES (?,?, ?, ?,?)',
    //         [id  ,username,username_image, message || '', imageUrl]
    //       );
  
    //       // Broadcast the message to all connected clients
    //       wss.clients.forEach((client) => {
    //         if (client.readyState === ws.OPEN) {
    //           client.send(JSON.stringify({
    //             id: id,
    //             username: username,
    //             username_image:username_image,
    //             message: message,
    //             image_url: imageUrl,
    //             created_at: new Date(),
    //           }));
    //         }
    //       });
    //     } catch (error) {
    //       console.error('Error saving message:', error);
    //     }
    //   } else {
    //         try {
    //   await db.query('INSERT INTO messages (id,username,username_image, message) VALUES (?, ?, ?, ?)', [id,username,username_image, message]);

    //   // Broadcast the message to all connected clients
    //   wss.clients.forEach((client) => {
    //     if (client.readyState === ws.OPEN) {
    //       client.send(JSON.stringify({id, username,username_image, message, created_at: new Date() }));
    //     }
    //   });
    // } catch (error) {
    //   console.error('Error saving message:', error);
    // }
    //   }
    });
  

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});
