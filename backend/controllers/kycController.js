import Scrapper, { getComputedBadges } from '../models/Scrapper.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { deleteFile as deleteFromCloudinary, uploadFile } from '../services/uploadService.js';
import logger from '../utils/logger.js';
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js';

// @desc Submit or update KYC
// @route POST /api/kyc
// @access Private (Scrapper)
export const submitKyc = async (req, res) => {
  try {
    const userId = req.user.id;
    const { aadhaarNumber, panNumber, gstNumber, udyamAadhaarNumber, skipKyc } = req.body;

    logger.info(`Starting KYC submission for user: ${userId}`);
    logger.info(`Files received: ${req.files ? Object.keys(req.files).join(',') : 'None'}`);

    // 1. Find User and Scrapper
    const user = await User.findById(userId);
    if (!user || user.role !== 'scrapper') {
      return sendError(res, 'Scrapper user not found', 404);
    }

    let scrapper = await Scrapper.findById(userId);
    if (!scrapper && user.phone) {
      scrapper = await Scrapper.findOne({ phone: user.phone });
    }

    // Creating profile if not exists (auto-provision)
    if (!scrapper) {
      logger.info('Creating new scrapper profile for KYC');
      scrapper = await Scrapper.create({
        _id: user._id,
        phone: user.phone,
        name: user.name || 'Scrapper',
        email: user.email,
        vehicleInfo: { type: 'bike', number: 'NA', capacity: 0 }
      });
    }

    if (skipKyc === 'true') {
      logger.info(`User ${userId} chose to skip KYC`);
      scrapper.kyc = {
        ...(scrapper.kyc || {}),
        status: 'skipped'
      };
      await scrapper.save();
      return sendSuccess(res, 'KYC skipped successfully', { kyc: scrapper.kyc }, 200);
    }

    // 2. Validate Files
    const files = req.files || {};
    const aadhaarFile = files['aadhaar'] ? files['aadhaar'][0] : null;
    const aadhaarBackFile = files['aadhaarBack'] ? files['aadhaarBack'][0] : null;
    const selfieFile = files['selfie'] ? files['selfie'][0] : null;
    const panFile = files['pan'] ? files['pan'][0] : null;
    const shopLicenseFile = files['shopLicense'] ? files['shopLicense'][0] : null;
    const shopPhotoFile = files['shopPhoto'] ? files['shopPhoto'][0] : null;
    const gstCertificateFile = files['gstCertificate'] ? files['gstCertificate'][0] : null;

    // Validation: Check if we have the documents either in this request OR already in DB
    const hasAadhaar = aadhaarFile || scrapper.kyc?.aadhaarPhotoUrl;
    const hasAadhaarBack = aadhaarBackFile || scrapper.kyc?.aadhaarBackPhotoUrl;
    const hasSelfie = selfieFile || scrapper.kyc?.selfieUrl;

    if (!hasAadhaar || !hasSelfie) {
      return sendError(res, 'Aadhaar (front) and Selfie photos are required.', 400);
    }

    if (!hasAadhaarBack) {
      return sendError(res, 'Aadhaar back photo (with address) is required.', 400);
    }

    // Aadhaar number is mandatory
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return sendError(res, 'Valid 12-digit Aadhaar number is required.', 400);
    }

    // Shop License is optional
    // Shop Photo (Dukandaar) is optional
    // GST Details (Wholesaler/Industrial) are optional

    // 3. Upload to Cloudinary
    // We update fields one by one to ensure we have the URLs
    let aadhaarUrl = scrapper.kyc?.aadhaarPhotoUrl;
    let aadhaarBackUrl = scrapper.kyc?.aadhaarBackPhotoUrl;
    let selfieUrl = scrapper.kyc?.selfieUrl;
    let panUrl = scrapper.kyc?.panPhotoUrl;
    let shopLicenseUrl = scrapper.kyc?.shopLicenseUrl;
    let shopPhotoUrl = scrapper.kyc?.shopPhotoUrl;
    let gstCertificateUrl = scrapper.kyc?.gstCertificateUrl;

    try {
      logger.info('Commencing parallel Cloudinary uploads for KYC docs');
      const uploadTasks = [];

      if (aadhaarFile) {
        uploadTasks.push(uploadFile(aadhaarFile, { folder: 'scrapto/kyc/aadhaar' }).then(res => { aadhaarUrl = res.secure_url; }));
      }
      if (aadhaarBackFile) {
        uploadTasks.push(uploadFile(aadhaarBackFile, { folder: 'scrapto/kyc/aadhaar_back' }).then(res => { aadhaarBackUrl = res.secure_url; }));
      }
      if (selfieFile) {
        uploadTasks.push(uploadFile(selfieFile, { folder: 'scrapto/kyc/selfie' }).then(res => { selfieUrl = res.secure_url; }));
      }
      if (panFile) {
        uploadTasks.push(uploadFile(panFile, { folder: 'scrapto/kyc/pan' }).then(res => { panUrl = res.secure_url; }));
      }
      if (shopLicenseFile) {
        uploadTasks.push(uploadFile(shopLicenseFile, { folder: 'scrapto/kyc/shopLicense' }).then(res => { shopLicenseUrl = res.secure_url; }));
      }
      if (shopPhotoFile) {
        uploadTasks.push(uploadFile(shopPhotoFile, { folder: 'scrapto/kyc/shopPhoto' }).then(res => { shopPhotoUrl = res.secure_url; }));
      }
      if (gstCertificateFile) {
        uploadTasks.push(uploadFile(gstCertificateFile, { folder: 'scrapto/kyc/gst' }).then(res => { gstCertificateUrl = res.secure_url; }));
      }

      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
        logger.info(`Successfully uploaded ${uploadTasks.length} documents in parallel`);
      }
    } catch (uploadError) {
      logger.error('Error uploading KYC documents (Parallel):', uploadError);
      return sendError(res, `Failed to upload documents: ${uploadError.message}`, 500);
    }

    // 4. Update Database
    scrapper.kyc = {
      aadhaarNumber: aadhaarNumber || scrapper.kyc?.aadhaarNumber,
      aadhaarPhotoUrl: aadhaarUrl,
      aadhaarBackPhotoUrl: aadhaarBackUrl,
      selfieUrl: selfieUrl,
      panNumber: panNumber || scrapper.kyc?.panNumber || null,
      panPhotoUrl: panUrl,
      shopLicenseUrl: shopLicenseUrl,
      shopPhotoUrl: shopPhotoUrl,
      gstNumber: gstNumber || scrapper.kyc?.gstNumber || null,
      gstCertificateUrl: gstCertificateUrl,
      udyamAadhaarNumber: udyamAadhaarNumber || scrapper.kyc?.udyamAadhaarNumber || null,
      status: 'pending',
      submittedAt: new Date(),
      rejectionReason: null,
      resendReason: null,
      verifiedAt: null
    };

    await scrapper.save();

    logger.info('KYC Submitted Successfully', { scrapperId: scrapper._id });

    return sendSuccess(res, 'KYC submitted successfully', { kyc: scrapper.kyc }, 201);

  } catch (error) {
    logger.error('KYC submission critical error:', error);
    return sendError(res, 'Internal server error during KYC submission', 500);
  }
};

