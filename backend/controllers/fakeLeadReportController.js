import FakeLeadReport from '../models/FakeLeadReport.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

const REASON_ENUM = ['wrong_item', 'wrong_address', 'not_available', 'customer_not_available', 'other'];

// Scrapper: report an order as fake lead
export const reportFakeLead = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const scrapperId = req.user.id || req.user._id;
  const { reason, notes } = req.body;

  if (!reason || !REASON_ENUM.includes(reason)) {
    return sendError(res, 'Valid reason is required (wrong_item, wrong_address, not_available, customer_not_available, other).', 400);
  }

  const order = await Order.findById(orderId).select('_id scrapper status notes');
  if (!order) return sendError(res, 'Order not found', 404);
  if (order.scrapper?.toString() !== scrapperId.toString()) {
    return sendError(res, 'You can only report orders assigned to you.', 403);
  }

  const existing = await FakeLeadReport.findOne({ order: orderId });
  if (existing) return sendError(res, 'This order has already been reported as fake lead.', 400);

  const report = await FakeLeadReport.create({
    order: orderId,
    scrapper: scrapperId,
    reason,
    notes: (notes && typeof notes === 'string') ? notes.trim() : '',
    status: 'pending'
  });

  // Update order status so it's removed from scrapper's list
  await Order.findByIdAndUpdate(orderId, {
    status: 'cancelled',
    assignmentStatus: 'rejected',
    cancelledAt: new Date(),
    cancellationReason: `Fake Lead: ${reason}`,
    notes: (order.notes || '') + `\n[System]: Order marked as Fake Lead by Scrapper. Reason: ${reason}.`
  });

  logger.info('Fake lead reported', { reportId: report._id, orderId, scrapperId });
  return sendSuccess(res, 'Fake lead reported. Admin will review.', { report }, 201);
});

// Admin: get all reported fake leads
export const getReportedLeads = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (status && ['pending', 'reviewed'].includes(status)) filter.status = status;

  const [reports, total] = await Promise.all([
    FakeLeadReport.find(filter)
      .populate({
        path: 'order',
        select: 'user pickupAddress scrapItems totalAmount status orderType',
        populate: { path: 'user', select: 'name phone' }
      })
      .populate('scrapper', 'name phone scrapperType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    FakeLeadReport.countDocuments(filter)
  ]);

  return sendSuccess(res, 'Reported leads retrieved', {
    reports,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  });
});

// Admin: mark report as reviewed (optional - so admin can close the ticket)
export const markReportReviewed = asyncHandler(async (req, res) => {
  const reportId = req.params.id;
  const report = await FakeLeadReport.findById(reportId);
  if (!report) return sendError(res, 'Report not found', 404);
  report.status = 'reviewed';
  report.reviewedBy = req.user.id || req.user._id;
  report.reviewedAt = new Date();
  await report.save();
  return sendSuccess(res, 'Report marked as reviewed', { report });
});
