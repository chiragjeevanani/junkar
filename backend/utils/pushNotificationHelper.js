import { sendPushNotification } from '../services/firebaseAdmin.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';

/**
 * Send notification to a specific user or scrapper
 * @param {string} userId - User or Scrapper ID
 * @param {object} payload - { title, body, data }
 * @param {string} role - 'user' or 'scrapper', default 'user'
 * @param {boolean} includeMobile - whether to include mobile tokens
 */
export async function sendNotificationToUser(userId, payload, role = 'user', includeMobile = true) {
    try {
        let user;

        if (role === 'scrapper') {
            user = await Scrapper.findById(userId).select('name fcmTokens fcmTokenMobile');
        } else {
            user = await User.findById(userId).select('name fcmTokens fcmTokenMobile');
        }

        if (!user) {
            console.warn(`[FCM] ${role} with ID ${userId} not found`);
            return;
        }

        // Collect tokens
        let tokens = [];
        if (user.fcmTokens && user.fcmTokens.length > 0) {
            tokens = [...tokens, ...user.fcmTokens];
        }
        if (includeMobile && user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
            tokens = [...tokens, ...user.fcmTokenMobile];
        }

        // Remove duplicates
        const uniqueTokens = [...new Set(tokens)];

        console.log(`[FCM] Sending to ${role} "${user.name}" (${userId}): ${uniqueTokens.length} token(s) | Title: "${payload.title}"`);

        if (uniqueTokens.length === 0) {
            console.warn(`[FCM] No tokens found for ${role} ${userId} — notification skipped`);
            return;
        }

        // Send notification
        await sendPushNotification(uniqueTokens, payload);
        console.log(`[FCM] Push sent successfully to ${role} ${userId}`);
    } catch (error) {
        console.error('[FCM] Error sending notification:', error);
    }
}
