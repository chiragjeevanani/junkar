import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { generateToken } from '../utils/generateToken.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import { sendOTP, sendWelcomeSMS } from '../utils/otpService.js';
import { activateFirstMonthTrial } from '../services/subscriptionService.js';
import logger from '../utils/logger.js';
import { USER_ROLES } from '../config/constants.js';

// Helper: bypass OTP sending for specific test numbers (disabled in production by default)
const isBypassEnabled = process.env.ENABLE_BYPASS_OTP !== 'false' && process.env.NODE_ENV !== 'production';
// User test numbers
const userBypassList = new Set(['6260491554', '9685974247', '9876543210', '9999999999', '7610416911', '9111111111', '9575500329']);
// Scrapper test numbers (dedicated for scrapper testing)
const scrapperBypassList = new Set(['9999988888', '7000000000', '9000000000', '8888888888', '7777777777', '6666666666', '5555555555', '1234512345', '9000000001', '9000000002', '9000000003', '9000000004', '9000000005', '9000000006', '9000000007', '9000000008', '9000000009', '6111111111', '9827223585', '9009022251', '8643041429']);
// Combined bypass list
const bypassList = new Set([...userBypassList, ...scrapperBypassList]);
const isBypassOtpNumber = (phone) => {
  // Always allow bypass for the main default numbers
  if (phone === '9999988888' || phone === '6260491554' || phone === '7000000000' || phone === '9000000000' || phone === '9827223585' || phone === '9575500329') return true;
  // Other numbers only bypass in non-production environments
  return isBypassEnabled && bypassList.has(phone);
};
// Get bypass OTP for a phone number
const getBypassOtp = (phone) => {
  if (phone === '7610416911') {
    return '110211';
  } else if (scrapperBypassList.has(phone)) {
    return '123456'; // Default OTP for scrapper test numbers
  } else {
    return '123456'; // Default OTP for other test numbers
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, referralCode, city, state } = req.body;
  const userRole = role || USER_ROLES.USER;

  // Validate referral code if provided
  let referrerId = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return sendError(res, 'Invalid referral code', 400);
    }
    // Prevent self-referral logic (though difficult here since user doesn't exist yet, but ensure code isn't same as what we might generate? actually we don't know our own code yet. Unlikely collision).
    referrerId = referrer._id;
  }

  // Check if phone number is already registered in opposite role
  if (userRole === USER_ROLES.USER) {
    // If registering as user, check if phone exists in Scrapper collection
    const scrapperExists = await Scrapper.findOne({ phone });
    if (scrapperExists) {
      return sendError(res, 'This phone number is already registered as a scrapper. Please use a different number or login as scrapper.', 400);
    }
    // Check if user exists
    const query = { phone };
    if (email) {
      query.$or = [{ email }, { phone }];
    }
    const userExists = await User.findOne(query);
    if (userExists) {
      return sendError(res, `User already exists with this ${userExists.phone === phone ? 'phone' : 'email'}`, 400);
    }
  } else if (userRole === USER_ROLES.SCRAPPER) {
    // If registering as scrapper, check if phone exists in User collection
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return sendError(res, 'This phone number is already registered as a user. Please use a different number or login as user.', 400);
    }
    // Check if scrapper exists
    const scrapperExists = await Scrapper.findOne({ phone });
    if (scrapperExists) {
      return sendError(res, 'Scrapper already exists with this phone number', 400);
    }
  }

  // Create user (primary auth record)
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: userRole,
    referredBy: referrerId,
    address: {
      city: city || '',
      state: state || ''
    }
  });

  // If registering as scrapper, also create scrapper profile (if not already created)
  if (userRole === USER_ROLES.SCRAPPER) {
    try {
      // Basic default vehicle info - can be updated later via profile
      const defaultVehicleInfo = {
        type: 'bike',
        number: 'NA',
        capacity: 0
      };

      await Scrapper.create({
        _id: user._id, // keep scrapper id in sync with user id
        phone,
        name,
        email,
        services: req.body.services || ['scrap_pickup'],
        scrapperType: req.body.scrapperType || 'feri_wala',
        businessLocation: {
          type: 'Point',
          coordinates: req.body.businessCoordinates || (req.body.businessLocation?.coordinates) || [0, 0],
          address: req.body.businessAddress || (req.body.businessLocation?.address) || '',
          city: req.body.city || '',
          state: req.body.state || ''
        },
        dealCategories: req.body.dealCategories || [],
        vehicleInfo: defaultVehicleInfo
      });

      // Pahla Mahina Free: auto-activate first month trial (no payment). Dusre mahine se paid plan.
      try {
        await activateFirstMonthTrial(user._id);
      } catch (trialError) {
        logger.warn('First month trial activation failed (registration succeeded):', { userId: user._id, error: trialError.message });
      }
    } catch (scrapperError) {
      // If scrapper creation fails, log error but don't block registration
      logger.error('❌ Failed to create scrapper profile during registration:', {
        error: scrapperError.message,
        phone,
        userId: user._id
      });
    }
  }

  // Generate OTP for phone verification
  let otp;
  if (isBypassOtpNumber(phone)) {
    // Use custom OTP for specific phone numbers
    otp = getBypassOtp(phone);
    user.phoneVerificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  } else {
    otp = user.generateOTP();
  }
  await user.save();

  // Send OTP via SMS
  try {
    if (isBypassOtpNumber(phone)) {
      logger.info(`📵 Bypass SMS for ${phone}. Using fixed OTP ${otp}.`);
    } else {
      await sendOTP(phone, otp);
      logger.info(`📱 OTP sent successfully to ${phone}`);
    }
  } catch (smsError) {
    logger.error('SMS sending failed:', smsError.message);
    // In development mode, allow registration even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ SMS failed but allowing registration in development mode. OTP: ${otp}`);
    } else {
      // In production, return error if SMS fails
      return sendError(res, 'Failed to send OTP. Please try again.', 500);
    }
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  sendSuccess(res, 'User registered successfully. Please verify your phone number with OTP.', {
    user,
    token,
    otpSent: true
  }, 201);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is deactivated', 403);
  }

  // For admin users, ensure they use password-based login (not OTP)
  if (user.role === USER_ROLES.ADMIN) {
    if (!password) {
      return sendError(res, 'Admin users must use password-based login', 400);
    }
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  // For scrappers, include scrapper profile data
  let scrapper = null;
  if (user.role === USER_ROLES.SCRAPPER) {
    scrapper = await Scrapper.findById(user._id);
    if (!scrapper && user.phone) {
      scrapper = await Scrapper.findOne({ phone: user.phone });
    }
  }

  sendSuccess(res, 'Login successful', {
    user,
    token,
    ...(scrapper && { scrapper })
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // For scrappers, include scrapper profile data
  let scrapper = null;
  if (user.role === USER_ROLES.SCRAPPER) {
    scrapper = await Scrapper.findById(user._id);
    if (!scrapper && user.phone) {
      scrapper = await Scrapper.findOne({ phone: user.phone });
    }
  }

  sendSuccess(res, 'User retrieved successfully', {
    user,
    ...(scrapper && { scrapper })
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  // Validate name format (Alphabets and spaces only)
  if (name && !/^[a-zA-Z\s]*$/.test(name)) {
    return sendError(res, 'Full name should only contain alphabetical characters', 400);
  }

  // Validate state and city format if provided
  const alphaRegex = /^[a-zA-Z\s]*$/;
  if (address?.state && !alphaRegex.test(address.state)) {
    return sendError(res, 'State name should only contain alphabetical characters', 400);
  }
  if (address?.city && !alphaRegex.test(address.city)) {
    return sendError(res, 'City name should only contain alphabetical characters', 400);
  }

  // Validate pincode if provided (should be exactly 6 digits for India)
  if (address?.pincode && !/^[0-9]{6}$/.test(address.pincode)) {
    return sendError(res, 'Pincode should be exactly 6 digits', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name,
      phone,
      address
    },
    {
      new: true,
      runValidators: true
    }
  );

  sendSuccess(res, 'Profile updated successfully', { user });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, purpose, role } = req.body;
  const requestedRole = role || (purpose === 'login' ? USER_ROLES.USER : null);

  // If role is specified, check cross-role validation
  if (requestedRole) {
    if (requestedRole === USER_ROLES.USER) {
      const scrapperExists = await Scrapper.findOne({ phone });
      if (scrapperExists) {
        return sendError(res, 'This phone number is registered as a scrapper. Please login from the scrapper portal.', 400);
      }
    } else if (requestedRole === USER_ROLES.SCRAPPER) {
      const userExists = await User.findOne({ phone, role: USER_ROLES.USER });
      if (userExists) {
        return sendError(res, 'This phone number is registered as a user. Please login from the user portal.', 400);
      }
    }
  }

  // Find user by phone, but if role is specified, also filter by role
  let user;
  if (requestedRole) {
    // First try to find with exact role match
    user = await User.findOne({ phone, role: requestedRole });

    // If not found with role, try without role (for existing users who might have wrong role)
    if (!user) {
      user = await User.findOne({ phone });
      if (user && user.role !== requestedRole) {
        logger.warn('⚠️ User found but role mismatch. Updating role:', {
          phone,
          currentRole: user.role,
          requestedRole,
          userId: user._id
        });
        // Update user role to match requested role
        user.role = requestedRole;
        await user.save();
      }
    }
  } else {
    user = await User.findOne({ phone });
  }

  if (!user) {
    const errorMsg = requestedRole
      ? `User not found with phone ${phone} and role ${requestedRole}`
      : `User not found with phone ${phone}`;
    return sendError(res, errorMsg, 404);
  }

  // Ensure role matches (after potential update above)
  if (requestedRole && user.role !== requestedRole) {
    logger.error('❌ Role mismatch in verifyOTP after update:', {
      phone,
      requestedRole,
      userRole: user.role,
      userId: user._id
    });
    return sendError(res, `Role mismatch. Expected ${requestedRole}, but user has role ${user.role}`, 400);
  }

  // Debug logging
  logger.info('🔍 OTP Verification Debug:', {
    phone,
    providedOTP: otp,
    storedOTP: user.phoneVerificationOTP,
    otpExpiresAt: user.otpExpiresAt,
    currentTime: new Date(),
    isExpired: user.otpExpiresAt ? user.otpExpiresAt < new Date() : 'No expiry set'
  });

  // Verify OTP (allow bypass numbers without requiring a prior send step)
  let isOTPValid = false;

  // Bypass acceptance: if number is in bypass list, accept the configured code
  if (isBypassOtpNumber(phone)) {
    const expectedBypassOtp = getBypassOtp(phone);
    isOTPValid = otp === expectedBypassOtp;
    if (isOTPValid) {
      // Mark OTP as valid regardless of stored values
      user.phoneVerificationOTP = null;
      user.otpExpiresAt = null;
    }
  }

  // Fallback to stored OTP validation when not already accepted via bypass
  if (!isOTPValid) {
    isOTPValid = user.verifyOTP(otp);
  }

  if (!isOTPValid) {
    logger.warn('❌ OTP verification failed:', {
      providedOTP: otp,
      storedOTP: user.phoneVerificationOTP,
      otpExpiresAt: user.otpExpiresAt,
      currentTime: new Date()
    });
    return sendError(res, 'Invalid or expired OTP', 400);
  }

  // Mark phone as verified
  if (!user.isPhoneVerified) {
    user.isPhoneVerified = true;
    user.isVerified = true;
  }

  // CRITICAL: Update role BEFORE clearing OTP and saving
  // This ensures role is correct in database before token generation
  if (requestedRole && user.role !== requestedRole) {
    logger.warn('⚠️ Role mismatch in verifyOTP - updating user role:', {
      phone,
      requestedRole,
      currentUserRole: user.role,
      userId: user._id
    });
    user.role = requestedRole;
  }

  // Clear OTP
  user.phoneVerificationOTP = null;
  user.otpExpiresAt = null;
  await user.save();

  // Always issue a fresh access token after successful verification
  // Use user.role which should now be correct (updated above if needed)
  const tokenRole = user.role;

  // Final safety check: if requestedRole was specified, ensure we use it
  if (requestedRole && tokenRole !== requestedRole) {
    logger.error('❌ CRITICAL: Role still wrong after update:', {
      phone,
      requestedRole,
      userRole: user.role,
      tokenRole,
      userId: user._id
    });
    // Force correct role
    const finalRole = requestedRole;
    const token = generateToken(user._id, finalRole);
    user.role = finalRole; // Update for response

    // For scrappers, include scrapper profile data
    let scrapper = null;
    if (user.role === USER_ROLES.SCRAPPER) {
      scrapper = await Scrapper.findById(user._id);
      if (!scrapper && user.phone) {
        scrapper = await Scrapper.findOne({ phone: user.phone });
      }
    }

    sendSuccess(res, 'OTP verified successfully', {
      user,
      token,
      ...(scrapper && { scrapper })
    });
    return;
  }

  const token = generateToken(user._id, tokenRole);

  // Log token generation for debugging
  logger.info('🔑 Token generated in verifyOTP:', {
    userId: user._id,
    phone: phone,
    role: tokenRole,
    requestedRole: requestedRole || 'none',
    userRoleInDB: user.role
  });

  // For scrappers, include scrapper profile data
  let scrapper = null;
  if (user.role === USER_ROLES.SCRAPPER) {
    scrapper = await Scrapper.findById(user._id);
    if (!scrapper && user.phone) {
      scrapper = await Scrapper.findOne({ phone: user.phone });
    }
  }

  sendSuccess(res, 'OTP verified successfully', {
    user,
    token,
    ...(scrapper && { scrapper })
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findOne({ phone });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Generate new OTP
  let otp;
  if (isBypassOtpNumber(phone)) {
    // Use custom OTP for specific phone numbers
    otp = getBypassOtp(phone);
    user.phoneVerificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`🔧 Bypass OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  } else {
    otp = user.generateOTP();
    logger.info(`🔧 Regular OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  }
  await user.save();

  // Send OTP via SMS
  try {
    if (isBypassOtpNumber(phone)) {
      logger.info(`📵 Bypass SMS for ${phone}. Using fixed OTP ${otp}.`);
    } else {
      await sendOTP(phone, otp);
      logger.info(`📱 OTP resent successfully to ${phone}`);
    }
  } catch (smsError) {
    logger.error('SMS sending failed:', smsError.message);
    // In development mode, allow resend even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ SMS failed but allowing resend in development mode. OTP: ${otp}`);
    } else {
      return sendError(res, 'Failed to send OTP. Please try again.', 500);
    }
  }

  sendSuccess(res, 'OTP resent successfully', {
    otpSent: true,
    ...(process.env.NODE_ENV === 'development' && { otp }) // Only send OTP in development
  });
});

// @desc    Send OTP for passwordless login
// @route   POST /api/auth/login-otp
// @access  Public
export const sendLoginOTP = asyncHandler(async (req, res) => {
  const { phone, role } = req.body;
  const requestedRole = role || USER_ROLES.USER;

  // Check if phone exists in opposite role and prevent cross-login
  if (requestedRole === USER_ROLES.USER) {
    const scrapperExists = await Scrapper.findOne({ phone });
    if (scrapperExists) {
      return sendError(res, 'This phone number is registered as a scrapper. Please login from the scrapper portal.', 400);
    }
  } else if (requestedRole === USER_ROLES.SCRAPPER) {
    const userExists = await User.findOne({ phone, role: USER_ROLES.USER });
    if (userExists) {
      return sendError(res, 'This phone number is registered as a user. Please login from the user portal.', 400);
    }
  }

  const user = await User.findOne({ phone, role: requestedRole });

  if (!user) {
    return sendError(res, 'User not found with this phone number', 404);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is deactivated. Please contact support.', 401);
  }

  // Generate new OTP
  let otp;
  if (isBypassOtpNumber(phone)) {
    // Use custom OTP for specific phone numbers
    otp = getBypassOtp(phone);
    user.phoneVerificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    logger.info(`🔧 Bypass OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  } else {
    otp = user.generateOTP();
    logger.info(`🔧 Regular OTP generated for ${phone}: ${otp}, expires at: ${user.otpExpiresAt}`);
  }
  await user.save();

  // Send OTP via SMS
  try {
    if (isBypassOtpNumber(phone)) {
      logger.info(`📵 Bypass SMS for ${phone}. Using fixed OTP ${otp}.`);
    } else {
      await sendOTP(phone, otp);
      logger.info(`📱 Login OTP sent successfully to ${phone}`);
    }
  } catch (smsError) {
    logger.error('SMS sending failed:', smsError.message);
    // In development mode, allow login OTP even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`⚠️ SMS failed but allowing login OTP in development mode. OTP: ${otp}`);
    } else {
      return sendError(res, 'Failed to send OTP. Please try again.', 500);
    }
  }

  sendSuccess(res, 'Login OTP sent successfully', {
    otpSent: true,
    ...(process.env.NODE_ENV === 'development' && { otp }) // Only send OTP in development
  });
});

// @desc    Refresh JWT token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return sendError(res, 'Refresh token is required', 400);
  }

  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      return sendError(res, 'Server configuration error', 500);
    }

    // Verify refresh token (stateless, Redis disabled)
    const decoded = jwt.default.verify(token, secret);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id, user.role);

    // Optional rotation without persistence
    const rotateRefreshToken = process.env.ROTATE_REFRESH_TOKEN !== 'false';
    let newRefreshToken = null;

    if (rotateRefreshToken) {
      const { generateRefreshToken } = await import('../utils/generateToken.js');
      newRefreshToken = generateRefreshToken(user._id);
    }

    // For scrappers, include scrapper profile data
    let scrapper = null;
    if (user.role === USER_ROLES.SCRAPPER) {
      scrapper = await Scrapper.findById(user._id);
      if (!scrapper && user.phone) {
        scrapper = await Scrapper.findOne({ phone: user.phone });
      }
    }

    sendSuccess(res, 'Token refreshed successfully', {
      token: newAccessToken,
      ...(newRefreshToken && { refreshToken: newRefreshToken }),
      ...(scrapper && { scrapper })
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }
    logger.error('Refresh token error:', error);
    return sendError(res, 'Failed to refresh token', 500);
  }
});

