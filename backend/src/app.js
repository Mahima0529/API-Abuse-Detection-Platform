const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const requestTracker = require('./middlewares/requestTracker.middleware');
const blockGuard = require('./middlewares/blockGuard.middleware');
const createRateLimiter = require('./middlewares/rateLimiter.middleware');
const globalErrorHandler = require('./middlewares/error.middleware');
const AppError = require('./utils/appError');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 1. Redis Block Guard (Enforces HTTP 403 for High-Risk Blocked IPs/Users)
app.use(blockGuard);

// 2. Global Request Telemetry Tracker
app.use(requestTracker);

// 3. Global General API Rate Limiter
const generalLimit = parseInt(process.env.RATE_LIMIT_GENERAL_LIMIT, 10) || 100;
const generalWindow = parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_SEC, 10) || 60;
app.use('/api/', createRateLimiter('general', generalLimit, generalWindow));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Handle 404 for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
