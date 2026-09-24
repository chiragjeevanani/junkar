import Razorpay from 'razorpay';
import logger from '../../../utils/logger.js';

/**
 * Razorpay Service
 * Handles Razorpay client instance management with support for credential re-initialization
 */

class RazorpayService {
  constructor() {
    this.instance = null;
    this.currentKeyId = null;
  }

  /**
   * Get Razorpay client instance
   * Detects .env changes and re-initializes if necessary
   */
  getInstance() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('Razorpay keys are not set in .env');
    }

    // Re-initialize if keys changed or instance not created
    if (!this.instance || this.currentKeyId !== key_id) {
      try {
        logger.info('[RazorpayService] Initializing new Razorpay instance', {
          key_id: key_id.substring(0, 8) + '...'
        });

        this.instance = new Razorpay({
          key_id: key_id.trim(),
          key_secret: key_secret.trim()
        });
        
        this.currentKeyId = key_id;
      } catch (error) {
        logger.error('[RazorpayService] Initialization error:', error);
        throw new Error('Failed to initialize Razorpay client');
      }
    }

    return this.instance;
  }

  /**
   * Manual re-initialization
   */
  reinit() {
    this.instance = null;
    return this.getInstance();
  }
}

// Export a singleton instance
export const razorpayService = new RazorpayService();
export default razorpayService;
