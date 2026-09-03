const AppError = require('../utils/appError');

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    err = new AppError(`Duplicate value entered for '${field}'. Please use another value.`, 400);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    err = new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
  }

  // Handle Invalid JWT
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again.', 401);
  }

  // Handle Expired JWT
  if (err.name === 'TokenExpiredError') {
    err = new AppError('Your session token has expired. Please log in again.', 401);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = globalErrorHandler;
