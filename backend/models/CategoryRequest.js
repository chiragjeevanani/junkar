import mongoose from 'mongoose';

const categoryRequestSchema = new mongoose.Schema({
  scrapperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['dukandaar', 'wholesaler'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'handled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const CategoryRequest = mongoose.model('CategoryRequest', categoryRequestSchema);
export default CategoryRequest;
