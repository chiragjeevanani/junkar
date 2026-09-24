import AddressChangeRequest from '../models/AddressChangeRequest.js';
import Scrapper from '../models/Scrapper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

// Scrapper: create address change request (dukandaar/wholesaler only)
export const createRequest = asyncHandler(async (req, res) => {
  const scrapperId = req.user.id || req.user._id;
  const { address, coordinates, city, state } = req.body;

  const scrapper = await Scrapper.findById(scrapperId).select('scrapperType businessLocation');
  if (!scrapper) return sendError(res, 'Scrapper not found', 404);

  const allowedTypes = ['dukandaar', 'wholesaler'];
  if (!allowedTypes.includes(scrapper.scrapperType)) {
    return sendError(res, 'Only shopkeeper/wholesaler can request address change.', 400);
  }

  const reqAddress = (address && typeof address === 'string') ? address.trim() : '';
  const reqCoords = Array.isArray(coordinates) && coordinates.length >= 2
    ? [Number(coordinates[0]), Number(coordinates[1])]
    : [0, 0];
  const reqCity = (city && typeof city === 'string') ? city.trim() : '';
  const reqState = (state && typeof state === 'string') ? state.trim() : '';

  if (!reqAddress) return sendError(res, 'Address is required.', 400);

  const existing = await AddressChangeRequest.findOne({
    scrapper: scrapperId,
    status: 'pending'
  });
  if (existing) {
    return sendError(res, 'You already have a pending address change request.', 400);
  }

  const doc = await AddressChangeRequest.create({
    scrapper: scrapperId,
    requestedAddress: reqAddress,
    requestedCoordinates: reqCoords,
    requestedCity: reqCity,
    requestedState: reqState,
    status: 'pending'
  });

  logger.info('Address change request created', { requestId: doc._id, scrapperId });
  return sendSuccess(res, 'Address change request submitted. Admin will review.', { request: doc }, 201);
});

// Admin: get all address change requests (filter by status)
export const getAllForAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) filter.status = status;

  const [requests, total] = await Promise.all([
    AddressChangeRequest.find(filter)
      .populate('scrapper', 'name phone scrapperType businessLocation')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AddressChangeRequest.countDocuments(filter)
  ]);

  return sendSuccess(res, 'Address change requests retrieved', {
    requests,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  });
});

// Admin: approve request (optionally with edited address/coordinates); updates scrapper businessLocation
export const approveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { address, coordinates } = req.body;
  const adminId = req.user.id || req.user._id;

  const request = await AddressChangeRequest.findById(id).populate('scrapper');
  if (!request) return sendError(res, 'Request not found', 404);
  if (request.status !== 'pending') return sendError(res, 'Request is no longer pending.', 400);

  const finalAddress = (address && typeof address === 'string') ? address.trim() : request.requestedAddress;
  const finalCoords = Array.isArray(coordinates) && coordinates.length >= 2
    ? [Number(coordinates[0]), Number(coordinates[1])]
    : request.requestedCoordinates;
  const finalCity = request.requestedCity || '';
  const finalState = request.requestedState || '';

  const scrapper = await Scrapper.findById(request.scrapper._id);
  if (!scrapper) return sendError(res, 'Scrapper not found', 404);

  scrapper.businessLocation = {
    type: 'Point',
    coordinates: finalCoords,
    address: finalAddress,
    city: finalCity,
    state: finalState
  };
  await scrapper.save();

  request.status = 'approved';
  request.approvedAddress = finalAddress;
  request.approvedCoordinates = finalCoords;
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.rejectionReason = '';
  await request.save();

  logger.info('Address change request approved', { requestId: id, scrapperId: scrapper._id });
  return sendSuccess(res, 'Address updated and request approved.', { request, scrapper: { businessLocation: scrapper.businessLocation } });
});

// Admin: reject request
export const rejectRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id || req.user._id;

  const request = await AddressChangeRequest.findById(id);
  if (!request) return sendError(res, 'Request not found', 404);
  if (request.status !== 'pending') return sendError(res, 'Request is no longer pending.', 400);

  request.status = 'rejected';
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.rejectionReason = (reason && typeof reason === 'string') ? reason.trim() : '';
  await request.save();

  logger.info('Address change request rejected', { requestId: id });
  return sendSuccess(res, 'Request rejected.', { request });
});
