const db = require('../database');
const express = require('express');
const router = express.Router();
const { WebSocketServer } = require('ws');
const multer = require('multer');
require('dotenv').config();
const { fromBuffer } = require('file-type');


const app = express();
app.use(express.static('public'));
const PORT = 4000;

const fs = require('fs');
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




// Create an "uploads" folder to store images
// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // Create the uploads folder if it doesn't exist
}

// File Filter to Allow Only JPG, JPEG, and PNG
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
  
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error("Only JPG, JPEG, and PNG files are allowed!"), false); // Reject the file
    }
  };
  
    // Set up multer for image uploads
  const storage = multer.diskStorage({
      
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
      }
    });
  
  
    const upload = multer({ 
      fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 },
      storage: storage });
  



// WebSocket server setup
const server = app.listen(PORT, () => {
    console.log(`Web Socket Server is running on http://localhost:${PORT}`);
  });
  
  const wss = new WebSocketServer({ server });
  
  // REST API for fetching chat history
  router.get('/messages', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at ASC');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  

  const allowedMimeTypes = ['image/png', 'image/jpeg',  'image/gif', 'video/mp4'];
  
  
  wss.on('connection', (ws) => {
      console.log('New client connected!');
    
      ws.on('message',async (data) => {
        //const parsedData = JSON.parse(data);
  
        const { username, username_image,message, image} = JSON.parse(data);
        const id = Math.floor(100000 + Math.random() * 900000);
    
        // If an image is sent
        if (image) {

          
    
          // Save message with image URL to the database
          try {
               // Decode base64 image
               const imageBuffers = Buffer.from(image, 'base64');
               const fileType = await fromBuffer(imageBuffers);
  
               console.log('TYPE IMAGE' +fileType.ext);
  
               if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
                ws.send(JSON.stringify({ 'status': 'error', 'message': 'unsupported image type ' +fileType.mime}));
  
                  return;
                 
                   //throw new Error('Invalid or unsupported image type.');
               }
  
            
  
            const imageBuffer = Buffer.from(image, 'base64');
            const imageName = `../${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileType.ext}`;
  
         
             const destinationPath = path.join(`${uploadsDir}/uploads`, imageName);
  
             console.log('Resolved Path:', destinationPath);
  
      
            // Save the image
            fs.writeFileSync(destinationPath, imageBuffer);
            
  
            // Broadcast the image URL
            const imageUrl = `http://localhost:3000/${destinationPath}`;
            image.image_url = imageUrl;
  
  
            await db.query(
              'INSERT INTO messages (id,username, username_image, message, image_url) VALUES (?,?, ?, ?,?)',
              [id  ,username,username_image, message || '', imageUrl]
            );
    
            // Broadcast the message to all connected clients
            wss.clients.forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  id: id,
                  username: username,
                  username_image:username_image,
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
        await db.query('INSERT INTO messages (id,username,username_image, message) VALUES (?, ?, ?, ?)', [id,username,username_image, message]);
  
        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({id, username,username_image, message, created_at: new Date() }));
          }
        });
      } catch (error) {
        ws.send(JSON.stringify({ 'status': 'error', 'message': 'unsupported image type ' +fileType.mime}));
        console.error('Error saving message:', error);
      }
        }
      });
    
  
    ws.on('close', () => {
      console.log('Client disconnected.');
    });
  });

  module.exports = router;