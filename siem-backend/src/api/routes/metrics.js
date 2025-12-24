import express from 'express';
import { Event } from '../../database/models/Event.js';
import { Alert } from '../../database/models/Alert.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const timeQuery = {};

    if (from || to) {
      timeQuery.timestamp = {};
      if (from) {
        timeQuery.timestamp.$gte = new Date(from);
      }
      if (to) {
        timeQuery.timestamp.$lte = new Date(to);
      }
    }

    // Total events
    const totalEvents = await Event.countDocuments(timeQuery);

    // Total alerts
    const alertTimeQuery = {};
    if (from || to) {
      alertTimeQuery.created_at = {};
      if (from) {
        alertTimeQuery.created_at.$gte = new Date(from);
      }
      if (to) {
        alertTimeQuery.created_at.$lte = new Date(to);
      }
    }
    const totalAlerts = await Alert.countDocuments(alertTimeQuery);

    // Critical alerts
    const criticalAlerts = await Alert.countDocuments({
      ...alertTimeQuery,
      severity: 'critical',
    });

    // Unique IPs
    const uniqueIPs = await Event.distinct('source_ip', timeQuery);

    // Events over time (last 24 hours, hourly buckets)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eventsOverTime = await Event.aggregate([
      {
        $match: {
          timestamp: { $gte: last24h },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:00:00',
              date: '$timestamp',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Severity breakdown
    const severityBreakdown = await Event.aggregate([
      {
        $match: timeQuery,
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    // Top attacking IPs
    const topIPs = await Event.aggregate([
      {
        $match: {
          ...timeQuery,
          severity: { $in: ['high', 'critical'] },
        },
      },
      {
        $group: {
          _id: '$source_ip',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Success vs Failure ratio
    const statusRatio = await Event.aggregate([
      {
        $match: timeQuery,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totals: {
        events: totalEvents,
        alerts: totalAlerts,
        criticalAlerts: criticalAlerts,
        uniqueIPs: uniqueIPs.length,
      },
      eventsOverTime: eventsOverTime.map(item => ({
        time: item._id,
        count: item.count,
      })),
      severityBreakdown: severityBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topIPs: topIPs.map(item => ({
        ip: item._id,
        count: item.count,
      })),
      statusRatio: statusRatio.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

