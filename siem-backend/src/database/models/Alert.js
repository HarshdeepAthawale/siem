import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alert_type: {
    type: String,
    required: true,
    index: true,
  },
  source_ip: {
    type: String,
    required: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['high', 'critical'],
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  first_seen: {
    type: Date,
    required: true,
  },
  last_seen: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
  collection: 'alerts',
});

// Indexes for performance
alertSchema.index({ severity: 1, created_at: -1 });
alertSchema.index({ source_ip: 1 });
alertSchema.index({ created_at: -1 });

export const Alert = mongoose.model('Alert', alertSchema);

