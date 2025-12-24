import express from 'express';
import { Event } from '../../database/models/Event.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      ip,
      severity,
      type,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (ip) {
      query.source_ip = ip;
    }

    if (severity) {
      query.severity = severity;
    }

    if (type) {
      query.event_type = type;
    }

    if (from || to) {
      query.timestamp = {};
      if (from) {
        query.timestamp.$gte = new Date(from);
      }
      if (to) {
        query.timestamp.$lte = new Date(to);
      }
    }

    // Execute query with pagination
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query),
    ]);

    res.json({
      data: events,
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

export default router;