// @desc Get own KYC status
// @route GET /api/kyc/me
// @access Private (Scrapper)
export const getMyKyc = async (req, res) => {
  // req.user.id typically refers to User document (role: 'scrapper')
  const user = await User.findById(req.user.id);

  if (!user || user.role !== 'scrapper') {
    return sendError(res, 'Scrapper user not found', 404);
  }

  // Select kyc fields explicitly to include ones with select: false if needed
  let scrapper = await Scrapper.findById(user._id)
    .select('subscription kyc.status kyc.aadhaarPhotoUrl kyc.aadhaarBackPhotoUrl kyc.selfieUrl kyc.licenseUrl kyc.panPhotoUrl kyc.shopLicenseUrl kyc.shopPhotoUrl kyc.gstNumber kyc.gstCertificateUrl kyc.udyamAadhaarNumber kyc.submittedAt kyc.verifiedAt kyc.verifiedBy kyc.rejectionReason kyc.resendReason +kyc.aadhaarNumber +kyc.panNumber');
  if (!scrapper && user.phone) {
    scrapper = await Scrapper.findOne({ phone: user.phone })
      .select('subscription kyc.status kyc.aadhaarPhotoUrl kyc.aadhaarBackPhotoUrl kyc.selfieUrl kyc.licenseUrl kyc.panPhotoUrl kyc.shopLicenseUrl kyc.shopPhotoUrl kyc.gstNumber kyc.gstCertificateUrl kyc.udyamAadhaarNumber kyc.submittedAt kyc.verifiedAt kyc.verifiedBy kyc.rejectionReason kyc.resendReason +kyc.aadhaarNumber +kyc.panNumber');
  }

  // Auto-provision scrapper profile if missing
  if (!scrapper) {
    const defaultVehicleInfo = {
      type: 'bike',
      number: 'NA',
      capacity: 0
    };

    scrapper = await Scrapper.create({
      _id: user._id,
      phone: user.phone,
      name: user.name || 'Scrapper',
      email: user.email || null,
      vehicleInfo: defaultVehicleInfo
    });

    logger.info('✅ Auto-created scrapper profile during KYC fetch:', {
      userId: user._id,
      phone: user.phone
    });
  }

  // Option B: simplified status logic
  const kycRaw = scrapper.kyc || {};
  const kycObj = kycRaw.toObject ? kycRaw.toObject() : { ...kycRaw };
  
  // Ensure status is explicitly included and prioritized
  const effectiveStatus = kycObj.status || (kycObj.aadhaarPhotoUrl ? 'pending' : 'not_submitted');

  return sendSuccess(res, 'KYC status retrieved', {
    kyc: { ...kycObj, status: effectiveStatus },
    status: effectiveStatus, // Legacy client support
    subscription: scrapper.subscription
  });
};

