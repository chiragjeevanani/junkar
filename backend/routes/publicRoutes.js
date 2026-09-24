import express from 'express';
import { getPublicPrices, getScrapperCategories } from '../controllers/publicController.js';
import { getHomepageReviews } from '../controllers/reviewController.js';

const router = express.Router();

// Public routes (no auth middleware)
router.get('/prices', getPublicPrices);
router.get('/scrapper-categories', getScrapperCategories);
router.get('/homepage-reviews', getHomepageReviews);
router.get('/referral-config', (req, res, next) => {
    import('../controllers/publicController.js').then(m => m.getPublicReferralConfig(req, res, next));
});

export default router;
