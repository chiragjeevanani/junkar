import { Queue } from 'bullmq';
import { getRedisConfig } from '../config/redis.js';
import logger from '../utils/logger.js';
import Redis from 'ioredis';

// Define Queue Name
export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

const redisConfig = {
    // BullMQ requires a dedicated connection for blocking commands if using workers, 
    // but for queues, we can share or create new. Here we create new to be safe.
    connection: new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null
    })
};

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, redisConfig);

logger.info(`✅ Queue ${NOTIFICATION_QUEUE_NAME} initialized`);

export const addNotificationJob = async (jobName, data) => {
    try {
        await notificationQueue.add(jobName, data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true, // Keep successful jobs out of Redis memory
            removeOnFail: 1000      // Keep failed jobs for debugging
        });
        // logger.info(`Job added to ${NOTIFICATION_QUEUE_NAME}: ${jobName}`);
    } catch (error) {
        logger.error(`❌ Error adding job to ${NOTIFICATION_QUEUE_NAME}:`, error);
        // Fallback: Could process directly if queue is down, but for now just log
    }
};

export default notificationQueue;
