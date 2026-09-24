import { checkExpiredSubscriptions } from '../services/subscriptionService.js';
import orderService from '../services/orderService.js';
import logger from './logger.js';

/**
 * Initialize all automated background tasks (Cron jobs)
 * This uses simple setInterval as a lightweight alternative to node-cron
 */
export const initializeCronJobs = () => {
  logger.info('⏲️ Initializing automated background tasks...');

  // 1. Subscription Expiry Check
  // Run once on startup (after a small delay to ensure DB is ready)
  setTimeout(async () => {
    try {
      logger.info('[Cron] Running startup subscription expiry check...');
      const result = await checkExpiredSubscriptions();
      logger.info(`[Cron] Startup check completed: ${result.message}`);
    } catch (error) {
      logger.error('[Cron] Startup subscription check failed:', error);
    }
  }, 10000); // 10 seconds delay

  // Then run every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      logger.info('[Cron] Running daily subscription expiry check...');
      const result = await checkExpiredSubscriptions();
      logger.info(`[Cron] Daily check completed: ${result.message}`);
    } catch (error) {
      logger.error('[Cron] Daily subscription check failed:', error);
    }
  }, TWENTY_FOUR_HOURS);

  // 2. Overdue Order Auto-Unassign Check (Runs every 1 hour)
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(async () => {
    try {
      logger.info('[Cron] Running hourly overdue order timeout check...');
      const result = await orderService.autoUnassignOverdueOrders();
      if (result.processed > 0) {
        logger.info(`[Cron] Overdue order check completed: Released ${result.processed} orders.`);
      }
    } catch (error) {
      logger.error('[Cron] Hourly overdue order check failed:', error);
    }
  }, ONE_HOUR);

  logger.info('✅ Automated tasks scheduled successfully (Daily interval: 24h, Hourly interval: 1h)');
};
