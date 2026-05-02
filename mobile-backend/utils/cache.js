const redis = require('redis');
const logger = require('../middleware/logger');

let redisClient = null;

/**
 * Initialize Redis client for caching
 * Improves performance by caching frequently accessed data
 */
const initRedis = async () => {
    if (!process.env.REDIS_URL) {
        logger.warn('REDIS_URL not configured - caching disabled');
        return null;
    }

    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500)
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis connection error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        });

        await redisClient.connect();
        logger.info('✅ Redis caching initialized');
        return redisClient;
    } catch (error) {
        logger.error('Failed to initialize Redis:', error);
        return null;
    }
};

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
const getCache = async (key) => {
    if (!redisClient) return null;

    try {
        const value = await redisClient.get(key);
        if (value) {
            logger.debug(`Cache hit: ${key}`);
            return JSON.parse(value);
        }
        logger.debug(`Cache miss: ${key}`);
        return null;
    } catch (error) {
        logger.error(`Cache get error for key ${key}:`, error);
        return null;
    }
};

/**
 * Set cached value with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
const setCache = async (key, value, ttl = 300) => {
    if (!redisClient) return false;

    try {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
        return true;
    } catch (error) {
        logger.error(`Cache set error for key ${key}:`, error);
        return false;
    }
};

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
    if (!redisClient) return false;

    try {
        await redisClient.del(key);
        logger.debug(`Cache deleted: ${key}`);
        return true;
    } catch (error) {
        logger.error(`Cache delete error for key ${key}:`, error);
        return false;
    }
};

/**
 * Clear all cached values matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'jobs:*')
 */
const clearCachePattern = async (pattern) => {
    if (!redisClient) return false;

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.debug(`Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
        }
        return true;
    } catch (error) {
        logger.error(`Cache clear error for pattern ${pattern}:`, error);
        return false;
    }
};

/**
 * Middleware for caching GET requests
 * Usage: app.get('/api/jobs', cacheMiddleware('jobs', 600), jobController)
 */
const cacheMiddleware = (cacheKey, ttl = 300) => {
    return async (req, res, next) => {
        try {
            const cachedData = await getCache(cacheKey);
            if (cachedData) {
                return res.json({
                    status: 'success',
                    data: cachedData,
                    cached: true
                });
            }
        } catch (error) {
            logger.warn('Cache middleware error:', error);
            // Continue without cache on error
        }
        
        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            if (data?.status === 'success' && data?.data) {
                setCache(cacheKey, data.data, ttl).catch(err => 
                    logger.warn('Failed to set cache:', err)
                );
            }
            return originalJson(data);
        };

        next();
    };
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed');
    }
};

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    clearCachePattern,
    cacheMiddleware,
    closeRedis
};
