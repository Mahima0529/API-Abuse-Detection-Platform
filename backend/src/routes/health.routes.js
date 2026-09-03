const express = require('express');
const { prisma } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected (SQL Engine)';
  } catch (err) {
    dbStatus = `error (${err.message})`;
  }

  res.status(200).json({
    status: 'success',
    message: 'Intelligent API Abuse & Bot Detection Backend Service (SQL Prisma Engine) is healthy.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      engine: 'SQL (Prisma)',
      status: dbStatus,
    },
  });
});

module.exports = router;
