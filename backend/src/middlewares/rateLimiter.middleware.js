const { getRedisClient } = require('../config/redis');
const { TOPICS, publishEvent } = require('../config/kafka');

/**
 * Higher-Order Rate Limiting Middleware using Redis (Atomic INCR & EXPIRE) with Kafka Streaming
 */
const createRateLimiter = (prefix, limit, windowSec) => {
  return async (req, res, next) => {
    try {
      const redis = getRedisClient();

      let rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '127.0.0.1';
      if (typeof rawIp === 'string' && rawIp.includes(',')) {
        rawIp = rawIp.split(',')[0].trim();
      }
      const ipAddress = rawIp.replace(/^::ffff:/, '');

      const key = `ratelimit:${prefix}:${ipAddress}`;

      const currentCount = await redis.incr(key);

      if (currentCount === 1) {
        await redis.expire(key, windowSec);
      }

      let ttl = await redis.ttl(key);
      if (ttl < 0) ttl = windowSec;

      const remaining = Math.max(0, limit - currentCount);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', ttl);

      if (currentCount > limit) {
        // Publish RATE_LIMIT_EXCEEDED event to Kafka
        publishEvent(TOPICS.SECURITY_ABUSE, 'RATE_LIMIT_EXCEEDED', {
          ipAddress,
          prefix,
          limit,
          windowSeconds: windowSec,
          count: currentCount,
        }).catch((e) => console.error('[Kafka RateLimit Event Error]:', e.message));

        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          status: 'fail',
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for ${prefix}. Maximum ${limit} requests per ${windowSec}s allowed.`,
          retryAfterSeconds: ttl,
          limit,
          windowSeconds: windowSec,
        });
      }

      next();
    } catch (err) {
      console.error('[RateLimiter Error] Redis operation failed:', err.message);
      next();
    }
  };
};

module.exports = createRateLimiter;
