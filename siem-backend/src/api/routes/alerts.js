import express from 'express';
import { Alert } from '../../database/models/Alert.js';

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

export default router;

