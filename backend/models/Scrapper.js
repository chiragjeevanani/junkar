import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const scrapperSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  profilePic: {
    type: String,
    default: null
  },
  services: {
    type: [String],
    enum: ['scrap_pickup'],
    default: ['scrap_pickup']
  },
  scrapperType: {
    type: String,
    enum: ['small', 'big', 'feri_wala', 'dukandaar', 'wholesaler', 'industrial'],
    default: 'feri_wala'
  },
  // Categories this scrapper deals in (e.g., only PAT bottles for a wholesaler)
  dealCategories: {
    type: [String],
    default: []
  },
  vehicleInfo: {
    type: {
      type: String,
      enum: ['cycle', 'thela', 'e_rickshaw', 'tempo', 'bike', 'auto', 'truck']
    },
    photoUrl: {
      type: String,
      default: null
    },
    number: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      min: 0
    }
  },
  kyc: {
    aadhaarNumber: {
      type: String,
      // Encrypted in application layer
      select: false
    },
    aadhaarPhotoUrl: {
      type: String,
      default: null
    },
    aadhaarBackPhotoUrl: {
      type: String,
      default: null
    },
    selfieUrl: {
      type: String,
      default: null
    },
    licenseUrl: {
      type: String,
      default: null
    },
    panNumber: {
      type: String,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please provide a valid PAN number'],
      select: false
    },
    panPhotoUrl: {
      type: String,
      default: null
    },
    shopLicenseUrl: {
      type: String,
      default: null
    },
    shopPhotoUrl: {
      type: String,
      default: null
    },
    gstNumber: {
      type: String,
      trim: true,
      default: null
    },
    gstCertificateUrl: {
      type: String,
      default: null
    },
    udyamAadhaarNumber: {
      type: String,
      trim: true,
      default: null
    },

    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected', 'resend_required', 'skipped'],
      default: 'not_submitted',
      required: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    resendReason: {
      type: String,
      default: null
    }
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'expired'
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    razorpaySubscriptionId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    }
  },
  marketSubscription: {
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'expired'
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    razorpaySubscriptionId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    }
  },
  liveLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  businessLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    }
  },
  availableSlots: [{
    day: {
      type: Number, // 0-6 (Sunday-Saturday)
      required: true,
      min: 0,
      max: 6
    },
    timeSlots: [{
      start: {
        type: String,
        required: true
      },
      end: {
        type: String,
        required: true
      }
    }]
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  receptionMode: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  // Badges (e.g. TRUSTED_DEALER when rating >= 4.5) – synced on rating update; also computed in toJSON
  badges: {
    type: [String],
    default: []
  },
  totalPickups: {
    type: Number,
    default: 0
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    withdrawn: {
      type: Number,
      default: 0
    }
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Insufficient funds']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN'],
      default: 'ACTIVE'
    }
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'suspended'],
    default: 'active'
  },
  phoneVerificationOTP: {
    type: String,
    select: false
  },
  otpExpiresAt: {
    type: Date,
    select: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false
  },
  // FCM Tokens
  fcmTokens: {
    type: [String],
    default: []
  },
  fcmTokenMobile: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
scrapperSchema.index({ liveLocation: '2dsphere' });
scrapperSchema.index({ businessLocation: '2dsphere' });
scrapperSchema.index({ isOnline: 1, 'kyc.status': 1, 'subscription.status': 1, 'marketSubscription.status': 1 });

// Hash password before saving
scrapperSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
scrapperSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP for phone verification
scrapperSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationOTP = otp;
  this.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify OTP
scrapperSchema.methods.verifyOTP = function (otp) {
  if (!this.phoneVerificationOTP || !this.otpExpiresAt) {
    return false;
  }

  if (this.otpExpiresAt < new Date()) {
    return false;
  }

  return this.phoneVerificationOTP === otp;
};

// Compute badges for response (e.g. TRUSTED_DEALER when rating >= 4.5) without mutating stored badges
const TRUSTED_DEALER_BADGE = 'TRUSTED_DEALER';
const BADGE_RATING_THRESHOLD = 4.5;

export function getComputedBadges(scrapper) {
  const raw = scrapper && (Array.isArray(scrapper.badges) ? scrapper.badges : []);
  const avg = scrapper?.rating?.average != null ? parseFloat(scrapper.rating.average) : 0;
  const hasTrusted = raw.includes(TRUSTED_DEALER_BADGE);
  if (avg >= BADGE_RATING_THRESHOLD && !hasTrusted) return [...raw, TRUSTED_DEALER_BADGE];
  if (avg < BADGE_RATING_THRESHOLD && hasTrusted) return raw.filter(b => b !== TRUSTED_DEALER_BADGE);
  return [...raw];
}

// Remove sensitive data from JSON output
scrapperSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.phoneVerificationOTP;
  if (obj.kyc) {
    delete obj.kyc.aadhaarNumber;
  }
  obj.badges = getComputedBadges(obj);
  return obj;
};

const Scrapper = mongoose.model('Scrapper', scrapperSchema);

export default Scrapper;

