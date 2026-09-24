import Scrapper from '../models/Scrapper.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

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

export const getMyProfile = asyncHandler(async (req, res) => {
    let scrapper = await Scrapper.findById(req.user.id);

    // Auto-provision if missing
    if (!scrapper) {
        logger.info(`Scrapper profile missing for user ${req.user.id}, auto-provisioning...`);

        // Ensure we have phone/email from user
        // req.user might be partial depending on middleware, safe to fetch fresh
        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'scrapper') {
            return sendError(res, 'Scrapper user not found', 404);
        }

        scrapper = await Scrapper.create({
            _id: user._id,
            phone: user.phone,
            name: user.name || 'Scrapper',
            email: user.email,
            vehicleInfo: { type: 'bike', number: 'NA', capacity: 0 }
        });

        logger.info(`Auto-provisioned scrapper profile: ${scrapper._id}`);
    }

    sendSuccess(res, 'Scrapper profile fetched successfully', { scrapper });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
    const { name, vehicleInfo, availability, isOnline, receptionMode, dealCategories, city, state } = req.body;
    const userId = req.user.id || req.user._id;

    // 1. Update Scrapper Document
    let scrapper = await Scrapper.findById(userId);

    // Auto-provision if missing (Edge case protection)
    if (!scrapper) {
        const user = await User.findById(userId);
        if (user && user.role === 'scrapper') {
            scrapper = await Scrapper.create({
                _id: userId,
                phone: user.phone,
                name: user.name || name || 'Scrapper',
                email: user.email,
                vehicleInfo: vehicleInfo || { type: 'bike', number: 'NA', capacity: 0 },
                dealCategories: normalizeDealCategories(dealCategories || [])
            });
        } else {
            return sendError(res, 'Scrapper profile not found', 404);
        }
    } else {
        let requiresReverification = false;

        if (name && scrapper.name !== name) {
            scrapper.name = name;
            requiresReverification = true;
        }

        if (vehicleInfo) {
            // Check if vehicle info actually changed to prevent false triggers
            if (
                (vehicleInfo.type && scrapper.vehicleInfo?.type !== vehicleInfo.type) ||
                (vehicleInfo.number && scrapper.vehicleInfo?.number !== vehicleInfo.number)
            ) {
                requiresReverification = true;
            }
            scrapper.vehicleInfo = { ...scrapper.vehicleInfo, ...vehicleInfo };
        }

        if (dealCategories) {
            scrapper.dealCategories = normalizeDealCategories(dealCategories);
        }

        if (city) {
            scrapper.businessLocation.city = city;
        }
        if (state) {
            scrapper.businessLocation.state = state;
        }

        // Update Online and Reception Status
        if (availability !== undefined) scrapper.isOnline = availability;
        if (isOnline !== undefined) scrapper.isOnline = isOnline;
        if (receptionMode !== undefined) scrapper.receptionMode = receptionMode;

        // Re-verification Trigger Logic: Mark KYC as pending if critical info changes
        if (requiresReverification && scrapper.kyc && scrapper.kyc.status === 'verified') {
            scrapper.kyc.status = 'pending';
            scrapper.kyc.verifiedAt = null;
        }

        await scrapper.save();
    }

    // 2. Sync with User Document (Crucial for "har jagah update")
    if (name) {
        const user = await User.findById(userId);
        if (user) {
            user.name = name;
            await user.save();
        }
    }

    sendSuccess(res, 'Profile updated successfully', { scrapper });
});

export const getScrapperPublicProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const scrapper = await Scrapper.findById(id).select('-earnings -kyc.aadhaarNumber');

    if (!scrapper) {
        return sendError(res, 'Scrapper not found', 404);
    }

    sendSuccess(res, 'Scrapper fetched successfully', { scrapper });
});

export const updateFcmToken = asyncHandler(async (req, res) => {
    const { token, platform = 'web' } = req.body;
    const scrapperId = req.user.id;

    if (!token) {
        return sendError(res, 'Token is required', 400);
    }

    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper) {
        return sendError(res, 'Scrapper profile not found', 404);
    }

    // Update Scrapper model
    if (platform === 'web') {
        if (!scrapper.fcmTokens) scrapper.fcmTokens = [];
        if (!scrapper.fcmTokens.includes(token)) {
            scrapper.fcmTokens.push(token);
            if (scrapper.fcmTokens.length > 10) scrapper.fcmTokens = scrapper.fcmTokens.slice(-10);
        }
    } else {
        // mobile
        if (!scrapper.fcmTokenMobile) scrapper.fcmTokenMobile = [];
        if (!scrapper.fcmTokenMobile.includes(token)) {
            scrapper.fcmTokenMobile.push(token);
            if (scrapper.fcmTokenMobile.length > 10) scrapper.fcmTokenMobile = scrapper.fcmTokenMobile.slice(-10);
        }
    }
    await scrapper.save();

    // Sync with User model (optional but recommended since auth is shared)
    try {
        const user = await User.findById(scrapperId);
        if (user) {
            if (platform === 'web') {
                if (!user.fcmTokens) user.fcmTokens = [];
                if (!user.fcmTokens.includes(token)) {
                    user.fcmTokens.push(token);
                    if (user.fcmTokens.length > 10) user.fcmTokens = user.fcmTokens.slice(-10);
                }
            } else {
                if (!user.fcmTokenMobile) user.fcmTokenMobile = [];
                if (!user.fcmTokenMobile.includes(token)) {
                    user.fcmTokenMobile.push(token);
                    if (user.fcmTokenMobile.length > 10) user.fcmTokenMobile = user.fcmTokenMobile.slice(-10);
                }
            }
            await user.save();
        }
    } catch (error) {
        logger.warn('Failed to sync FCM token to User model:', error.message);
    }

    sendSuccess(res, 'FCM token updated successfully');
});

