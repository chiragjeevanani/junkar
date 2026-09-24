import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import Price from '../models/Price.js';
import logger from '../utils/logger.js';

// @desc    Get all active public prices
// @route   GET /api/public/prices
// @access  Public
export const getPublicPrices = asyncHandler(async (req, res) => {
    try {
        // Only fetch active prices
        // Get distinct categories first to avoid duplicates if multiple regions exist (simplification for now)
        // Or just get all active prices for default region (IN-DL) or all regions if specific query

        const filter = {};
        if (req.query.regionCode) {
            filter.regionCode = req.query.regionCode;
        } else {
            // Default to IN-DL or just show all unique categories?
            // Let's default to 'IN-DL' to be consistent with default creation
            filter.regionCode = 'IN-DL';
        }
        
        // Ensure we only send categories meant for users
        filter.showToUser = { $ne: false };

        const prices = await Price.find(filter)
            .select('category pricePerKg price type regionCode effectiveDate updatedAt image minPrice maxPrice isNegotiable isActive showToUser unit')
            .sort({ category: 1 });

        sendSuccess(res, 'Public prices retrieved successfully', { prices });
    } catch (error) {
        logger.error('[Public] Error fetching prices:', error);
        sendError(res, 'Failed to fetch prices', 500);
    }
});

// @desc    Get dynamic categories for scrappers based on role
// @route   GET /api/public/scrapper-categories
// @access  Public
export const getScrapperCategories = asyncHandler(async (req, res) => {
    try {
        const { role } = req.query;
        const filter = { isActive: true };

        // We only care about base categories, typically 'IN-DL' as default or ignore region completely 
        // if categories are universal
        filter.regionCode = req.query.regionCode || 'IN-DL';

        // Filter by role
        if (role === 'dukandaar') {
            filter.showToDukandaar = true;
        } else if (role === 'wholesaler') {
            filter.showToWholesaler = true;
        } else if (role === 'feri_wala') {
            // Pheriwala sees the union of Dukandaar + Wholesaler categories
            filter.$or = [
                { showToDukandaar: true },
                { showToWholesaler: true }
            ];
        } else {
            // If no recognized role, return empty or default subset
            // We'll return nothing to be safe, or just require a valid role
            return sendSuccess(res, 'Invalid role for scrapper categories', { categories: [] });
        }

        const prices = await Price.find(filter)
            .select('category image minPrice maxPrice isNegotiable') // Only needed fields
            .sort({ category: 1 });

        // Map to standard format expected by SellScrapPage
        const categories = prices.map(p => ({
            id: p.category.toLowerCase().replace(/\s+/g, '_'),
            name: p.category,
            icon: p.image || null, // UI will fallback if null
        }));

        sendSuccess(res, 'Scrapper categories retrieved successfully', { categories });
    } catch (error) {
        logger.error('[Public] Error fetching scrapper categories:', error);
        sendError(res, 'Failed to fetch scrapper categories', 500);
    }
});
// @desc    Get referral tiers and settings for public view
// @route   GET /api/public/referral-config
// @access  Public
export const getPublicReferralConfig = asyncHandler(async (req, res) => {
    try {
        const [tiers, settings] = await Promise.all([
            import('../models/ReferralTier.js').then(m => m.default.find().sort({ minReferrals: 1 })),
            import('../models/ReferralSetting.js').then(m => m.default.findOne())
        ]);

        sendSuccess(res, 'Referral configuration retrieved successfully', { 
            tiers: tiers.length > 0 ? tiers : null, 
            settings: settings 
        });
    } catch (error) {
        logger.error('[Public] Error fetching referral config:', error);
        // We still send success with nulls to let frontend use defaults instead of hard crashing
        sendSuccess(res, 'Failed to fetch dynamic config, using system defaults', { tiers: null, settings: null });
    }
});
