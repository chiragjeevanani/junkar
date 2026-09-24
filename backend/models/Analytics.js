import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: ['ORDER', 'WALLET', 'USER', 'SCRAPPER', 'SYSTEM'],
        required: true,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for time-series queries
analyticsSchema.index({ event: 1, timestamp: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
