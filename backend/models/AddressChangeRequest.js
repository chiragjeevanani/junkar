import mongoose from 'mongoose';

const addressChangeRequestSchema = new mongoose.Schema({
  scrapper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    required: true
  },
  requestedAddress: {
    type: String,
    default: ''
  },
  requestedCoordinates: {
    type: [Number], // [lng, lat]
    default: [0, 0]
  },
  requestedCity: {
    type: String,
    default: ''
  },
  requestedState: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Final values set by admin (can edit before approving)
  approvedAddress: { type: String, default: '' },
  approvedCoordinates: { type: [Number], default: [0, 0] },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

addressChangeRequestSchema.index({ scrapper: 1, status: 1 });
addressChangeRequestSchema.index({ status: 1 });

const AddressChangeRequest = mongoose.model('AddressChangeRequest', addressChangeRequestSchema);
export default AddressChangeRequest;
