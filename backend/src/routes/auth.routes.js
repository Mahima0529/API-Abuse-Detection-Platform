const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const createRateLimiter = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

const registerLimit = parseInt(process.env.RATE_LIMIT_REGISTRATION_LIMIT, 10) || 5;
const registerWindow = parseInt(process.env.RATE_LIMIT_REGISTRATION_WINDOW_SEC, 10) || 60;

const loginLimit = parseInt(process.env.RATE_LIMIT_LOGIN_LIMIT, 10) || 10;
const loginWindow = parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_SEC, 10) || 60;

router.post(
  '/register',
  createRateLimiter('auth:register', registerLimit, registerWindow),
  register
);

router.post(
  '/login',
  createRateLimiter('auth:login', loginLimit, loginWindow),
  login
);

module.exports = router;
