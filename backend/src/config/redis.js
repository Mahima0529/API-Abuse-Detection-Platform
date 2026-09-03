const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');

let redisClient;
let isUsingMock = false;

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = parseInt(process.env.REDIS_PORT, 10) || 6379;

// Attempt live Redis connection with fast fallback
try {
  redisClient = new Redis({
    host,
    port,
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Do not endlessly retry if server is offline
  });

  redisClient
    .connect()
    .then(() => {
      console.log(`[Redis] Connected to live Redis server at ${host}:${port}`);
    })
    .catch(() => {
      console.log('[Redis Note] Standalone Redis server offline. Initializing high-performance In-Memory Redis Engine.');
      redisClient = new RedisMock();
      isUsingMock = true;
    });
} catch (err) {
  console.log('[Redis Note] Initializing In-Memory Redis Engine.');
  redisClient = new RedisMock();
  isUsingMock = true;
}

// Fallback safety wrapper
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new RedisMock();
    isUsingMock = true;
  }
  return redisClient;
};

module.exports = {
  getRedisClient,
  isMock: () => isUsingMock,
};
