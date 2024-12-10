const express = require('express');
const router = express.Router();
const multer = require('multer');
require('dotenv').config();
const db = require('../config/db'); 



const fs = require('fs');
const path = require('path');


// Create an "uploads" folder to store images
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
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


  // Product Validation Middleware
function validateFields(req, res, next) {
  const { name, price, quantity } = req.body;
  const errors = {};
  let isError = false;
  const files = req.files;


  // Check if fields are empty
  if (!name || name.trim() === "") {
    isError = true;
    errors.name = "Name is required";
  }
  if (!price || price.toString().trim() === "") {
    errors.price = "Price is required";
    isError = true;
  }
  if (!quantity || quantity.toString().trim() === "") {
    isError = true;
    errors.quantity = "Quantity is required";
  }
  

  if (isError && req.files) {

    console.log(`quantity ${errors}`);

    // remove image files to uploads folder if exist
    files.map((file) =>{

      console.log(file.filename);
      
       fs.unlinkSync(`uploads/${file.filename}`);
    
    });
  }

  // If errors exist, return error response
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Proceed to the next middleware or route handler
  next();
}

  // Create Product (POST /products)
  router.post('/', upload.array('images', 10), validateFields,(req, res) => {
    try {
      const { name, description, category, quantity, price } = req.body;
    const files = req.files;
    
    let imageUrl = [];

    const id = Math.floor(100000 + Math.random() * 900000);

         // Save image paths as JSON
   imageUrl = files.map((file) =>{
    return `http://localhost:3000/uploads/${file.filename}`
  });


    // Insert product into the products table with images stored as JSON
    db.query(
      'INSERT INTO products (id,name, description, category, quantity, price, images) VALUES (?,?, ?, ?, ?, ?, ?)',
      [id,name, description, category, quantity, price, JSON.stringify(imageUrl)], // Convert images array to JSON string
      (err, result) => {
        if (err) {
          console.error('Error inserting product:', err);
          return res.status(500).json({ message: 'Server error' });
        }
  
        res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
      }
    );
    } catch (err) {

       // Remove uploaded file if an error occurs
    if (req.file) {
      const fs = require("fs");
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Failed to delete invalid image:", unlinkErr.message);
      });
    }

    // Return error response
    res.status(400).json({
      message: "Error adding product",
      error: err.message,
    });
      
    }
    
  });



    // Get all products
    router.get('/', (req, res) => {
        // Fetch all products from the database
        db.query('SELECT * FROM products', (err, products) => {
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
    db.query('SELECT * FROM products WHERE id = ?', [id], (err, productResult) => {
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
  router.put('/:id', upload.array('images', 10), (req, res) => {
    const { id } = req.params;
    const { name, description, category, quantity, price } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    
    
    let query =  'UPDATE products SET name = ?, description = ?, category = ?, quantity = ?, price = ?';
    
    let params = [name, description, category, quantity, price];
    
  
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    let imageUrl = [];

      


    if (req.files != '') {
             
  // req.files.map((file) => `uploads/${file.filename}`);


     imageUrl = req.files.map((file) =>{

      return `http://localhost:3000/uploads/${file.filename}`
    });

 
      query += ', images = ?';
      params.push(JSON.stringify(imageUrl)); // Add image to parameters if provided
    }

    query += ' WHERE id = ?';
    params.push(id);
  
   
    db.query(
      query,
      params,
      (err, result) => {
        if (err || result.affectedRows === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }
  
        res.status(200).json({ message: 'Product updated successfully' });
      }
    );
  });
  
  // Delete Product (DELETE /products/:id)
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
  
    // Delete the product from the products table
    db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
      if (err || result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.status(200).json({ message: 'Product deleted successfully' });
    });
  });




module.exports = router;