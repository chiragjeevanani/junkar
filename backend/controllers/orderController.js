import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import Scrapper from '../models/Scrapper.js';
import User from '../models/User.js';
import { ORDER_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import orderService from '../services/orderService.js';
import walletService from '../services/walletService.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Analytics from '../models/Analytics.js';
import { PAYMENT_STATUS } from '../config/constants.js';
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js';
import notificationService from '../services/notificationService.js';
import { notifyUser } from '../services/socketService.js';


// Normalize scrapper deal categories so they align with scrapItems.category values
const normalizeDealCategories = (rawCategories) => {
  if (!Array.isArray(rawCategories)) return [];

  const normalized = new Set();

  rawCategories.forEach((cat) => {
    if (!cat) return;
    const value = String(cat).toLowerCase().trim();

    switch (value) {
      case 'paper':
      case 'raddi':
      case 'paper / raddi':
        normalized.add('paper');
        break;

      case 'plastic':
        normalized.add('plastic');
        break;

      case 'metal':
        normalized.add('metal');
        break;

      case 'electronics':
      case 'electronic':
      case 'e-waste':
      case 'e_waste':
        normalized.add('electronic');
        normalized.add('e_waste');
        break;

      case 'others':
      case 'furniture':
      case 'furniture / others':
      case 'vehicle scrap':
      case 'vehicle_scrap':
      case 'home appliance':
      case 'home_appliance':
        normalized.add('furniture');
        normalized.add('vehicle_scrap');
        normalized.add('home_appliance');
        break;

      default:
        normalized.add(value);
    }
  });

  return Array.from(normalized);
};

// Order State Machine - Valid Status Transitions
const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.ON_WAY, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ON_WAY]: [ORDER_STATUS.ARRIVED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ARRIVED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: []  // Terminal state
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user.id);
  sendSuccess(res, 'Order created successfully', { order }, 201);
});

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private (User)
export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .populate('scrapper', 'name phone email vehicleInfo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  sendSuccess(res, 'Orders retrieved successfully', {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});


// @desc    Get available orders for scrappers
// @route   GET /api/orders/available
// @access  Private (Scrapper)
export const getAvailableOrders = asyncHandler(async (req, res) => {
  // Get orders that are:
  // 1. Unassigned
  // 2. Status is pending
  // 3. Not already assigned to this scrapper
  // 4. Matches scrapper's service types
  const scrapperId = req.user.id;

  // Fetch scrapper profile to check services
  const scrapper = await Scrapper.findById(scrapperId);
  if (!scrapper) {
    return sendError(res, 'Scrapper profile not found', 404);
  }

  const services = scrapper.services || ['scrap_pickup']; // Default to scrap only if not set
  const allowedOrderTypes = [];

  if (services.includes('scrap_pickup')) {
    allowedOrderTypes.push(null, undefined, 'scrap_pickup', 'scrap', 'scrap_sell');
  }

  const { lat, lng } = req.query;
  const RADIUS_KM = 20; // 20KM Radius logically set for Feriwala moving around
  
  // 1. Definition for Public (Unassigned) Orders
  // Must match distance, scrapper type (Big/Small), and categories
  const publicMatch = {
    status: ORDER_STATUS.PENDING,
    assignmentStatus: 'unassigned',
    scrapper: { $ne: scrapperId },
    orderType: { $in: allowedOrderTypes }, // Only show what this scrapper covers
    rejectedBy: { $nin: [scrapperId] }     // KEY FIX: Never show orders this scrapper rejected
  };

  // Smart Location Fallback Logic
  let filterLat = lat ? parseFloat(lat) : null;
  let filterLng = lng ? parseFloat(lng) : null;

  // PERSISTENCE FIX: Update scrapper's live location in DB whenever they provide it.
  // This ensures OrderService.createOrder (User side) can find them via geo-query.
  // We use findByIdAndUpdate with $set to avoid triggering middleware unnecessarily.
  if (filterLat && filterLng && filterLat !== 0 && filterLng !== 0) {
    Scrapper.findByIdAndUpdate(scrapperId, {
      $set: {
        'liveLocation.type': 'Point',
        'liveLocation.coordinates': [filterLng, filterLat],
        'liveLocation.updatedAt': new Date()
      }
    }).catch(err => logger.error(`[LocationSync] Failed to update scrapper ${scrapperId}:`, err));
  }

  if (!filterLat || !filterLng || filterLat === 0 || filterLng === 0) {
    // Fallback to scrapper's live location from DB
    if (scrapper.liveLocation?.coordinates && scrapper.liveLocation.coordinates[0] !== 0) {
      filterLng = scrapper.liveLocation.coordinates[0]; // GeoJSON is [lng, lat]
      filterLat = scrapper.liveLocation.coordinates[1];
    } else if (scrapper.businessLocation?.coordinates && scrapper.businessLocation.coordinates[0] !== 0) {
      // Fallback to scrapper's business location
      filterLng = scrapper.businessLocation.coordinates[0];
      filterLat = scrapper.businessLocation.coordinates[1];
    }
  }

  // Add Distance Filter for Public Orders
  if (filterLat && filterLng && filterLat !== 0 && filterLng !== 0) {
    publicMatch.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [filterLng, filterLat] // [lng, lat]
        },
        $maxDistance: RADIUS_KM * 1000 // In meters
      }
    };
  } else {
    // If no valid location can be determined, return no public orders to avoid out-of-state spam
    publicMatch._id = null;
  }

  // Add Scrapper Type Filter - ALL online scrappers can now see small and large orders
  const isBigType = ['big', 'wholesaler', 'dukandaar'].includes(scrapper.scrapperType);
  if (!isBigType) {
    // Only exception: Small scrappers shouldn't see B2B forwarded orders
    publicMatch.forwardedBy = null;
  }

  // Add Category Filter for Public Orders
  if (scrapper.dealCategories && scrapper.dealCategories.length > 0) {
    const normalizedCategories = normalizeDealCategories(scrapper.dealCategories);
    if (normalizedCategories.length > 0) {
      publicMatch['scrapItems.category'] = { $in: normalizedCategories };
    }
  }

  // 2. Definition for Targeted (B2B) Orders
  // These show regardless of distance/type/category since they were custom selected by the sender
  // We use mongoose.Types.ObjectId to ensure exact match with the database array
  const targetedMatch = {
    status: ORDER_STATUS.PENDING,
    $or: [
      { targetedScrappers: scrapperId },
      { targetedScrappers: new mongoose.Types.ObjectId(scrapperId) }
    ],
    scrapper: { $ne: scrapperId },
    rejectedBy: { $nin: [scrapperId] }  // KEY FIX: Never show rejected B2B orders again
  };

  // 3. Best Approach: Fetch both sets separately and merge to handle specific requirements.
  const [publicOrders, targetedOrders] = await Promise.all([
    Order.find(publicMatch).populate('user', 'name phone profilePic').limit(15),
    Order.find(targetedMatch).populate('user', 'name phone profilePic').limit(10)
  ]);

  // Merge and sort by creation time (newest first)
  let ordersList = [...publicOrders, ...targetedOrders].sort((a, b) => b.createdAt - a.createdAt);

  // Helper for Distance calculation
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    let d = R * c; 
    return Number(d.toFixed(1));
  };

  const scrapperLat = filterLat;
  const scrapperLng = filterLng;

  // Map to basic JS objects and add distanceText
  ordersList = ordersList.map(orderDoc => {
    const orderObj = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
    let distanceText = null;

    if (scrapperLat && scrapperLng && orderObj.pickupAddress?.coordinates) {
        const orderLat = orderObj.pickupAddress.coordinates.lat || orderObj.pickupAddress.coordinates.coordinates?.[1];
        const orderLng = orderObj.pickupAddress.coordinates.lng || orderObj.pickupAddress.coordinates.coordinates?.[0];
        
        const distKm = getDistanceFromLatLonInKm(scrapperLat, scrapperLng, orderLat, orderLng);
        if (distKm !== null) {
          distanceText = distKm < 1 ? 'Less than 1 km' : `${distKm} km`;
        }
    }
    // Backward compatibility for location
    if (!distanceText && scrapperLat && scrapperLng && orderObj.location?.coordinates) {
        const orderLat = orderObj.location.coordinates[1];
        const orderLng = orderObj.location.coordinates[0];
        const distKm = getDistanceFromLatLonInKm(scrapperLat, scrapperLng, orderLat, orderLng);
        if (distKm !== null) {
          distanceText = distKm < 1 ? 'Less than 1 km' : `${distKm} km`;
        }
    }

    orderObj.distanceText = distanceText;
    return orderObj;
  });

  sendSuccess(res, 'Available orders retrieved successfully', { orders: ordersList });
});

