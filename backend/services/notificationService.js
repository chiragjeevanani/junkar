import Scrapper from '../models/Scrapper.js';
import Notification from '../models/Notification.js';
import { notifyUser } from './socketService.js';
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js';
import logger from '../utils/logger.js';

/**
 * NotificationService - Multi-channel notification dispatch
 * Handles Socket.io, FCM push notifications, and future channels (SMS, email)
 */
class NotificationService {
    /**
     * Notify online scrappers about a new order
     * @param {Object} order - Order object
     * @returns {Promise<void>}
     */
    async notifyOnlineScrappers(order) {
        try {
            const RADIUS_KM = 15;
            const isSmallOrder = order.quantityType !== 'large';

            const onlineScrappersQuery = {
                status: 'active',
                $and: [
                    { $or: [{ isOnline: true }, { receptionMode: true }] },
                    { $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }] },
                    // Exclude the sender themselves if they are a scrapper
                    { _id: { $ne: order.user } }
                ]
            };

            // Cross-role logic: Notify ALL nearby online scrappers for common pickups
            // Normal orders (small or large) will go to anyone nearby
            // But donations still usually go only to small scrappers/feri wala
            if (order.isDonation) {
                onlineScrappersQuery.scrapperType = { $in: ['feri_wala', 'small'] };
            }

            // Apply 15km radius filter if order location is available
            const hasValidLocation = order.location &&
                order.location.coordinates &&
                order.location.coordinates[0] !== 0 &&
                order.location.coordinates[1] !== 0;

            if (hasValidLocation) {
                onlineScrappersQuery.liveLocation = {
                    $nearSphere: {
                        $geometry: {
                            type: 'Point',
                            coordinates: order.location.coordinates // [lng, lat]
                        },
                        $maxDistance: 15 * 1000 // In meters (15 km limit)
                    }
                };
            } else {
                // If there's no valid location, we cannot send the request to anyone
                logger.info(`Order ${order._id} has no valid location — skipping notification.`);
                return;
            }

            let onlineScrappers = await Scrapper.find(onlineScrappersQuery).select('_id fcmTokens fcmTokenMobile');

            if (onlineScrappers.length === 0) {
                logger.info(`No online scrappers found for Order ${order._id} (quantityType: ${order.quantityType})`);
                return;
            }

            const notificationPayload = {
                title: order.isDonation ? '🎁 Donation Pickup Request!' : 'New Order Request 🔔',
                body: order.isDonation ? 'Someone wants to donate scrap nearby. It is completely free!' : 'A new pickup request is available near you!',
                data: {
                    orderId: order._id.toString(),
                    type: order.isDonation ? 'donation_order' : 'new_order'
                }
            };

            // Send notifications concurrently
            await Promise.allSettled(
                onlineScrappers.map(scrapper =>
                    this.notifyScrapper(scrapper._id.toString(), order, notificationPayload)
                )
            );

