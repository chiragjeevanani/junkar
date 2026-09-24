import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAvailableOrders,
  getMyAssignedOrders,
  getMyForwardedOrders,
  getOrderById,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  cancelOrder,
  updateOrder,
  forwardToBigScrapper,
  getTargetedOrders,
  getMySentRequests
} from '../controllers/orderController.js';
import { reportFakeLead } from '../controllers/fakeLeadReportController.js';
import { protect, isUser, isScrapper } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createOrderValidator,
  updateOrderStatusValidator,
  cancelOrderValidator,
  updateOrderValidator
} from '../validators/orderValidator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Scrapper routes (Specific paths first)
router.get('/available', isScrapper, getAvailableOrders);
router.get('/my-assigned', isScrapper, getMyAssignedOrders);
router.get('/my-forwarded', isScrapper, getMyForwardedOrders);
router.get('/targeted', isScrapper, getTargetedOrders);
router.get('/my-sent-requests', isScrapper, getMySentRequests);

// User routes & Generic ID routes
// User routes & Generic ID routes
// Allow Scrappers to create orders too (role check inside controller)
router.post('/', protect, createOrderValidator, validate, createOrder);
router.get('/my-orders', isUser, getMyOrders);

// Generic ID routes (Must be after specific paths)
router.get('/:id', getOrderById);
router.put('/:id', isUser, updateOrderValidator, validate, updateOrder);
router.put('/:id/status', updateOrderStatusValidator, validate, updateOrderStatus);
router.post('/:id/cancel', cancelOrderValidator, validate, cancelOrder);
router.post('/:id/accept', isScrapper, acceptOrder);
router.post('/:id/reject', isScrapper, rejectOrder);
router.post('/:id/forward', isScrapper, forwardToBigScrapper);
router.post('/:id/report-fake-lead', isScrapper, reportFakeLead);

export default router;

