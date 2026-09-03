const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const blockGuard = require('../middlewares/blockGuard.middleware');
const { calculateRiskScore } = require('../services/riskEngine.service');
const { connectDB } = require('../config/db');

const app = express();
const PORT = process.env.ABUSE_DETECTION_SERVICE_PORT || 5002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(blockGuard);

// Service Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'Behavioral Abuse Detection Microservice',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/v1/risk/eval', async (req, res) => {
  let rawIp = req.query.ip || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (typeof rawIp === 'string' && rawIp.includes(',')) {
    rawIp = rawIp.split(',')[0].trim();
  }
  const targetIp = rawIp.replace(/^::ffff:/, '');
  const riskResult = await calculateRiskScore(targetIp, req.user?.id || null);

  res.status(200).json({
    status: 'success',
    data: riskResult,
  });
});

connectDB();

app.listen(PORT, () => {
  console.log(`[Abuse Detection Service] Microservice running on port ${PORT}`);
});
