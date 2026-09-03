const { prisma } = require('../config/db');
const { TOPICS, publishEvent } = require('../config/kafka');
const { calculateRiskScore } = require('../services/riskEngine.service');

/**
 * Middleware for real-time API request tracking, telemetry logging, and Kafka event streaming.
 */
const requestTracker = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  let rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (typeof rawIp === 'string' && rawIp.includes(',')) {
    rawIp = rawIp.split(',')[0].trim();
  }
  const ipAddress = rawIp.replace(/^::ffff:/, '');

  res.on('finish', async () => {
    try {
      const endTime = process.hrtime.bigint();
      const responseTimeMs = Math.round(Number(endTime - startTime) / 1e6 * 100) / 100;

      const userId = req.user ? req.user.id : null;
      const endpoint = req.originalUrl || req.url;

      // 1. Log request telemetry to SQL database
      await prisma.requestLog.create({
        data: {
          ipAddress,
          userId,
          endpoint,
          method: req.method,
          statusCode: res.statusCode,
          responseTimeMs,
          userAgent: req.headers['user-agent'] || '',
        },
      });

      // 2. Publish REQUEST_RECEIVED event to Kafka topic asynchronously
      publishEvent(TOPICS.API_REQUESTS, 'REQUEST_RECEIVED', {
        ipAddress,
        userId,
        endpoint,
        method: req.method,
        statusCode: res.statusCode,
        responseTimeMs,
      }).catch((e) => console.error('[Kafka Track Error]:', e.message));

      // 3. Trigger asynchronous Behavioral Risk Evaluation
      if (!endpoint.includes('/health') && !endpoint.includes('/analytics')) {
        calculateRiskScore(ipAddress, userId).catch((err) => {
          console.error('[RiskEngine Evaluation Async Error]:', err.message);
        });
      }
    } catch (err) {
      console.error('[RequestTracker SQL Error] Failed to log telemetry:', err.message);
    }
  });

  next();
};

module.exports = requestTracker;
