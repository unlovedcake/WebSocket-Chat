require('dotenv').config();
const jwt = require('jsonwebtoken');




// const authenticateToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, 'secret');
//     req.user = decoded; // Attach user details to request
//     next();
//   } catch (err) {
//     res.status(403).json({ message: 'Invalid token' });
//   }
// };

 const authenticateToken = (req, res, next) => {

    try {
        const token = req.headers['authorization']?.split(' ')[1];
  
        if (!token) {
          return res.status(403).json({ message: 'Access denied' });
        }
      
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            if (err.name === 'TokenExpiredError') {
                // If the token is expired
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
              }
            return res.status(403).json({ message: 'Invalid token' });
          }
          req.user = user;
          next();
        });
        
    } catch (error) {

     
          return res.status(400).json({ message: 'Invalid token.' });
        
    }
 
  };


  const verifyRefreshToken  = (req, res, next) => {

    try {
        
        const token = req.headers['authorization']?.split(' ')[1];
  
        if (!token) {
          return res.status(403).json({ message: 'Access denied' });
        }
      
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
          if (err) {
            if (err.name === 'TokenExpiredError') {
                // If the token is expired
                return res.status(401).json({ message: 'Refresh Token expired. Please log in again.' });
              }
            return res.status(403).json({ message: 'Invalid token' });
          }
          req.user = user;
          next();
        });
        
    } catch (error) {

      
          return res.status(400).json({ message: 'Invalid token.' });
        
    }
 
  };


  

module.exports = authenticateToken;
//module.exports = verifyRefreshToken;
