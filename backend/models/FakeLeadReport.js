import mongoose from 'mongoose';

const fakeLeadReportSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  scrapper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    required: true
  },
  reason: {
    type: String,
    enum: ['wrong_item', 'wrong_address', 'not_available', 'customer_not_available', 'other'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

fakeLeadReportSchema.index({ order: 1 });
fakeLeadReportSchema.index({ scrapper: 1 });
fakeLeadReportSchema.index({ status: 1 });

const FakeLeadReport = mongoose.model('FakeLeadReport', fakeLeadReportSchema);
export default FakeLeadReport;
