const express = require('express');

const bodyParser = require('body-parser');

const router = express.Router();
const mysql = require('mysql2');

const multer = require('multer');
require('dotenv').config();
;
const dbapi = require('../config/db'); // Database connection





const fs = require('fs');
const path = require('path');


const app = express();




app.use(express.json()); // For parsing JSON requests
app.use(express.urlencoded({ extended: true })); // For parsing form data

// Serve static files
app.use(express.static('public'));
app.use(bodyParser.json());

// Create an "uploads" folder to store images
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
  }
  
  
  // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // const dbapi = mysql.createConnection({
  //   host: process.env.MYSQL_HOST,
  //   user: process.env.MYSQL_USER,
  //   password: process.env.MYSQL_PASSWORD,
  //   database: process.env.MYSQL_DATABASE
  // });


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

  // Create Product (POST /products)
  router.post('/products', upload.array('images', 10), (req, res) => {
    const { name, description, category, quantity, price } = req.body;
    const files = req.files;

     // Save image paths as JSON
  const imagePaths = files.map((file) => `/uploads/${file.filename}`);
    // const images = req.files.map(file => file.path); // Get the uploaded image paths

    // console.log('images'+images);
  
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const id = Math.floor(100000 + Math.random() * 900000);
  
    // Insert product into the products table with images stored as JSON
    dbapi.query(
      'INSERT INTO products (name, description, category, quantity, price, images) VALUES (?,?, ?, ?, ?, ?, ?)',
      [id,name, description, category, quantity, price, JSON.stringify(imagePaths)], // Convert images array to JSON string
      (err, result) => {
        if (err) {
          console.error('Error inserting product:', err);
          return res.status(500).json({ message: 'Server error' });
        }
  
        res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
      }
    );
  });



    // Get all product 
    router.get('/', (req, res) => {
        // Fetch all products from the database
        dbapi.query('SELECT * FROM products', (err, products) => {
          if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Server error' });
          }
      
          // Parse the `images` JSON field for each product
          const formattedProducts = products.map(product => {
            product.images = JSON.parse(product.images || '[]'); // Parse JSON or use empty array if null
            return product;
          });
      
          res.status(200).json({ products: formattedProducts });
        });
      });
    


  // Read Product (GET /products/:id)
  router.get('/:id', (req, res) => {
    const { id } = req.params;
  
    // Get product details along with images stored as JSON
    dbapi.query('SELECT * FROM products WHERE id = ?', [id], (err, productResult) => {
      if (err || productResult.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const product = productResult[0];
  
      // Parse the JSON images column to return the image URLs
      product.images = JSON.parse(product.images);
  
      res.status(200).json({ product });
    });
  });

  
  
  // Update Product (PUT /products/:id)
  app.put('/products/:id', upload.array('images', 10), (req, res) => {
    const { id } = req.params;
    const { name, description, category, quantity, price } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];
  
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
  
    // Update product details, and include new images as a JSON array
    dbapi.query(
      'UPDATE products SET name = ?, description = ?, category = ?, quantity = ?, price = ?, images = ? WHERE id = ?',
      [name, description, category, quantity, price, JSON.stringify(images), id],
      (err, result) => {
        if (err || result.affectedRows === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }
  
        res.status(200).json({ message: 'Product updated successfully' });
      }
    );
  });
  
  // Delete Product (DELETE /products/:id)
  app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
  
    // Delete the product from the products table
    dbapi.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.status(200).json({ message: 'Product deleted successfully' });
    });
  });




module.exports = router;