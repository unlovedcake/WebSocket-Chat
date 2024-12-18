const express = require('express');
const cors = require('cors');
const { fromBuffer } = require('file-type');
const { WebSocketServer } = require('ws');
const bodyParser = require('body-parser');
const db = require('./database');
const multer = require('multer');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { isUserTyping,sendMessage,getAllPinned,addPin,addReactionToMessage } = require('./controller/chat_controller.js'); 
const { dbFireStore } = require('./firebase.js')




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



// Security Headers
app.use(helmet());

// Enable CORS for all routes
app.use(cors());

// app.use(cors({
//   origin: '*',  // You can replace '*' with the specific domain of your Flutter app
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// app.use(
//   helmet({
//     contentSecurityPolicy: true, // Disable CSP for debugging or custom setup
//     frameguard: {
//       action: 'deny', // Prevent iframes completely
//     },
//     referrerPolicy: {
//       policy: 'strict-origin-when-cross-origin', // Configure Referrer-Policy header
//     },
//   })
// );


// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);



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


app.patch('/user/:driverId', async (req, res) => {

  const driverId = req.params.driverId;
  const {newStatus } = req.body
  console.log('DATA' + driverId);
  console.log('DATA' + newStatus);
  const peopleRef = dbFireStore.collection('Users').doc(driverId)
  const response = await peopleRef.set({
      "status": newStatus
  }, { merge: true })

   res.status(200).send(response)
})


  
  

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

    try {

    const { user_one_id, user_two_id } = req.body; 


    console.log(req.body);

    const id = Math.floor(100000 + Math.random() * 900000);
    
  
    const query = `
  INSERT INTO conversations (id,user_one_id, user_two_id)
  VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
  `;
   
      const [rows] = await db.query(query,[id ,user_one_id, user_two_id]);
  
      res.status(200).json({ status: 'success', conversation_id: rows['insertId'] });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });


  // add pin message
  app.post('/pin-message', async (req, res) => {

    const { message_id, user_id,conversation_id,is_pinned } = req.body; 


    console.log(req.body);
    const id = Math.floor(100000 + Math.random() * 900000);
  
    const query = `
   INSERT INTO pinned_messages (conversation_id, message_id,user_id, is_pinned)
    VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_pinned = VALUES(is_pinned);
  `;
    try {
      const [rows] = await db.query(query,[conversation_id,message_id,user_id,is_pinned]);
      //res.json(rows);
      res.status(200).json({ status: 'success', reaction: rows });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });

    
  

// update pin comment
app.put('/pin-message', async (req, res) => {

  const { is_pinned,message_id, conversation_id } = req.body; 


  console.log(req.body);

  const query = `
UPDATE pinned_messages
SET is_pinned = ?
WHERE conversation_id = ? AND message_id = ?;
`;
  try {
    const [rows] = await db.query(query,[is_pinned,conversation_id,message_id]);
    //res.json(rows);
    res.status(200).json({ status: 'success', reaction: rows });
  } catch (error) {
    res.status(500).json({ error: 'Database error' + error});
  }
});

   app.post('/reaction', async (req, res) => {
 

    try {
    const { message_id,user_id,reaction_type } = req.body; 

    console.log(req.body);
   
 
    const query = `
   INSERT INTO reactions (message_id, user_id, reaction_type) 
VALUES ( ?, ?, ?)
ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type);

  `;
   
       await db.query(query,[message_id,user_id,reaction_type]);
    
      res.status(200).json({ status: 'success', reaction: reaction_type });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });


  //   app.put('/reaction/:messageId', async (req, res) => {
  //     const messageId = req.params.messageId;

  //   const { user_id,reaction_type } = req.body; 

  //   console.log(req.body);
  //   console.log(' messageId' +  messageId);
    
  
  //   const query = `
  //   UPDATE reactions 
  //   SET reaction_type = ? 
  //   WHERE message_id = ? AND user_id = ?;
  // `;
  //   try {
  //     const [rows] = await db.query(query,[reaction_type,messageId,user_id]);
    
  //     res.status(200).json({ status: 'success', reaction: reaction_type });
  //   } catch (error) {
  //     res.status(500).json({ error: 'Database error' + error});
  //   }
  // });


   app.post('/conversation', async (req, res) => {

    try {

    const { user_one_id, user_two_id } = req.body; 


    console.log(req.body);

    const id = Math.floor(100000 + Math.random() * 900000);
    
  
    const query = `
  INSERT INTO conversations (id,user_one_id, user_two_id)
  VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
  `;
   
      const [rows] = await db.query(query,[id ,user_one_id, user_two_id]);
  
      res.status(200).json({ status: 'success', conversation_id: rows['insertId'] });
    } catch (error) {
      res.status(500).json({ error: 'Database error' + error});
    }
  });



  // update pin comment
app.put('/messages', async (req, res) => {

  const { id, conversation_id,status } = req.body; 


  console.log(req.body);

  const query = `
UPDATE messages
SET status = ?
WHERE id = ? AND conversation_id = ?;
`;
  try {
    const [rows] = await db.query(query,[status ,id,conversation_id]);

    res.status(200).json({ status: 'success', reaction: rows });
  } catch (error) {
    res.status(500).json({ error: 'Database error' + error});
  }
});

 
  

app.post('/messages', async (req, res) => {

  // const conversationId = req.params.conversation_id;


  const { conversation_id,page, limit } = req.body;
  

  const query = ` SELECT messages.*, 
        users.name AS sender_name, 
        users.image_url AS sender_profile,
        reactions.reaction_type AS reaction_type,
        COALESCE(pm.is_pinned, FALSE) AS is_pinned
        FROM messages 
        LEFT JOIN pinned_messages pm ON messages.id = pm.message_id AND pm.conversation_id = messages.conversation_id
        LEFT JOIN reactions ON messages.id =  reactions.message_id 
        JOIN users ON messages.sender_id =  users.id
        WHERE messages.conversation_id = ?
        ORDER BY messages.created_at ASC LIMIT ? OFFSET ?;`;

  try {
    const [rows] = await db.query(query,[conversation_id, limit || 10, page || 0]);

    if(rows.length > 0){
      res.status(200).json({ status: 'success', messages: rows });
    }else{
      res.status(200).json({ status: 'empty', messages:rows});
    }
    
   
  } catch (error) {
    res.status(500).json({ error: 'Database error' + error});
  }
});

app.post('/search-users', async (req, res) => {

  const { search_name, page,limit } = req.body; 

   const query = `SELECT id, name,email, image_url, is_online FROM users WHERE name LIKE ? LIMIT ? OFFSET ?`;

   const wildcardQuery = `%${search_name}%`;

   const [rows] = await db.query(query,[wildcardQuery,limit || 10,page || 0]);

   if(rows.length > 0){
   
     res.status(200).json({ status: 'success', users: rows });
   }else{
     res.status(200).json({ status: 'empty', users:rows});
   }

});


app.get('/chat-list-last-conversation/:user_id', async (req, res) => {


  
  const userId = req.params.user_id;

  console.log(' userId' +  userId);
  
  try {

          const query = ` SELECT 
   
    users.name AS sender_name,
    users.image_url AS sender_image,
    users.is_online AS is_online,
    conversations.id AS conversation_id,
    last_messages.id AS id,
    last_messages.sender_id AS sender_id,
    last_messages.receiver_id AS receiver_id,
    last_messages.text AS text,
    last_messages.media_url AS last_message_media_url,
     last_messages.status AS status,
    last_messages.created_at AS last_message_time,
    
    CASE 
        WHEN last_messages.sender_id = ? THEN 'sent'
        ELSE 'received'
    END AS message_status
FROM 
    conversations

JOIN 
    users 
    ON (conversations.user_one_id = users.id OR conversations.user_two_id = users.id)
    AND users.id != ?
    
JOIN 
    (
        SELECT 
            messages.id,
            messages.conversation_id,
            messages.text,
            messages.media_url,
            messages.created_at,
            messages.status,
            messages.sender_id,
             messages.receiver_id
        
       
         
        FROM 
            messages
        
        INNER JOIN (
            SELECT 
                conversation_id, 
                MAX(created_at) AS latest_message_time
            FROM 
                messages
            GROUP BY 
                conversation_id
        ) AS latest_messages
        ON messages.conversation_id = latest_messages.conversation_id
        AND messages.created_at = latest_messages.latest_message_time
    ) AS last_messages
    ON conversations.id = last_messages.conversation_id
WHERE 
    (conversations.user_one_id = ? OR conversations.user_two_id = ?)
ORDER BY 
    last_messages.created_at DESC;


          `; 



    const [rows] = await db.query(query,[userId,userId,userId,userId]);

    if(rows.length > 0){
    
      res.status(200).json({ status: 'success', messages: rows });
    }else{
      res.status(200).json({ status: 'empty', messages:rows});
    }
    
   
  } catch (error) {
    res.status(500).json({ error: 'Database error' + error});
  }
});

app.get('/pin-messages/:conversation_id', async (req, res) => {

  const conversationId = req.params.conversation_id;
  

  console.log('Sender ID' +conversationId);

  try {
    const query = ` SELECT messages.*, 
    users.name AS sender_name, 
    users.image_url AS sender_profile,
     reactions.reaction_type AS reaction_type,
  COALESCE(pm.is_pinned, FALSE) AS is_pinned
FROM messages 
LEFT JOIN pinned_messages pm ON messages.id = pm.message_id AND pm.conversation_id = messages.conversation_id
LEFT JOIN reactions ON messages.id =  reactions.message_id
JOIN users ON messages.sender_id =  users.id AND pm.user_id =  2
WHERE messages.conversation_id = ?  AND pm.is_pinned = TRUE
ORDER BY messages.created_at DESC LIMIT 10 OFFSET ?;`;
    const [rows] = await db.query(query,[conversationId]);

    if(rows.length > 0){
      res.status(200).json({ status: 'success', messages: rows });
    }else{
      res.status(200).json({ status: 'empty', messages:rows});
    }
    
   
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

const updateUserIsOnline = async (userId,isOnline) => {

  const query = `
  UPDATE users
  SET is_online = ?
  WHERE id = ?;
  `;
    try {
      await db.query(query,[isOnline,userId]);
      console.log('Is Online' + isOnline);
    } catch (error) {
      console.log(error);
    }

}


let isOnline = false;
app.put('/change-messages-status-to-read', async (req, res) => {

  const { search_name, page,limit } = req.body; 

  const query = `
  UPDATE messages
  SET status = 'read'
  WHERE status = 'sent' AND conversation_id = ?  AND sender_id = ?;
  `;
    try {
      const [rows] = await db.query(query,[conversation_id,sender_id]);
      console.log('Is Online' + isOnline);


        if (rows.length > 0) {
          console.log('status updated to read');
        } 


    } catch (error) {
      console.log(error);
    }

});

app.get('/user/:id/is-online', async(req, res) => {
  const userId = req.params.id;
  const query = `SELECT is_online FROM users WHERE id = ?`;
  const [rows] = await db.query(query,[conversation_id,sender_id]);

  
  if (rows.length > 0) {
    isOnline = results[0].is_online === 1;
  } 
});





wss.on('connection', (ws ,req) => {

    console.log('New client connected!');
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const userId = urlParams.get('userId');

    ws.send(JSON.stringify({ 'is_connected': true}));


  console.log('User ID:' + userId);

  updateUserIsOnline(userId,1);

   
    ws.on('message', async (data) => {
      

    let mediaUrl = '';

      const { isTyping,type,conversation_id, sender_id,text, media_url,media_type,sender_name,sender_profile} = JSON.parse(data);

      console.log('Data' +JSON.parse(data));

     

      switch (type) {

        case "TYPING":
          await isUserTyping(data,ws,wss);
          break;

        case "NEW_MESSAGE":

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
          // mediaUrl = `http://localhost:3000/${imageName}`;
          mediaUrl = `https://websocket-chat-production-164a.up.railway.app/${imageName}`;
        
  
        }

            sendMessage(data,ws,wss, mediaUrl);
  
          break;

  
          case "REACTION":

          await addReactionToMessage(data,ws,wss);
       
          break;

          case "PIN":

       
           await addPin(data,ws,wss);

          break;

          case "GETALLPINNED":

       await getAllPinned(data, ws,wss);
       
          break;
        
          default:
        console.log("Unknown event type:", type);


      }

    

     
  
    });

    // const getAllPinned = async (data) => {
      
    //   const { conversation_id,user_id} = JSON.parse(data);
    //   const id = Math.floor(100000 + Math.random() * 900000);

      
    //   try {
     
    //     const query = ` SELECT messages.*, 
    //     users.name AS sender_name, 
    //     users.image_url AS sender_profile,
    //      reactions.reaction_type AS reaction_type,
    //   COALESCE(pm.is_pinned, FALSE) AS is_pinned
    // FROM messages 
    // LEFT JOIN pinned_messages pm ON messages.id = pm.message_id AND pm.conversation_id = messages.conversation_id
    // LEFT JOIN reactions ON messages.id =  reactions.message_id
    // JOIN users ON messages.sender_id =  users.id AND pm.user_id =  ?
    // WHERE messages.conversation_id = ?  AND pm.is_pinned = TRUE
    // ORDER BY messages.created_at ASC;`;
    //     const [rows] = await db.query(query,[user_id,conversation_id]);

    //     console.log('Get All Pinned' + rows);
    
    //     if(rows.length > 0){
    //       wss.clients.forEach((client) => {
    //         if (client.readyState === ws.OPEN) {
    //           client.send(JSON.stringify({
    //             type: 'GETALLPINNED', conversation_id: conversation_id, user_id: user_id, data:rows
             
    //           }));
    //         }
    //       });
    //     }else{
    //       ws.send(JSON.stringify({ type: 'GETALLPINNED',message: 'You dont have yet pinned message.', status: 'empty' }));
    //     }
       
    //     } catch (dbError) {
    //       ws.send(
    //         JSON.stringify({
    //           hasError: true,
    //           status: "error",
    //           error_log: dbError,
    //           message: 'Failed to get pinned messages to the database', 
    //         }));
    //     }


    // }

    // const addPin = async (data) => {
      
    //   const { conversation_id,message_id,user_id,is_pinned} = JSON.parse(data);
    //   const id = Math.floor(100000 + Math.random() * 900000);

      
    //   try {
     
    //     const query = `
    //     INSERT INTO pinned_messages (id,conversation_id, message_id,user_id, is_pinned)
    //      VALUES (?,?, ?, ?, ?)
    //      ON DUPLICATE KEY UPDATE is_pinned = VALUES(is_pinned);
    //    `;
    //        await db.query(query,[id,conversation_id,message_id,user_id,is_pinned]);


    //        wss.clients.forEach((client) => {
    //         if (client.readyState === ws.OPEN) {
    //           client.send(JSON.stringify({
    //             type: 'PIN', conversation_id: conversation_id, message_id: message_id,user_id: user_id,is_pinned:is_pinned
             
    //           }));
    //         }
    //       });
        
        
       
    //     } catch (dbError) {
    //       ws.send(
    //         JSON.stringify({
    //           hasError: true,
    //           status: "error",
    //           error_log: dbError,
    //           message: 'Failed to save pin message to the database', 
    //         })
    //       );
         
    //     }


    // }
  

  ws.on('close', () => {

     // Update user status to 'offline' when they disconnect

     
    updateUserIsOnline(userId,0);
  
  //    dbFireStore.collection('Users').doc('rbDN67WH7NQUxXB96QsLLYLSvwa2').update({ status: 'offline' })
  //    .then(() => console.log(`User ${userId} status set to offline`))
  //    .catch((err) => console.error(`Failed to update user ${userId} status`, err));
     console.log('Client disconnected: ' + userId);
     
    ws.send(JSON.stringify({ 'is_connected': true}));
   });
});