// @desc    Permanently reject an order for this scrapper (DB-level, won't come back)
// @route   POST /api/orders/:id/reject
// @access  Private (Scrapper)
export const rejectOrder = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const { id: orderId } = req.params;

  const result = await orderService.rejectOrder(orderId, scrapperId);
  sendSuccess(res, 'Order rejected successfully', result);
});

// @desc    Get sent B2B requests for a scrapper
// @route   GET /api/v1/orders/my-sent-requests
// @access  Private (Scrapper)
export const getMySentRequests = asyncHandler(async (req, res) => {
    const scrapperId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: scrapperId };
    if (status) {
        query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
        .populate('scrapper', 'name phone profilePic vehicleInfo')
        .populate('targetedScrappers', 'name phone profilePic')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    sendSuccess(res, 'Sent requests retrieved successfully', {
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// @desc    Get scrapper's assigned orders
// @route   GET /api/orders/my-assigned
// @access  Private (Scrapper)
export const getMyAssignedOrders = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const { status } = req.query;

  const query = { scrapper: scrapperId };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'name phone email')
    .populate('scrapper', 'name phone')
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Assigned orders retrieved successfully', { orders });
});

// @desc    Get scrapper's forwarded orders (sent to big scrappers)
// @route   GET /api/orders/my-forwarded
// @access  Private (Scrapper)
export const getMyForwardedOrders = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id;
  const { status } = req.query;

  const query = { forwardedBy: scrapperId };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'name phone email')
    .populate('scrapper', 'name phone') // Big scrapper who accepted it
    .populate('forwardedBy', 'name phone') // Small scrapper (self)
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Forwarded orders retrieved successfully', { orders });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const scrapperId = req.user.scrapperId || req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(id)
    .populate('user', 'name phone email')
    .populate('scrapper', 'name phone liveLocation businessLocation');

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Check access: User can only see their orders, Scrapper can see assigned orders
  if (userRole === 'user' && order.user._id.toString() !== userId) {
    return sendError(res, 'Not authorized to access this order', 403);
  }

  if (userRole === 'scrapper') {
    const isOrderCreator = order.user && order.user._id.toString() === userId;
    const isAssignedScrapper = order.scrapper && order.scrapper._id.toString() === scrapperId;
    
    if (order.scrapper && !isOrderCreator && !isAssignedScrapper) {
      return sendError(res, 'Not authorized to access this order', 403);
    }
  }

  sendSuccess(res, 'Order retrieved successfully', { order });
});

