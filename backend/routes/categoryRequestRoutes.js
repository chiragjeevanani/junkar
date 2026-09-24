import express from 'express';
import { protect, isScrapper, isAdmin } from '../middleware/auth.js';
import { 
  createCategoryRequest, 
  getAllCategoryRequests, 
  deleteCategoryRequest 
} from '../controllers/categoryRequestController.js';

const router = express.Router();

// Scrapper route
router.post('/', protect, isScrapper, createCategoryRequest);

// Admin routes
router.get('/admin', protect, isAdmin, getAllCategoryRequests);
router.delete('/admin/:id', protect, isAdmin, deleteCategoryRequest);

export default router;
