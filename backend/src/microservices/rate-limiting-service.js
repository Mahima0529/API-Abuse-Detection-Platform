const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('../routes/auth.routes');
const userRoutes = require('../routes/user.routes');
const requestTracker = require('../middlewares/requestTracker.middleware');
const { connectDB } = require('../config/db');

const app = express();
const PORT = process.env.RATE_LIMITING_SERVICE_PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(requestTracker);

// Service Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'Rate Limiting & Auth Microservice',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`[Rate Limiting Service] Microservice running on port ${PORT}`);
});
