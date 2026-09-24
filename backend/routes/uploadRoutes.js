import express from 'express';
import { protect, isUser, isScrapper, isAdmin } from '../middleware/auth.js';
import { uploadMultiple, uploadFields, uploadSingle } from '../services/uploadService.js';
import { uploadOrderImages, uploadKycDocs, uploadCategoryImage } from '../controllers/uploadController.js';

const router = express.Router();

// Order images (user and scrapper)
router.post(
  '/order-images',
  protect,
  uploadMultiple('images', 5),
  uploadOrderImages
);

// KYC documents (scrapper)
router.post(
  '/kyc-docs',
  protect,
  isScrapper,
  uploadFields([
    { name: 'aadhaar', maxCount: 2 },
    { name: 'selfie', maxCount: 1 },
    { name: 'license', maxCount: 2 },
  ]),
  uploadKycDocs
);

// Category images (admin)
router.post(
  '/category-image',
  protect,
  isAdmin,
  uploadSingle('image'),
  uploadCategoryImage
);

export default router;


