import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient;

export const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: null // BullMQ requirement
        });

        redisClient.on('connect', () => {
            logger.info('✅ Redis connected successfully');
        });

        redisClient.on('error', (err) => {
            logger.error('❌ Redis connection error:', err);
        });
    }
    return redisClient;
};

export const getRedisConfig = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    return {
        connection: {
            url: redisUrl,
            options: {
                maxRetriesPerRequest: null
            }
        }
    };
};
