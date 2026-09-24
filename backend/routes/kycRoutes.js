import express from 'express';
import { protect, isScrapper, isAdmin } from '../middleware/auth.js';
import { uploadFields } from '../services/uploadService.js';
import { submitKyc, getMyKyc, verifyKyc, rejectKyc, getAllScrappersWithKyc, requestKycResend } from '../controllers/kycController.js';

const router = express.Router();

// Scrapper: submit and view own KYC
router.post(
  '/',
  protect,
  isScrapper,
  uploadFields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'shopLicense', maxCount: 1 },
    { name: 'shopPhoto', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
  ]),
  submitKyc
);

router.get('/me', protect, isScrapper, getMyKyc);

// Admin actions
router.get('/scrappers', protect, isAdmin, getAllScrappersWithKyc);
router.post('/:id/verify', protect, isAdmin, verifyKyc);
router.post('/:id/reject', protect, isAdmin, rejectKyc);
router.post('/:id/request-resend', protect, isAdmin, requestKycResend);

export default router;
