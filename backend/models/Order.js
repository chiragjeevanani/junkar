import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS, SCRAP_CATEGORIES, PRICING_TYPES, ITEM_CONDITIONS } from '../config/constants.js';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Scrapper'],
    default: 'User'
  },
  scrapper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    default: null
  },
  quantityType: {
    type: String,
    enum: ['small', 'large'],
    default: 'small'
  },
  forwardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    default: null
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    default: null
  },
  scrapItems: [{
    category: {
      type: String,
      required: true
    },
    name: String,
    pricingType: {
      type: String,
      enum: Object.values(PRICING_TYPES),
      default: PRICING_TYPES.KG_BASED
    },
    weight: {
      type: Number,
      default: 0,
      min: 0
    },
    rate: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    itemCondition: {
      type: String,
      enum: [...Object.values(ITEM_CONDITIONS), null],
      default: null
    },
    expectedPrice: {
      type: Number,
      default: null,
      min: 0
    }
  }],
  totalWeight: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  preferredTime: {
    type: String,
    default: null
  },
  pickupSlot: {
    dayName: String,
    date: String,
    slot: String,
    timestamp: Number
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  assignmentStatus: {
    type: String,
    enum: ['unassigned', 'assigned', 'accepted', 'rejected', 'targeted'],
    default: 'unassigned'
  },
  assignmentHistory: [{
    scrapper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    status: String,
    timeoutAt: Date
  }],
  images: [{
    url: String,
    publicId: String
  }],
  notes: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isDonation: {
    type: Boolean,
    default: false
  },
  isNegotiated: {
    type: Boolean,
    default: false
  },
  finalPrice: {
    type: Number,
    default: null
  },
  dealType: {
    type: String,
    enum: ['Cash', 'Online'],
    default: 'Cash'
  },
  targetedScrappers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper'
  }],
  rejectedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ scrapper: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ location: '2dsphere' }); // Geospacial Index

// Pre-save hook to sync pickupAddress coordinates to GeoJSON location
orderSchema.pre('save', function (next) {
  const coords = this.pickupAddress?.coordinates;
  const lat = coords?.lat;
  const lng = coords?.lng;

  // Only sync if coordinates are valid, non-zero numbers (0,0 = no location set)
  if (
    typeof lat === 'number' && isFinite(lat) && lat !== 0 &&
    typeof lng === 'number' && isFinite(lng) && lng !== 0
  ) {
    this.location = {
      type: 'Point',
      coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
    };
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