// @desc    Accept order (Scrapper)
// @route   POST /api/orders/:id/accept
// @access  Private (Scrapper)
export const acceptOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scrapperId = req.user.scrapperId || req.user.id;

  try {
    const order = await orderService.acceptOrder(id, scrapperId);
    
    // Unread requests in bell icon should clear immediately after accepting
    notificationService.clearOrderNotifications(id).catch(err => logger.error(err));

    sendSuccess(res, 'Order accepted successfully', { order });
  } catch (error) {
    if (error.message === 'Order not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes('Insufficient wallet balance')) {
      return sendError(res, error.message, 403);
    }
    return sendError(res, error.message, 400);
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Authorization checks
  if (userRole === 'user' && order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to update this order', 403);
  }

  if (userRole === 'scrapper' && order.scrapper && order.scrapper.toString() !== userId) {
    return sendError(res, 'Not authorized to update this order', 403);
  }

  // Validate status transition using State Machine
  const currentStatus = order.status;
  
  // Terminal State Protection: If order is already completed or cancelled, don't allow ANY updates
  if (currentStatus === ORDER_STATUS.COMPLETED || currentStatus === ORDER_STATUS.CANCELLED) {
    return sendError(res, `Order is already in a terminal state (${currentStatus}) and cannot be updated.`, 400);
  }

  if (status !== currentStatus) {
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(status)) {
      return sendError(res, `Invalid status transition: ${currentStatus} -> ${status}`, 400);
    }
  }

  // Update negotiation fields and total amount
  const { isNegotiated, finalPrice, dealType, totalAmount } = req.body;

  if (isNegotiated !== undefined) order.isNegotiated = isNegotiated;
  if (finalPrice !== undefined) order.finalPrice = Number(finalPrice);
  if (dealType !== undefined) order.dealType = dealType;

  // Use finalPrice if negotiated, else use totalAmount, else keep current
  const finalTotalAmount = finalPrice || totalAmount || order.totalAmount;
  order.totalAmount = Number(finalTotalAmount);

  // Update status
  order.status = status;

  // Update paymentStatus if provided
  const { paymentStatus } = req.body;
  if (paymentStatus) {
    const validPaymentStatuses = Object.values(PAYMENT_STATUS);
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return sendError(res, 'Invalid payment status', 400);
    }
    order.paymentStatus = paymentStatus;
  }

  // Set completion date if completed
  if (status === ORDER_STATUS.COMPLETED) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const lockedOrder = await Order.findById(id).session(session);
        if (!lockedOrder || lockedOrder.status === ORDER_STATUS.COMPLETED) {
          throw new Error('Order is already completed or not found');
        }

        // Use lockedOrder from now on
        if (isNegotiated !== undefined) lockedOrder.isNegotiated = isNegotiated;
        if (finalPrice !== undefined) lockedOrder.finalPrice = Number(finalPrice);
        if (dealType !== undefined) lockedOrder.dealType = dealType;
        lockedOrder.totalAmount = Number(finalTotalAmount);
        lockedOrder.status = status;
        lockedOrder.completedDate = new Date();
        if (paymentStatus) lockedOrder.paymentStatus = paymentStatus;

        if (lockedOrder.scrapper) {
          const scrapper = await Scrapper.findById(lockedOrder.scrapper).session(session);
          if (!scrapper) throw new Error('Scrapper not found');

          const orderAmount = lockedOrder.totalAmount || 0;
          const isDonation = lockedOrder.isDonation || false;

          // Decide what to deduct based on dealType
          let totalDeduction = 0;
          if (lockedOrder.dealType === 'Online') {
            totalDeduction = orderAmount;
          }

          // SECURITY CHECK: Verify scrapper has enough balance
          if (scrapper.wallet.balance < totalDeduction) {
            throw new Error(`Insufficient wallet balance. Required: ₹${totalDeduction}, Available: ₹${scrapper.wallet.balance}`);
          }

          // 2. Deduct Order Amount (Only if Online)
          if (lockedOrder.dealType === 'Online' && orderAmount > 0) {
            scrapper.wallet.balance -= orderAmount;
            await scrapper.save({ session });

            await WalletTransaction.create([{
              trxId: `TRX-PAY-${Date.now()}-${lockedOrder._id.toString().slice(-4)}`,
              user: scrapper._id,
              userType: 'Scrapper',
              amount: orderAmount,
              type: 'DEBIT',
              balanceBefore: scrapper.wallet.balance + orderAmount,
              balanceAfter: scrapper.wallet.balance,
              category: 'PAYMENT_SENT',
              status: 'SUCCESS',
              description: `Payment for Order #${lockedOrder._id} (Negotiated: ${lockedOrder.isNegotiated})`,
              orderId: lockedOrder._id,
              gateway: { provider: 'WALLET' }
            }], { session });

            // 3. Credit User Wallet
            const user = await User.findById(lockedOrder.user).session(session);
            if (user) {
              const uBalanceBefore = user.wallet.balance;
              user.wallet.balance += orderAmount;
              await user.save({ session });

              await WalletTransaction.create([{
                trxId: `TRX-REC-${Date.now()}-${lockedOrder._id.toString().slice(-4)}`,
                user: user._id,
                userType: 'User',
                amount: orderAmount,
                type: 'CREDIT',
                balanceBefore: uBalanceBefore,
                balanceAfter: user.wallet.balance,
                category: 'PAYMENT_RECEIVED',
                status: 'SUCCESS',
                description: `Payment received for Scrap Order #${lockedOrder._id}`,
                orderId: lockedOrder._id,
                gateway: { provider: 'WALLET' }
              }], { session });

              // Notify user via socket for real-time wallet update
              notifyUser(user._id.toString(), 'wallet_updated', {
                balance: user.wallet.balance,
                amount: orderAmount,
                type: 'CREDIT'
              });
            }

            order.paymentStatus = PAYMENT_STATUS.COMPLETED;
          } else if (isDonation || orderAmount === 0) {
            // FIX: Handle donations and zero-amount orders explicitly
            order.paymentStatus = PAYMENT_STATUS.COMPLETED;
          }

          logger.info(`[Order Completion] Status set to COMPLETED for Order ${lockedOrder._id} (Donation: ${isDonation})`);
        }

        // Save order state
        await lockedOrder.save({ session });

        // Record Analytics Event
        await Analytics.create([{
          event: 'ORDER_COMPLETED',
          category: 'ORDER',
          metadata: {
            orderId: lockedOrder._id,
            totalAmount: lockedOrder.totalAmount,
            isNegotiated: lockedOrder.isNegotiated,
            dealType: lockedOrder.dealType,
            scrapperId: lockedOrder.scrapper
          }
        }], { session });

        // Sync local order object for response
        Object.assign(order, lockedOrder.toObject());
      });
    } catch (transactionError) {
      logger.error(`[Order Completion] Transaction failed:`, transactionError);
      return sendError(res, transactionError.message, 400);
    } finally {
      session.endSession();
    }
  } else {
    // Non-completion updates (standard save)
    await order.save();

    // Record Status Change Analytics
    if (status !== currentStatus) {
      await Analytics.create({
        event: 'ORDER_STATUS_CHANGED',
        category: 'ORDER',
        metadata: {
          orderId: order._id,
          from: currentStatus,
          to: status
        }
      });
    }

    // NEW Tracking stage notifications for user
    if (status === ORDER_STATUS.ON_WAY && order.user) {
      const safeUserId = order.user._id ? order.user._id.toString() : order.user.toString();
      sendNotificationToUser(safeUserId, {
        title: '🚚 Scrapper is on the Way!',
        body: `Scrapper has started their journey to your location. Aap unhe track kar sakte hain.`,
        data: { type: 'order_update', orderId: order._id, status: 'on_way' }
      }, order.userModel?.toLowerCase() || 'user').catch(err => logger.error('[Notification] on_way notification failed:', err));
    }

    if (status === ORDER_STATUS.ARRIVED && order.user) {
      const safeUserId = order.user._id ? order.user._id.toString() : order.user.toString();
      sendNotificationToUser(safeUserId, {
        title: '📍 Scrapper has Arrived!',
        body: `Scrapper aapki location par pahunch gaya hai.`,
        data: { type: 'order_update', orderId: order._id, status: 'arrived' }
      }, order.userModel?.toLowerCase() || 'user').catch(err => logger.error('[Notification] arrived notification failed:', err));
    }

    // Send Completion Notification
    if (status === ORDER_STATUS.COMPLETED && order.user) {
      const safeUserId = order.user._id ? order.user._id.toString() : order.user.toString();
      if (order.isDonation) {
        sendNotificationToUser(safeUserId, {
          title: '💚 Thank you for donating!',
          body: `Aapka donation request successful raha. Thank you for donating and ${order.scrapper?.name || 'our partner'} for pick-up.`,
          data: { type: 'order_completed', orderId: order._id }
        }, order.userModel?.toLowerCase() || 'user').catch(err => logger.error('[Notification] Donation completion notification failed:', err));
      } else {
        sendNotificationToUser(safeUserId, {
          title: '✅ Order Successful',
          body: `Aapka order REQ-${order._id.toString().slice(-6)} successfully complete ho gaya hai.`,
          data: { type: 'order_completed', orderId: order._id }
        }, order.userModel?.toLowerCase() || 'user').catch(err => logger.error('[Notification] Order completion notification failed:', err));
      }
    }
  }

  await order.populate('user', 'name phone');
  await order.populate('scrapper', 'name phone');

  // TRIGGER SOCKET UPDATE for both parties to see real-time status change
  import('../services/socketService.js').then(({ notifyUser, getIO }) => {
    try {
      const io = getIO();
      const orderIdStr = order._id.toString();

      // Emit to shared tracking room (this is the most reliable way)
      io.to(`tracking_${orderIdStr}`).emit('order_status_update', { orderId: orderIdStr, status });

      // Also notify individual users as a secondary channel
      if (order.user) notifyUser(order.user._id.toString(), 'order_status_update', { orderId: orderIdStr, status });
      if (order.scrapper) notifyUser(order.scrapper._id.toString(), 'order_status_update', { orderId: orderIdStr, status });
    } catch (err) {
      logger.error('[Socket] Status update emission failed:', err);
    }
  }).catch(err => logger.error('[Socket] Dynamic import failed:', err));

  logger.info(`Order ${id} status updated to ${status} (Payment: ${order.paymentStatus}) by ${userRole} ${userId}`);

  sendSuccess(res, 'Order status updated successfully', { order });
});

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Authorization: User can cancel their orders, Scrapper can cancel assigned orders
  if (userRole === 'user' && order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to cancel this order', 403);
  }

  if (userRole === 'scrapper' && order.scrapper && order.scrapper.toString() !== userId) {
    return sendError(res, 'Not authorized to cancel this order', 403);
  }

  // Check if order can be cancelled
  if (order.status === ORDER_STATUS.COMPLETED) {
    return res.status(400).json({
      success: false,
      message: 'Completed orders cannot be cancelled'
    });
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    return res.status(400).json({
      success: false,
      message: 'Order is already cancelled'
    });
  }

  if (order.status === ORDER_STATUS.COMPLETED) {
    return res.status(400).json({
      success: false,
      message: 'Completed orders cannot be cancelled'
    });
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancelledAt = new Date();
  order.cancellationReason = reason || 'Cancelled by scrapper';
  order.assignmentStatus = 'unassigned';
  order.scrapper = null;
  if (reason) {
    order.notes = `${order.notes}\nCancellation reason: ${reason}`.trim();
  }

  await order.save();

  // Clear unread bell notifications for this order
  notificationService.clearOrderNotifications(id).catch(err => logger.error(err));

  logger.info(`Order ${id} cancelled by ${userRole} ${userId}`);

  // [NOTIFICATION-3] Order cancel -> Dono parties ko notification (non-blocking)
  const cancelBody = reason ? `Reason: ${reason}` : 'Order cancel ho gaya.';
  // User ko notify karo agar scrapper ne cancel kiya
  if (userRole === 'scrapper' && order.user) {
    sendNotificationToUser(order.user.toString(), {
      title: '❌ Order Cancel Ho Gaya',
      body: `Aapka order scrapper ne cancel kar diya. ${cancelBody}`,
      data: { type: 'order_cancelled', orderId: id }
    }, 'user').catch(err => logger.error('[Notification] Cancel->User notification failed:', err));
  }
  // Scrapper ko notify karo agar user ne cancel kiya
  if (userRole === 'user' && order.scrapper) {
    const scrapperId = order.scrapper.toString();
    sendNotificationToUser(scrapperId, {
      title: '❌ Order Cancel Ho Gaya',
      body: `User ne order cancel kar diya. ${cancelBody}`,
      data: { type: 'order_cancelled', orderId: id }
    }, 'scrapper').catch(err => logger.error('[Notification] Cancel->Scrapper notification failed:', err));
  }

  sendSuccess(res, 'Order cancelled successfully', { order });
});

