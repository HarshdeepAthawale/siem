import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
  source_ip: {
    type: String,
    required: true,
    index: true,
  },
  destination_ip: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
  },
  event_type: {
    type: String,
    required: true,
    index: true,
  },
  service: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'unknown'],
    required: true,
    default: 'unknown',
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'low',
  },
  raw_log: {
    type: String,
    required: true,
  },
  ingestion_time: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
  collection: 'events',
});

// Compound indexes for performance
eventSchema.index({ source_ip: 1, timestamp: -1 });
eventSchema.index({ event_type: 1, timestamp: -1 });
eventSchema.index({ severity: 1, timestamp: -1 });
eventSchema.index({ timestamp: -1 });

export const Event = mongoose.model('Event', eventSchema);

