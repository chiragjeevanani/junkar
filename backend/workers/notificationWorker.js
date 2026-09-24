import { Worker } from 'bullmq';
import logger from '../utils/logger.js';
import { NOTIFICATION_QUEUE_NAME } from '../queues/notificationQueue.js';
import Redis from 'ioredis';
import Scrapper from '../models/Scrapper.js';
import { notifyUser } from '../services/socketService.js';
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const notificationWorker = new Worker(NOTIFICATION_QUEUE_NAME, async (job) => {
    const { type, data } = job;

    logger.info(`Processing job ${job.id} of type ${job.name}`);

    try {
        if (job.name === 'new_order_broadcast') {
            const { orderId, orderDetails } = job.data;

            // Fetch all eligible online scrappers efficiently
            // We process in batches to avoid memory spikes even here if the list is huge
            // But for <10k users, streaming or batching is fine.
            // Let's use a cursor if possible, but mongoose `find` returns a cursor by default if not awaited fully?
            // No, `find` returns a Query. We can stream it.

            const cursor = Scrapper.find({
                isOnline: true,
                status: 'active',
                'kyc.status': 'verified'
            })
                .select('_id fcmTokens fcmTokenMobile')
                .cursor();

            let count = 0;

            for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                const scrapperId = doc._id.toString();

                // 1. Send Socket Notification
                notifyUser(scrapperId, 'new_order_request', {
                    orderId,
                    pickupAddress: orderDetails.pickupAddress,
                    orderType: orderDetails.orderType || 'scrap_pickup',
                    totalAmount: orderDetails.totalAmount,
                    message: 'New pickup request available!'
                });

                // 2. Send Push Notification
                const notificationPayload = {
                    title: 'New Order Request 🔔',
                    body: 'A new pickup request is available near you!',
                    data: {
                        orderId: orderId.toString(),
                        type: 'new_order'
                    }
                };

                // Don't await individual push notifications to block the worker loop too much?
                // Actually, we should await or promise.all batch them. 
                // For simplicity in this worker, we send sequentially or in small parallel batches.
                // Let's trust the helper to be relatively fast or fire-and-forget if appropriate.
                // `sendNotificationToUser` is async. We'll await it to ensure we don't flood the event loop.
                await sendNotificationToUser(scrapperId, notificationPayload, 'scrapper');

                count++;
            }

            logger.info(`✅ Broadcasted order ${orderId} to ${count} online scrappers.`);
        }
    } catch (error) {
        logger.error(`❌ Worker failed to process job ${job.id}:`, error);
        throw error; // Retry job
    }
}, {
    connection,
    concurrency: 5 // Process 5 jobs at a time
});

notificationWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed!`);
});

notificationWorker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed with ${err.message}`);
});

export default notificationWorker;