// @desc Admin verify KYC
// @route POST /api/kyc/:id/verify
// @access Private (Admin)
export const verifyKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const scrapper = await Scrapper.findById(id);
    if (!scrapper) return sendError(res, 'Scrapper not found', 404);

    scrapper.kyc.status = 'verified';
    scrapper.kyc.verifiedAt = new Date();
    scrapper.kyc.verifiedBy = req.user.id;
    scrapper.kyc.rejectionReason = null;
    scrapper.kyc.resendReason = null;
    await scrapper.save();

    // 2. Sync with User Document - Mark user as verified
    const user = await User.findById(id);
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    // [NOTIFICATION-1] KYC approved -> Scrapper ko push notification (non-blocking)
    sendNotificationToUser(id, {
      title: '🎉 KYC Verified!',
      body: 'Badhai ho! Tumhari KYC verify ho gayi. Ab tum orders accept kar sakte ho.',
      data: { type: 'kyc_verified', scrapperId: id }
    }, 'scrapper').catch(err => logger.error('[Notification] KYC verify notification failed:', err));

    return sendSuccess(res, 'KYC verified', { kyc: scrapper.kyc });
  } catch (error) {
    logger.error('KYC verification error:', error);
    return sendError(res, 'Failed to verify KYC', 500);
  }
};

