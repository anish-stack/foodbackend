// middleware/authMiddleware.js
require('dotenv').config({path: './config.env'});
const jwt = require('jsonwebtoken');
const User = require('../modals/userSchema'); // Import the User model
// middleware/authMiddleware.js
const ErrorHandler = require('../utility/errorHandler')
exports.protect = async (req, res, next) => {
  try {
      // Extract the token from various sources (cookies, body, headers)
      const token =
          req.cookies.token || req.body.token || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '');

      if (!token) {
          return res.status(401).json({
              success: false,
              message: 'Please Login to Access this',
          });
      }

      try {
          // Verify the token
          const decoded = await jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded; // Attach the decoded user information to the request object
          next(); // Continue to the next middleware
      } catch (error) {
          return res.status(401).json({
              success: false,
              message: 'Invalid token',
          });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error',
      });
  }
};

  

// only for admin 
exports.isAdmin = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new ErrorHandler(
            `Role: ${req.user.role} is not allowed to access this resouce `,
            403
          )
        );
      }
  
      next();
    };
  };