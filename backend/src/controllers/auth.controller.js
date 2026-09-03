const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { TOPICS, publishEvent } = require('../config/kafka');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

// Helper to generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// @desc    Register a new user (SQL Prisma + Kafka Streaming)
// @route   POST /api/v1/auth/register
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password.', 400));
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return next(new AppError('An account with this email address already exists.', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  const token = signToken(newUser.id);

  // Publish USER_REGISTERED event to Kafka
  publishEvent(TOPICS.USER_AUTH, 'USER_REGISTERED', {
    userId: newUser.id,
    name: newUser.name,
    email: newUser.email,
  }).catch((e) => console.error('[Kafka Auth Event Error]:', e.message));

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    },
  });
});

// @desc    User Login (SQL Prisma + Kafka Streaming)
// @route   POST /api/v1/auth/login
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    // Publish LOGIN_FAILED event to Kafka
    publishEvent(TOPICS.USER_AUTH, 'LOGIN_FAILED', {
      email: normalizedEmail,
      reason: !user ? 'User Not Found' : 'Invalid Password',
    }).catch((e) => console.error('[Kafka Auth Event Error]:', e.message));

    return next(new AppError('Invalid email or password.', 401));
  }

  const token = signToken(user.id);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
  });
});

module.exports = {
  register,
  login,
};