/**
 * @desc    Get nearby big scrappers for B2B discovery
 * @route   GET /api/scrappers/nearby-big
 * @access  Private (Scrapper - Retailer)
 */
export const getNearbyBigScrappers = asyncHandler(async (req, res) => {
    const { lat, lng, radius = 20 } = req.query; // radius in km

    if (!lat || !lng) {
        return sendError(res, 'Latitude and Longitude are required', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const scrapperId = req.user.id;
    const currentScrapper = await Scrapper.findById(scrapperId).select('scrapperType');

    let targetRoleTypes = ['big', 'wholesaler', 'dukandaar'];
    if (currentScrapper) {
        if (currentScrapper.scrapperType === 'feri_wala') {
            targetRoleTypes = ['dukandaar'];
        } else if (currentScrapper.scrapperType === 'dukandaar') {
            targetRoleTypes = ['wholesaler'];
        } else if (currentScrapper.scrapperType === 'wholesaler') {
            targetRoleTypes = ['wholesaler'];
        }
    }

    const nearbyBigScrappers = await Scrapper.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                distanceField: 'distance',
                // maxDistance removed to allow infinite radius discovery
                key: 'businessLocation',
                query: {
                    scrapperType: { $in: targetRoleTypes },
                    'kyc.status': 'verified',
                    receptionMode: true
                },
                spherical: true
            }
        },
        {
            $project: {
                name: 1,
                phone: 1,
                businessLocation: 1,
                rating: 1,
                services: 1,
                isOnline: 1, 
                receptionMode: 1, // Added for discovery status
                distance: { $divide: ['$distance', 1000] } // Convert to KM
            }
        }
    ]);

    sendSuccess(res, 'Nearby big scrappers retrieved successfully', { scrappers: nearbyBigScrappers });
});

/**
 * @desc    Delete logged in scrapper account completely
 * @route   DELETE /api/scrappers/me
 * @access  Private (Scrapper)
 */
export const deleteMyAccount = asyncHandler(async (req, res) => {
    const scrapperId = req.user.id;

    // Fetch details to get the phone number
    const user = await User.findById(scrapperId);
    const scrapper = await Scrapper.findById(scrapperId);
    const phone = user?.phone || scrapper?.phone;

    if (phone) {
        // Delete the Scrapper profile (wipes rankings, ratings, vehicle info, kyc docs info)
        await Scrapper.deleteMany({ $or: [{ _id: scrapperId }, { phone }] });
        // Delete the User authentication profile (wipes phone, password, auth)
        await User.deleteMany({ $or: [{ _id: scrapperId }, { phone }] });
    } else {
        await Scrapper.findByIdAndDelete(scrapperId);
        await User.findByIdAndDelete(scrapperId);
    }

    sendSuccess(res, 'Your scrapper account and all details have been successfully deleted.');
});

/**
 * @desc    Search for big scrappers by city string match
 * @route   GET /api/scrappers/search-by-city
 * @access  Private (Scrapper) - restricted by role
 */
export const searchScrappersByCity = asyncHandler(async (req, res) => {
    const { city } = req.query;
    if (!city) {
        return sendError(res, 'Please provide a city name to search.', 400);
    }

    const scrapperId = req.user.id;
    const currentScrapper = await Scrapper.findById(scrapperId).select('scrapperType');

    if (!currentScrapper) {
        return sendError(res, 'Scrapper profile not found.', 404);
    }

    let targetRoleTypes = [];
    if (currentScrapper.scrapperType === 'feri_wala') {
        targetRoleTypes = ['dukandaar'];
    } else if (currentScrapper.scrapperType === 'dukandaar') {
        targetRoleTypes = ['wholesaler'];
    } else {
        return sendError(res, 'City search not applicable for your role.', 403);
    }

    const cityRegex = new RegExp(city, 'i');

    const searchResults = await Scrapper.find({
        scrapperType: { $in: targetRoleTypes },
        'businessLocation.city': cityRegex,
        'kyc.status': 'verified',
        receptionMode: true
    }).select('name phone businessLocation rating services isOnline receptionMode').lean();
    
    // Default the distance to N/A or compute basic empty response for frontend format
    // Because this isn't geo-based, there is no real distance.
    const scrappers = searchResults.map(s => ({
        ...s,
        distance: null
    }));

    sendSuccess(res, `Found ${scrappers.length} partners in ${city}`, { scrappers });
});