// @desc Admin reject KYC
// @route POST /api/kyc/:id/reject
// @access Private (Admin)
export const rejectKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const scrapper = await Scrapper.findById(id);
    if (!scrapper) return sendError(res, 'Scrapper not found', 404);

    scrapper.kyc.status = 'rejected';
    scrapper.kyc.rejectionReason = reason || 'Not specified';
    scrapper.kyc.resendReason = null;
    scrapper.kyc.verifiedAt = null;
    scrapper.kyc.verifiedBy = req.user.id;
    await scrapper.save();

    // 2. Sync with User Document - Mark user as unverified
    const user = await User.findById(id);
    if (user) {
      user.isVerified = false;
      await user.save();
    }

    // [NOTIFICATION-1] KYC rejected -> Scrapper ko push notification (non-blocking)
    const rejectionMsg = reason ? `Reason: ${reason}` : 'Reason: Not specified';
    sendNotificationToUser(id, {
      title: '❌ KYC Rejected',
      body: `Tumhari KYC reject ho gayi. ${rejectionMsg}. Dobara documents submit karo.`,
      data: { type: 'kyc_rejected', scrapperId: id, reason: reason || '' }
    }, 'scrapper').catch(err => logger.error('[Notification] KYC reject notification failed:', err));

    return sendSuccess(res, 'KYC rejected', { kyc: scrapper.kyc });
  } catch (error) {
    logger.error('KYC rejection error:', error);
    return sendError(res, 'Failed to reject KYC', 500);
  }
};

// @desc Admin get all scrappers with KYC status
// @route GET /api/kyc/scrappers
// @access Private (Admin)
export const getAllScrappersWithKyc = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (status && ['pending', 'verified', 'rejected', 'resend_required'].includes(status)) {
      query['kyc.status'] = status;
    }

    // Get scrappers with KYC info
    const scrappers = await Scrapper.find(query)
      .select('name phone email scrapperType dealCategories businessLocation subscription status totalPickups earnings rating badges createdAt vehicleInfo kyc.aadhaarNumber kyc.aadhaarPhotoUrl kyc.aadhaarBackPhotoUrl kyc.selfieUrl kyc.panNumber kyc.panPhotoUrl kyc.shopLicenseUrl kyc.shopPhotoUrl kyc.gstNumber kyc.gstCertificateUrl kyc.udyamAadhaarNumber kyc.status kyc.verifiedAt kyc.rejectionReason kyc.resendReason')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Scrapper.countDocuments(query);
    const scrappersWithBadges = scrappers.map(s => ({ ...s, badges: getComputedBadges(s) }));

    return sendSuccess(res, 'Scrappers retrieved', {
      scrappers: scrappersWithBadges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get scrappers with KYC error:', error);
    return sendError(res, 'Failed to retrieve scrappers', 500);
  }
};

// @desc Admin request scrapper to re-upload KYC documents
// @route POST /api/kyc/:id/request-resend
// @access Private (Admin)
export const requestKycResend = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const scrapper = await Scrapper.findById(id);
    if (!scrapper) return sendError(res, 'Scrapper not found', 404);

    // Must have submitted KYC at least once before admin can request resend
    if (!scrapper.kyc || !scrapper.kyc.aadhaarPhotoUrl) {
      return sendError(res, 'Scrapper has not submitted KYC yet', 400);
    }

    scrapper.kyc.status = 'resend_required';
    scrapper.kyc.resendReason = reason || null;
    scrapper.kyc.rejectionReason = null;
    scrapper.kyc.verifiedAt = null;
    scrapper.kyc.verifiedBy = req.user.id;
    await scrapper.save();

    // 2. Sync with User Document - Mark user as unverified
    const user = await User.findById(id);
    if (user) {
      user.isVerified = false;
      await user.save();
    }

    // Push notification to scrapper
    const reasonMsg = reason ? `Reason: ${reason}` : 'Please review the instructions.';
    sendNotificationToUser(id, {
      title: '📋 Document Re-upload Required',
      body: `Admin ne aapke KYC documents dubara upload karne ko kaha hai. ${reasonMsg}`,
      data: { type: 'kyc_resend_required', scrapperId: id, reason: reason || '' }
    }, 'scrapper').catch(err => logger.error('[Notification] KYC resend notification failed:', err));

    return sendSuccess(res, 'Resend request sent to scrapper', { kyc: scrapper.kyc });
  } catch (error) {
    logger.error('KYC resend request error:', error);
    return sendError(res, 'Failed to send resend request', 500);
  }
};


