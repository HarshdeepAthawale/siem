import express from 'express';
import { Alert } from '../../database/models/Alert.js';
import { Event } from '../../database/models/Event.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      severity,
      ip,
      from,
      to,
      page = 1,
      limit = 50,
      acknowledged,
      false_positive,
      assigned_to,
      tags,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (severity) {
      query.severity = severity;
    }

    if (ip) {
      query.source_ip = ip;
    }

    if (acknowledged !== undefined) {
      query.acknowledged = acknowledged === 'true';
    }

    if (false_positive !== undefined) {
      query.false_positive = false_positive === 'true';
    }

    if (assigned_to) {
      query.assigned_to = assigned_to;
    }

    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    if (from || to) {
      query.created_at = {};
      if (from) {
        query.created_at.$gte = new Date(from);
      }
      if (to) {
        query.created_at.$lte = new Date(to);
      }
    }

    // Execute query with pagination
    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ severity: -1, created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Alert.countDocuments(query),
    ]);

    res.json({
      data: alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert by ID with correlated events
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const alert = await Alert.findById(id).lean();
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Get correlated events if any
    let correlatedEvents = [];
    if (alert.correlated_events && alert.correlated_events.length > 0) {
      correlatedEvents = await Event.find({
        _id: { $in: alert.correlated_events },
      }).lean();
    }

    res.json({
      ...alert,
      correlated_events_data: correlatedEvents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledged_by } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        acknowledged: true,
        acknowledged_at: new Date(),
        acknowledged_by: acknowledged_by || 'system',
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign alert
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    if (!assigned_to) {
      return res.status(400).json({ error: 'assigned_to is required' });
    }

    const alert = await Alert.findByIdAndUpdate(
      id,
      { assigned_to },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as false positive
router.patch('/:id/false-positive', async (req, res) => {
  try {
    const { id } = req.params;
    const { false_positive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const alert = await Alert.findByIdAndUpdate(
      id,
      { false_positive: false_positive !== false },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add notes to alert
router.patch('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const alert = await Alert.findByIdAndUpdate(
      id,
      { notes: notes || '' },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

