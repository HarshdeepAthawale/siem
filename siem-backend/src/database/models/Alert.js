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
  // Enhanced fields for production SIEM
  correlated_events: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  attack_chain: {
    type: [String],
    default: [],
  },
  confidence_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  false_positive: {
    type: Boolean,
    default: false,
    index: true,
  },
  acknowledged: {
    type: Boolean,
    default: false,
    index: true,
  },
  acknowledged_at: {
    type: Date,
    required: false,
  },
  acknowledged_by: {
    type: String,
    required: false,
  },
  assigned_to: {
    type: String,
    required: false,
    index: true,
  },
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  notes: {
    type: String,
    required: false,
  },
}, {
  timestamps: false,
  collection: 'alerts',
});

// Indexes for performance
alertSchema.index({ severity: 1, created_at: -1 });
alertSchema.index({ source_ip: 1 });
alertSchema.index({ created_at: -1 });
// Triage workflow indexes
alertSchema.index({ acknowledged: 1, created_at: -1 });
alertSchema.index({ false_positive: 1 });
alertSchema.index({ assigned_to: 1, acknowledged: 1 });
alertSchema.index({ tags: 1 });
alertSchema.index({ alert_type: 1, severity: 1, created_at: -1 });

export const Alert = mongoose.model('Alert', alertSchema);

