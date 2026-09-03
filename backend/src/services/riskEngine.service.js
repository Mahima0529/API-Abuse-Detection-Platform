const { prisma } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const { TOPICS, publishEvent } = require('../config/kafka');

const PENALTY_EXCESSIVE = parseInt(process.env.RISK_PENALTY_EXCESSIVE_REQUESTS, 10) || 30;
const PENALTY_RATE_LIMIT = parseInt(process.env.RISK_PENALTY_RATE_LIMIT_VIOLATION, 10) || 30;
const PENALTY_FAILED_LOGIN = parseInt(process.env.RISK_PENALTY_FAILED_LOGIN, 10) || 20;
const PENALTY_RAPID_BURST = parseInt(process.env.RISK_PENALTY_RAPID_REQUESTS, 10) || 20;

const THRESHOLD_SUSPICIOUS = parseInt(process.env.RISK_THRESHOLD_SUSPICIOUS, 10) || 50;
const THRESHOLD_HIGH = parseInt(process.env.RISK_THRESHOLD_HIGH, 10) || 80;
const BLOCK_TTL_SEC = parseInt(process.env.TEMP_BLOCK_TTL_SEC, 10) || 300;

const calculateRiskScore = async (ipAddress, userId = null) => {
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const fiveSecsAgo = new Date(Date.now() - 5 * 1000);

  const recentLogs = await prisma.requestLog.findMany({
    where: {
      ipAddress,
      timestamp: { gte: fiveMinsAgo },
    },
    select: {
      endpoint: true,
      statusCode: true,
      timestamp: true,
    },
  });

  let score = 0;
  const signals = [];

  const rateLimitViolations = recentLogs.filter((log) => log.statusCode === 429).length;
  if (rateLimitViolations > 0) {
    const penalty = Math.min(60, rateLimitViolations * PENALTY_RATE_LIMIT);
    score += penalty;
    signals.push({
      signal: 'RATE_LIMIT_VIOLATIONS',
      points: penalty,
      details: `${rateLimitViolations} rate-limit breach(es) detected in past 5 minutes`,
    });
  }

  const failedLogins = recentLogs.filter(
    (log) => log.endpoint.includes('/auth/login') && log.statusCode === 401
  ).length;
  if (failedLogins >= 2) {
    const penalty = Math.min(40, failedLogins * PENALTY_FAILED_LOGIN);
    score += penalty;
    signals.push({
      signal: 'REPEATED_FAILED_LOGINS',
      points: penalty,
      details: `${failedLogins} failed login attempt(s) detected in past 5 minutes`,
    });
  }

  const totalVolume = recentLogs.length;
  if (totalVolume > 30) {
    score += PENALTY_EXCESSIVE;
    signals.push({
      signal: 'EXCESSIVE_REQUEST_VOLUME',
      points: PENALTY_EXCESSIVE,
      details: `${totalVolume} API requests in past 5 minutes (threshold: 30)`,
    });
  }

  const rapidBurstCount = recentLogs.filter((log) => log.timestamp >= fiveSecsAgo).length;
  if (rapidBurstCount > 8) {
    score += PENALTY_RAPID_BURST;
    signals.push({
      signal: 'RAPID_REQUEST_BURST',
      points: PENALTY_RAPID_BURST,
      details: `${rapidBurstCount} requests burst in past 5 seconds (threshold: 8)`,
    });
  }

  score = Math.min(100, score);

  let riskLevel = 'NORMAL';
  if (score >= THRESHOLD_HIGH) {
    riskLevel = 'HIGH_RISK';
  } else if (score >= THRESHOLD_SUSPICIOUS) {
    riskLevel = 'SUSPICIOUS';
  }

  if (score >= THRESHOLD_HIGH) {
    await blockEntity(ipAddress, userId, score, signals);
  } else if (score >= THRESHOLD_SUSPICIOUS) {
    publishEvent(TOPICS.SECURITY_ABUSE, 'SUSPICIOUS_ACTIVITY_DETECTED', {
      ipAddress,
      userId,
      score,
      signals,
    }).catch((e) => console.error('[Kafka Risk Error]:', e.message));
  }

  return {
    ipAddress,
    userId,
    score,
    riskLevel,
    signals,
    isBlocked: score >= THRESHOLD_HIGH,
  };
};

const blockEntity = async (ipAddress, userId, score, signals) => {
  const redis = getRedisClient();
  const blockKey = `block:ip:${ipAddress}`;

  await redis.set(blockKey, JSON.stringify({ score, timestamp: new Date() }), 'EX', BLOCK_TTL_SEC);

  if (userId) {
    const userBlockKey = `block:user:${userId}`;
    await redis.set(userBlockKey, JSON.stringify({ score, timestamp: new Date() }), 'EX', BLOCK_TTL_SEC);
  }

  // Publish ENTITY_BLOCKED event to Kafka
  publishEvent(TOPICS.SECURITY_ABUSE, 'ENTITY_BLOCKED', {
    ipAddress,
    userId,
    score,
    ttlSeconds: BLOCK_TTL_SEC,
    signals,
  }).catch((e) => console.error('[Kafka Block Event Error]:', e.message));

  console.warn(`[RiskEngine Alert] IP ${ipAddress} REACHED HIGH RISK (Score: ${score}). TEMPORARILY BLOCKED in Redis for ${BLOCK_TTL_SEC}s.`);
};

module.exports = {
  calculateRiskScore,
  blockEntity,
};