// @desc    Update order (User can update pending orders)
// @route   PUT /api/orders/:id
// @access  Private (User)
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { scrapItems, pickupAddress, preferredTime, pickupSlot, images, notes } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // Only user can update their own orders
  if (order.user.toString() !== userId) {
    return sendError(res, 'Not authorized to update this order', 403);
  }

  // Can only update pending orders
  if (order.status !== ORDER_STATUS.PENDING) {
    return sendError(res, 'Can only update pending orders', 400);
  }

  // Update fields
  if (scrapItems) {
    order.scrapItems = scrapItems;
    // Recalculate totals
    let totalWeight = 0;
    let totalAmount = 0;
    scrapItems.forEach(item => {
      totalWeight += item.weight || 0;
      totalAmount += item.total || 0;
    });
    order.totalWeight = totalWeight;
    order.totalAmount = totalAmount;
  }

  if (pickupAddress) order.pickupAddress = pickupAddress;
  if (preferredTime) order.preferredTime = preferredTime;
  if (pickupSlot) order.pickupSlot = pickupSlot;
  if (images) order.images = images;
  if (notes !== undefined) order.notes = notes;

  await order.save();

  await order.populate('user', 'name phone');
  await order.populate('scrapper', 'name phone');

  logger.info(`Order ${id} updated by user ${userId}`);
  sendSuccess(res, 'Order updated successfully', { order });
});

