const { prisma } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const { getEventStreamLogs, isInMemory } = require('../config/kafka');
const { getAnalyticsMetrics } = require('../consumers/analytics.consumer');
const { getAlertLogs } = require('../consumers/alerts.consumer');
const { calculateRiskScore } = require('../services/riskEngine.service');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get paginated recent API request logs
// @route   GET /api/v1/analytics/requests
const getRequestLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.ip) {
    where.ipAddress = req.query.ip;
  }
  if (req.query.userId) {
    where.userId = req.query.userId;
  }

  const total = await prisma.requestLog.count({ where });
  const rawLogs = await prisma.requestLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    skip,
    take: limit,
  });

  const logs = rawLogs.map((log) => ({
    _id: log.id,
    ipAddress: log.ipAddress,
    userId: log.user ? { _id: log.user.id, name: log.user.name, email: log.user.email } : null,
    endpoint: log.endpoint,
    method: log.method,
    statusCode: log.statusCode,
    responseTimeMs: log.responseTimeMs,
    userAgent: log.userAgent,
    timestamp: log.timestamp,
  }));

  res.status(200).json({
    status: 'success',
    results: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: { logs },
  });
});

// @desc    Get comprehensive Phase 7 Dashboard Metrics (All 8 required metrics)
// @route   GET /api/v1/analytics/dashboard-metrics
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // 1. Total API Requests
  const totalRequests = await prisma.requestLog.count();

  // 2. Requests Per Minute (RPM)
  const requestsPerMinute = await prisma.requestLog.count({
    where: { timestamp: { gte: oneMinuteAgo } },
  });

  // 3. Rate-Limit Violations (HTTP 429)
  const rateLimitViolations = await prisma.requestLog.count({
    where: { statusCode: 429 },
  });

  // 4. Failed Login Attempts (HTTP 401 on /auth/login)
  const failedLoginAttempts = await prisma.requestLog.count({
    where: {
      endpoint: { contains: '/auth/login' },
      statusCode: 401,
    },
  });

  // 5. Suspicious Activity Count (Risk 50-79)
  const suspiciousActivityCount = await prisma.securityEvent.count({
    where: {
      riskScore: { gte: 50, lt: 80 },
    },
  });

  // 6. Blocked IP Addresses Count (Redis Keys & ENTITY_BLOCKED events)
  const redis = getRedisClient();
  const blockedKeys = await redis.keys('block:ip:*');
  const blockedIpCount = blockedKeys.length;

  // 7. Top Suspicious IP Addresses (Ranked by violation counts & request volume)
  const topIPsRaw = await prisma.requestLog.groupBy({
    by: ['ipAddress'],
    _count: { ipAddress: true },
    orderBy: { _count: { ipAddress: 'desc' } },
    take: 5,
  });

  const topSuspiciousIPs = await Promise.all(
    topIPsRaw.map(async (item) => {
      const violations = await prisma.requestLog.count({
        where: { ipAddress: item.ipAddress, statusCode: 429 },
      });
      const failedLogins = await prisma.requestLog.count({
        where: { ipAddress: item.ipAddress, endpoint: { contains: '/auth/login' }, statusCode: 401 },
      });
      const isBlockedInRedis = (await redis.get(`block:ip:${item.ipAddress}`)) !== null;

      return {
        ipAddress: item.ipAddress,
        totalRequests: item._count.ipAddress,
        violations,
        failedLogins,
        isBlocked: isBlockedInRedis,
      };
    })
  );

  // 8. Recent Security Events Audit Feed
  const securityEvents = await prisma.securityEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  res.status(200).json({
    status: 'success',
    data: {
      totalRequests,
      requestsPerMinute,
      rateLimitViolations,
      failedLoginAttempts,
      suspiciousActivityCount,
      blockedIpCount,
      topSuspiciousIPs,
      securityEvents,
    },
  });
});

