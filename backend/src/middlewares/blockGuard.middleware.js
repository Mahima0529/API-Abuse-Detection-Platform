const { getRedisClient } = require('../config/redis');

/**
 * Middleware that checks Redis for temporary IP or User block keys.
 * Returns HTTP 403 Forbidden if the entity is currently blocked.
 */
const blockGuard = async (req, res, next) => {
  try {
    const redis = getRedisClient();

    let rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (typeof rawIp === 'string' && rawIp.includes(',')) {
      rawIp = rawIp.split(',')[0].trim();
    }
    const ipAddress = rawIp.replace(/^::ffff:/, '');

    // Allow health check and analytics routes to be accessed for monitoring
    if (req.originalUrl.includes('/health') || req.originalUrl.includes('/analytics')) {
      return next();
    }

    const ipBlockKey = `block:ip:${ipAddress}`;
    const userBlockKey = req.user ? `block:user:${req.user.id}` : null;

    const isIpBlocked = await redis.get(ipBlockKey);
    const isUserBlocked = userBlockKey ? await redis.get(userBlockKey) : null;

    if (isIpBlocked || isUserBlocked) {
      const activeKey = isIpBlocked ? ipBlockKey : userBlockKey;
      let ttl = await redis.ttl(activeKey);
      if (ttl < 0) ttl = 300;

      const blockData = JSON.parse(isIpBlocked || isUserBlocked || '{}');

      return res.status(403).json({
        status: 'fail',
        error: 'ENTITY_BLOCKED',
        message: 'Access blocked by Intelligent Behavioral Risk Engine. Your entity reached high risk score.',
        riskScore: blockData.score || 85,
        retryAfterSeconds: ttl,
        blockedUntil: new Date(Date.now() + ttl * 1000).toISOString(),
      });
    }

    next();
  } catch (err) {
    console.error('[BlockGuard Error] Redis check failed:', err.message);
    next(); // Fail-open strategy
  }
};

module.exports = blockGuard;