// @desc    Forward order to Big Scrapper
// @route   POST /api/orders/:id/forward
// @access  Private (Scrapper - Small)
export const forwardToBigScrapper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const scrapperId = req.user.scrapperId || req.user.id; // Scrapper making the request

  const order = await Order.findById(id);

  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  // 1. Verify Ownership: Order must be currently assigned to THIS scrapper
  if (!order.scrapper || order.scrapper.toString() !== scrapperId) {
    return sendError(res, 'You can only forward orders assigned to you.', 403);
  }

  // 2. Verify Status: Can only forward if not already completed/cancelled
  if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
    return sendError(res, 'Cannot forward completed or cancelled orders.', 400);
  }

  // 3. Update Order to make it visible to Big Scrappers
  // - Set quantityType to 'large' (Big scrappers see 'large')
  // - Set forwardedBy to current scrapper
  // - Unassign current scrapper -> scrapper = null
  // - Reset status to PENDING -> So it appears in "Available Orders"

  order.quantityType = 'large';
  order.forwardedBy = scrapperId;
  order.scrapper = null;
  order.assignmentStatus = 'unassigned'; // Reset assignment
  order.status = ORDER_STATUS.PENDING;   // Reset status

  // Add Note
  const scrapperName = req.user.name || 'Scrapper';
  order.notes = (order.notes || '') + `\n[System]: Forwarded by ${scrapperName} to Big Scrappers.`;

  await order.save();

  logger.info(`Order ${id} forwarded to Big Scrapper pool by ${scrapperId}`);

  // [NOTIFICATION-7] Forward hone par Big Scrappers ko notification (non-blocking)
  notificationService.notifyBigScrappers(order).catch(err => {
    logger.error('[Notification] Forward->BigScrappers notification failed:', err);
  });

  sendSuccess(res, 'Order forwarded to Big Scrappers successfully', { order });
});

// @desc    Get targeted orders for big scrappers (B2B)
// @route   GET /api/orders/targeted
// @access  Private (Scrapper)
export const getTargetedOrders = asyncHandler(async (req, res) => {
  const scrapperId = req.user.scrapperId || req.user.id;

  const query = {
    status: ORDER_STATUS.PENDING,
    assignmentStatus: 'targeted',
    targetedScrappers: scrapperId
  };

  const orders = await Order.find(query)
    .populate('user', 'name phone')
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Targeted orders retrieved successfully', { orders });
});