// @desc    Get Kafka Event Stream logs and consumer alerts
// @route   GET /api/v1/analytics/kafka-events
const getKafkaEvents = asyncHandler(async (req, res) => {
  const events = getEventStreamLogs();
  const alerts = getAlertLogs();
  const metrics = getAnalyticsMetrics();

  res.status(200).json({
    status: 'success',
    data: {
      engine: isInMemory() ? 'In-Memory Kafka Stream Engine' : 'Apache Kafka Broker (9092)',
      totalStreamedEvents: events.length,
      consumerMetrics: metrics,
      recentAlerts: alerts,
      events: events.slice(0, 25),
    },
  });
});

// @desc    Get current risk score evaluation
// @route   GET /api/v1/analytics/risk-eval
const evaluateRisk = asyncHandler(async (req, res) => {
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

// @desc    Get recent Security Audit Events
// @route   GET /api/v1/analytics/security-events
const getSecurityEvents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const events = await prisma.securityEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: { events },
  });
});

// @desc    Get currently blocked entities in Redis
// @route   GET /api/v1/analytics/blocked-entities
const getBlockedEntities = asyncHandler(async (req, res) => {
  const redis = getRedisClient();
  const keys = await redis.keys('block:*');

  const blocked = [];
  for (const key of keys) {
    const rawVal = await redis.get(key);
    const ttl = await redis.ttl(key);
    let parsed = {};
    try {
      parsed = JSON.parse(rawVal);
    } catch (e) {
      parsed = { raw: rawVal };
    }
    blocked.push({
      key,
      entity: key.replace('block:', ''),
      score: parsed.score || 85,
      blockedAt: parsed.timestamp,
      ttlSecondsRemaining: ttl,
    });
  }

  res.status(200).json({
    status: 'success',
    results: blocked.length,
    data: { blocked },
  });
});

// @desc    Get aggregated telemetry & risk statistics
// @route   GET /api/v1/analytics/stats
const getStats = asyncHandler(async (req, res) => {
  const totalRequests = await prisma.requestLog.count();
  const rateLimitViolations = await prisma.requestLog.count({
    where: { statusCode: 429 },
  });
  const securityEventsCount = await prisma.securityEvent.count();

  const redis = getRedisClient();
  const blockedKeys = await redis.keys('block:*');

  // Aggregate Top IPs
  const topIPsRaw = await prisma.requestLog.groupBy({
    by: ['ipAddress'],
    _count: { ipAddress: true },
    orderBy: { _count: { ipAddress: 'desc' } },
    take: 5,
  });
  const topIPs = topIPsRaw.map((item) => ({
    ipAddress: item.ipAddress,
    count: item._count.ipAddress,
  }));

  // Aggregate Top Endpoints
  const topEndpointsRaw = await prisma.requestLog.groupBy({
    by: ['endpoint'],
    _count: { endpoint: true },
    orderBy: { _count: { endpoint: 'desc' } },
    take: 5,
  });
  const topEndpoints = topEndpointsRaw.map((item) => ({
    endpoint: item.endpoint,
    count: item._count.endpoint,
  }));

  // Status code breakdown
  const statusRaw = await prisma.requestLog.groupBy({
    by: ['statusCode'],
    _count: { statusCode: true },
    orderBy: { statusCode: 'asc' },
  });
  const statusCodeBreakdown = statusRaw.map((item) => ({
    statusCode: item.statusCode,
    count: item._count.statusCode,
  }));

  // Average response time
  const avgResult = await prisma.requestLog.aggregate({
    _avg: { responseTimeMs: true },
  });
  const avgResponseTimeMs = avgResult._avg.responseTimeMs
    ? Math.round(avgResult._avg.responseTimeMs * 100) / 100
    : 0;

  res.status(200).json({
    status: 'success',
    data: {
      totalRequests,
      rateLimitViolations,
      securityEventsCount,
      blockedEntitiesCount: blockedKeys.length,
      avgResponseTimeMs,
      topIPs,
      topEndpoints,
      statusCodeBreakdown,
    },
  });
});

module.exports = {
  getRequestLogs,
  getDashboardMetrics,
  getKafkaEvents,
  evaluateRisk,
  getSecurityEvents,
  getBlockedEntities,
  getStats,
};
