import express from 'express';
import {
    getMyProfile,
    updateMyProfile,
    getScrapperPublicProfile,
    updateFcmToken,
    getNearbyBigScrappers,
    searchScrappersByCity,
    deleteMyAccount
} from '../controllers/scrapperController.js';
import { createRequest as createAddressChangeRequest } from '../controllers/addressChangeRequestController.js';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Public routes (or authenticated for users)
router.get('/:id/profile', protect, getScrapperPublicProfile);

// Protected routes (Scrapper only)
router.get('/me', protect, authorize(USER_ROLES.SCRAPPER), getMyProfile);
router.put('/me', protect, authorize(USER_ROLES.SCRAPPER), updateMyProfile);
router.delete('/me', protect, authorize(USER_ROLES.SCRAPPER), deleteMyAccount);
router.post('/me/address-change-request', protect, authorize(USER_ROLES.SCRAPPER), createAddressChangeRequest);
router.post('/fcm-token', protect, authorize(USER_ROLES.SCRAPPER), updateFcmToken);

// B2B Discovery
router.get('/nearby-big', protect, authorize(USER_ROLES.SCRAPPER), getNearbyBigScrappers);
router.get('/search-by-city', protect, authorize(USER_ROLES.SCRAPPER), searchScrappersByCity);

export default router;