            logger.info(`Notified ${onlineScrappers.length} online scrappers (type: ${isSmallOrder ? 'feri_wala/small' : 'big'}) for Order ${order._id} (hasLocation: ${hasValidLocation})`);
        } catch (error) {
            logger.error('Error notifying online scrappers:', error);
            throw error;
        }
    }

    /**
     * Notify big scrappers about a forwarded order
     * @param {Object} order - Order object
     * @returns {Promise<void>}
     */
    async notifyBigScrappers(order) {
        try {
            const bigScrappers = await Scrapper.find({
                $or: [{ isOnline: true }, { receptionMode: true }],
                status: 'active',
                'kyc.status': 'verified',
                scrapperType: 'big',
                // Exclude the sender (likely a small scrapper/feri_wala)
                _id: { $ne: order.user }
            }).select('_id fcmTokens fcmTokenMobile');

            if (bigScrappers.length === 0) {
                logger.info(`No big scrappers found for forwarded Order ${order._id}`);
                return;
            }

            const notificationPayload = {
                title: 'Forwarded Order Available 📦',
                body: 'A bulk order has been forwarded to you!',
                data: {
                    orderId: order._id.toString(),
                    type: 'forwarded_order'
                }
            };

            await Promise.allSettled(
                bigScrappers.map(scrapper =>
                    this.notifyScrapper(scrapper._id.toString(), order, notificationPayload)
                )
            );

            logger.info(`Notified ${bigScrappers.length} big scrappers for forwarded Order ${order._id}`);
        } catch (error) {
            logger.error('Error notifying big scrappers:', error);
            throw error;
        }
    }

    /**
     * Notify specific targeted scrappers about a B2B request
     * @param {Object} order - Order object with targetedScrappers array
     * @returns {Promise<void>}
     */
    async notifyTargetedScrappers(order) {
        try {
            // 1. Identify Targeted Scrappers (Standardize to strings)
            const scrapperIds = (order.targetedScrappers || [])
                .map(id => id.toString())
                .filter(id => {
                    const userField = order.user;
                    const senderId = userField?._id
                        ? userField._id.toString()
                        : (userField ? userField.toString() : null);
                    return senderId ? id !== senderId : true; // if no sender, notify all
                });

            if (scrapperIds.length === 0) return;

            // 2. Fetch Potential Recipients
            const potentialScrappers = await Scrapper.find({
                _id: { $in: scrapperIds }
            }).select('_id status receptionMode isOnline fcmTokens fcmTokenMobile');

            // 3. Dispatch Logic (Insurance Pattern)
            const senderName = order.user?.name || 'Partner';
            
            const notificationPayload = {
                title: 'New Direct Request 🎯',
                body: `New bulk scrap request from ${senderName}`,
                data: {
                    orderId: order._id.toString(),
                    type: 'new_order',
                    userName: senderName
                }
            };

            await Promise.allSettled(
                potentialScrappers.map(scrapper => {
                    const sid = scrapper._id.toString();
                    const isReady = !!scrapper.receptionMode || !!scrapper.isOnline;
                    
                    // We ALWAYS notify the DB for targeted requests (Mailbox mode)
                    // But we ONLY send real-time alerts if they are READY
                    return this.notifyScrapper(sid, order, notificationPayload, isReady);
                })
            );

            logger.info(`[Notifications] B2B Insurance dispatch completed for Order ${order._id}`);
        } catch (error) {
            logger.error(`[Notifications] B2B dispatch failed:`, error);
        }
    }

    /**
     * Notify a single scrapper via Socket.io and FCM
     * @param {String} scrapperId - Scrapper ID
     * @param {Object} order - Order object
     * @param {Object} notificationPayload - FCM notification payload
     * @returns {Promise<void>}
     */
    async notifyScrapper(scrapperId, order, notificationPayload, sendRealTime = true) {
        try {
            const targetId = scrapperId.toString();

            // 1. ALWAYS Save Notification to Database (Mailbox Insurance)
            await Notification.create({
                recipient: targetId,
                recipientModel: 'Scrapper',
                type: 'new_order',
                title: notificationPayload?.title || 'New Pickup Request',
                message: notificationPayload?.body || 'New request received',
                data: {
                    ...(notificationPayload?.data || { orderId: order._id?.toString() }),
                    userName: order.user?.name || notificationPayload?.data?.userName || 'Customer',
                    city: order.pickupAddress?.city || '',
                    addressPreview: [order.pickupAddress?.street, order.pickupAddress?.city].filter(Boolean).join(', ')
                }
            });

            // 2. Conditional Socket Event (Doorbell Alert)
            if (sendRealTime) {
                notifyUser(targetId, 'new_order_request', {
                    orderId: order._id.toString(),
                    userName: order.user?.name || notificationPayload?.data?.userName || 'Customer',
                    pickupAddress: order.pickupAddress,
                    orderType: 'new_order',
                    message: notificationPayload?.body || 'New direct request received',
                    receivedAt: new Date().toISOString(),
                    city: order.pickupAddress?.city || '',
                    addressPreview: [order.pickupAddress?.street, order.pickupAddress?.city]
                        .filter(Boolean).join(', ')
                });

                // 3. Conditional Push Notification
                if (notificationPayload) {
                    await sendNotificationToUser(targetId, notificationPayload, 'scrapper');
                }
            }
        } catch (error) {
            logger.error(`[Notifications] Scrapper dispatch failed for ${scrapperId}:`, error);
        }
    }

    /**
     * Notify a user about order updates
     * @param {String} userId - Recipient ID
     * @param {String} event - Event type
     * @param {Object} data - Event data
     * @param {Object} pushPayload - Optional FCM payload
     * @param {String} recipientModel - 'User' or 'Scrapper'
     * @returns {Promise<void>}
     */
    async notifyUser(userId, event, data, pushPayload = null, recipientModel = 'User') {
        try {
            // Socket notification
            notifyUser(userId, event, data);

            // Save to DB for the Bell Icon if it's a push payload
            if (pushPayload) {
                await Notification.create({
                    recipient: userId,
                    recipientModel: recipientModel,
                    type: 'system',
                    title: pushPayload.title || 'Notification',
                    message: pushPayload.body || JSON.stringify(data),
                    data: pushPayload.data || data || {}
                });
            }

            // Push notification if payload provided
            if (pushPayload) {
                await sendNotificationToUser(userId, pushPayload, recipientModel.toLowerCase());
            }
        } catch (error) {
            logger.error(`Failed to notify user ${userId}:`, error);
        }
    }

    /**
     * Send batch notifications to multiple users
     * @param {Array} userIds - Array of user IDs
     * @param {String} event - Event type
     * @param {Object} data - Event data
     * @param {Object} pushPayload - Optional FCM payload
     * @returns {Promise<void>}
     */
    async notifyBatch(userIds, event, data, pushPayload = null) {
        try {
            await Promise.allSettled(
                userIds.map(userId => this.notifyUser(userId, event, data, pushPayload))
            );
            logger.info(`Batch notification sent to ${userIds.length} users`);
        } catch (error) {
            logger.error('Batch notification failed:', error);
        }
    }

    /**
     * Notify about order status change
     * @param {Object} order - Order object
     * @param {String} newStatus - New order status
     * @returns {Promise<void>}
     */
    async notifyOrderStatusChange(order, newStatus) {
        try {
            const statusMessages = {
                confirmed: 'Your order has been accepted by a scrapper!',
                in_progress: 'Scrapper is on the way to pickup.',
                completed: order.isDonation ? 'Dhanyawad! 🎁 Your Donation is successful' : 'Your order has been completed successfully!',
                cancelled: 'Your order has been cancelled.'
            };

            const pushMessages = {
                completed: order.isDonation 
                    ? 'Aapka daan kiya gaya scrap scrapper ne pickup kar liya hai. Anek dhanyawad!'
                    : 'Your order has been completed successfully!',
            };

            const message = statusMessages[newStatus] || 'Order status updated';
            const pushBody = (newStatus === 'completed' && pushMessages[newStatus]) || message;

            await this.notifyUser(
                order.user._id ? order.user._id.toString() : order.user.toString(),
                'order_status_update',
                {
                    orderId: order._id,
                    status: newStatus,
                    message
                },
                {
                    title: order.isDonation && newStatus === 'completed' ? 'Donation Success 🎁' : 'Order Update',
                    body: pushBody,
                    data: {
                        orderId: order._id.toString(),
                        type: 'order_status_update',
                        status: newStatus,
                        isDonation: order.isDonation ? 'true' : 'false'
                    }
                },
                order.userModel || 'User'
            );
        } catch (error) {
            logger.error('Failed to notify order status change:', error);
        }
    }
    /**
     * Notify scrapper about subscription expiry warning
     * @param {String} scrapperId - Scrapper ID
     * @param {Number} daysLeft - Days remaining before expiry
     * @returns {Promise<void>}
     */
    async notifySubscriptionExpiry(scrapperId, daysLeft) {
        try {
            let title, body;
            if (daysLeft <= 1) {
                title = '\uD83D\uDEA8 Subscription Kal Expire Hogi!';
                body = 'Teri subscription kal expire ho jaayegi. Abhi renew karo warna orders band ho jaayenge!';
            } else {
                title = `\u23F0 Subscription ${daysLeft} Din Mein Expire Hogi`;
                body = `Teri subscription ${daysLeft} din mein expire hogi. Samay par renew karo!`;
            }

            await sendNotificationToUser(scrapperId, {
                title,
                body,
                data: {
                    type: 'subscription_expiry_warning',
                    scrapperId: scrapperId.toString(),
                    daysLeft: daysLeft.toString()
                }
            }, 'scrapper');

            logger.info(`[Notification-10] Subscription expiry warning sent to scrapper ${scrapperId} (${daysLeft} days left)`);
        } catch (error) {
            logger.error(`Failed to send subscription expiry warning to scrapper ${scrapperId}:`, error);
        }
    }

    /**
     * Clear unread notifications (e.g. New Pickup Request) for a specific order
     * @param {String} orderId - Order ID
     * @returns {Promise<void>}
     */
    async clearOrderNotifications(orderId) {
        try {
            await Notification.updateMany(
                { 
                    'data.orderId': orderId.toString(), 
                    type: { $in: ['new_order', 'new_order_request', 'donation_order'] },
                    isRead: false 
                },
                { $set: { isRead: true } }
            );
            logger.info(`[Notifications] Cleared pending bell notifications for Order ${orderId}`);
        } catch (error) {
            logger.error(`[Notifications] Failed to clear order notifications for ${orderId}:`, error);
        }
    }
}

export default new NotificationService();
