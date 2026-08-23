const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisEnabled = false;

// Fallback in-memory cache
const memoryCache = new Map();

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection failed. Switching to in-memory fallback cache.');
            isRedisEnabled = false;
            return false; // stop reconnecting
          }
          return Math.min(retries * 500, 2000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Error: ${err.message}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connection established');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      isRedisEnabled = true;
    });

    await redisClient.connect();
  } catch (error) {
    logger.error(`Could not connect to Redis: ${error.message}. In-memory fallback will be used.`);
    isRedisEnabled = false;
  }
};

const getCache = async (key) => {
  if (isRedisEnabled && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error(`Redis getCache error: ${err.message}`);
    }
  }
  
  // Fallback to memory
  const data = memoryCache.get(key);
  if (data) {
    if (data.expiry && data.expiry < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return data.value;
  }
  return null;
};

const setCache = async (key, value, expirySeconds = 3600) => {
  if (isRedisEnabled && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: expirySeconds,
      });
      return;
    } catch (err) {
      logger.error(`Redis setCache error: ${err.message}`);
    }
  }

  // Fallback to memory
  memoryCache.set(key, {
    value,
    expiry: Date.now() + expirySeconds * 1000,
  });
};

const deleteCache = async (key) => {
  if (isRedisEnabled && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      logger.error(`Redis deleteCache error: ${err.message}`);
    }
  }
  memoryCache.delete(key);
};

const clearCache = async () => {
  if (isRedisEnabled && redisClient) {
    try {
      await redisClient.flushDb();
      return;
    } catch (err) {
      logger.error(`Redis clearCache error: ${err.message}`);
    }
  }
  memoryCache.clear();
};

module.exports = {
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  clearCache,
  getRedisClient: () => redisClient,
  isRedisEnabled: () => isRedisEnabled,
};
