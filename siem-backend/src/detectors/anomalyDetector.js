import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class AnomalyDetector extends BaseDetector {
  constructor() {
    super('AnomalyDetector');
    this.enabled = config.detection.anomalyDetectionEnabled;
    this.baselineDays = config.detection.anomalyBaselineDays;
    this.threshold = config.detection.anomalyThreshold;
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const now = new Date();
      const baselineStart = new Date(now.getTime() - this.baselineDays * 24 * 60 * 60 * 1000);
      const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // Last hour
      const alerts = [];

      // Anomaly 1: Unusual logon times
      const logonAnomalies = await this.detectLogonTimeAnomalies(baselineStart, windowStart);
      alerts.push(...logonAnomalies);

      // Anomaly 2: Unusual logon locations
      const locationAnomalies = await this.detectLocationAnomalies(baselineStart, windowStart);
      alerts.push(...locationAnomalies);

      // Anomaly 3: Unusual process execution
      const processAnomalies = await this.detectProcessAnomalies(baselineStart, windowStart);
      alerts.push(...processAnomalies);

      // Save all alerts
      for (const alertData of alerts) {
        const existingAlert = await Alert.findOne({
          alert_type: 'anomaly_detection',
          source_ip: alertData.source_ip,
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          const alert = new Alert(alertData);
          await alert.save();
          logger.warn(`Anomaly Detection Alert Created: ${alertData.source_ip} - ${alertData.description}`);
        }
      }

      return alerts.length;
    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      throw error;
    }
  }

  async detectLogonTimeAnomalies(baselineStart, windowStart) {
    const alerts = [];

    // Calculate baseline: average logon times per hour
    const baselinePipeline = [
      {
        $match: {
          event_id: 4624,
          timestamp: { $gte: baselineStart, $lt: windowStart },
        },
      },
      {
        $group: {
          _id: {
            username: '$username',
            hour: { $hour: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.username',
          avgByHour: {
            $avg: '$count',
          },
          stdDev: {
            $stdDevPop: '$count',
          },
        },
      },
    ];

    const baseline = await Event.aggregate(baselinePipeline);
    const baselineMap = new Map(baseline.map(b => [b._id, { avg: b.avgByHour || 0, stdDev: b.stdDev || 1 }]));

    // Check current period
    const currentPipeline = [
      {
        $match: {
          event_id: 4624,
          timestamp: { $gte: windowStart },
        },
      },
      {
        $group: {
          _id: {
            username: '$username',
            hour: { $hour: '$timestamp' },
          },
          count: { $sum: 1 },
          sourceIps: { $addToSet: '$source_ip' },
          eventIds: { $push: '$_id' },
        },
      },
    ];

    const current = await Event.aggregate(currentPipeline);

    for (const curr of current) {
      const username = curr._id.username;
      const baselineData = baselineMap.get(username);
      if (!baselineData) continue;

      const zScore = (curr.count - baselineData.avg) / baselineData.stdDev;
      if (zScore > this.threshold) {
        alerts.push({
          alert_type: 'anomaly_detection',
          source_ip: curr.sourceIps[0] || 'unknown',
          severity: zScore > this.threshold * 2 ? 'critical' : 'high',
          count: curr.count,
          first_seen: windowStart,
          last_seen: new Date(),
          description: `Unusual logon pattern detected: User ${username} has ${curr.count} logons at hour ${curr._id.hour}, which is ${zScore.toFixed(2)} standard deviations above baseline (avg: ${baselineData.avg.toFixed(2)})`,
          created_at: new Date(),
          correlated_events: curr.eventIds || [],
          attack_chain: ['unusual_logon_time', 'anomaly'],
          confidence_score: Math.min(90, 50 + zScore * 10),
          tags: ['anomaly', 'unusual_pattern', 'logon_time'],
        });
      }
    }

    return alerts;
  }

  async detectLocationAnomalies(baselineStart, windowStart) {
    const alerts = [];

    // Baseline: IPs per user
    const baselinePipeline = [
      {
        $match: {
          event_id: 4624,
          timestamp: { $gte: baselineStart, $lt: windowStart },
        },
      },
      {
        $group: {
          _id: {
            username: '$username',
            source_ip: '$source_ip',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.username',
          commonIPs: { $addToSet: '$_id.source_ip' },
        },
      },
    ];

    const baseline = await Event.aggregate(baselinePipeline);
    const baselineMap = new Map(baseline.map(b => [b._id, new Set(b.commonIPs)]));

    // Current period
    const currentPipeline = [
      {
        $match: {
          event_id: 4624,
          timestamp: { $gte: windowStart },
        },
      },
      {
        $group: {
          _id: {
            username: '$username',
            source_ip: '$source_ip',
          },
          count: { $sum: 1 },
          eventIds: { $push: '$_id' },
        },
      },
    ];

    const current = await Event.aggregate(currentPipeline);

    for (const curr of current) {
      const username = curr._id.username;
      const sourceIp = curr._id.source_ip;
      const commonIPs = baselineMap.get(username);

      if (commonIPs && !commonIPs.has(sourceIp)) {
        alerts.push({
          alert_type: 'anomaly_detection',
          source_ip: sourceIp,
          severity: 'high',
          count: curr.count,
          first_seen: windowStart,
          last_seen: new Date(),
          description: `Unusual logon location: User ${username} logged in from ${sourceIp}, which is not in their baseline IP set`,
          created_at: new Date(),
          correlated_events: curr.eventIds || [],
          attack_chain: ['unusual_location', 'anomaly'],
          confidence_score: 75,
          tags: ['anomaly', 'unusual_pattern', 'location'],
        });
      }
    }

    return alerts;
  }

  async detectProcessAnomalies(baselineStart, windowStart) {
    const alerts = [];

    // Baseline: processes per user
    const baselinePipeline = [
      {
        $match: {
          event_id: 4688,
          timestamp: { $gte: baselineStart, $lt: windowStart },
        },
      },
      {
        $group: {
          _id: {
            username: '$username',
            process_name: '$process_name',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.username',
          commonProcesses: { $addToSet: '$_id.process_name' },
        },
      },
    ];

    const baseline = await Event.aggregate(baselinePipeline);
    const baselineMap = new Map(baseline.map(b => [b._id, new Set(b.commonProcesses)]));

    // Current period
    const currentPipeline = [
      {
        $match: {
          event_id: 4688,
          timestamp: { $gte: windowStart },
          process_name: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            username: '$username',
            process_name: '$process_name',
            source_ip: '$source_ip',
          },
          count: { $sum: 1 },
          eventIds: { $push: '$_id' },
        },
      },
    ];

    const current = await Event.aggregate(currentPipeline);

    for (const curr of current) {
      const username = curr._id.username;
      const processName = curr._id.process_name;
      const sourceIp = curr._id.source_ip;
      const commonProcesses = baselineMap.get(username);

      if (commonProcesses && !commonProcesses.has(processName)) {
        alerts.push({
          alert_type: 'anomaly_detection',
          source_ip: sourceIp,
          severity: 'high',
          count: curr.count,
          first_seen: windowStart,
          last_seen: new Date(),
          description: `Unusual process execution: User ${username} executed ${processName} from ${sourceIp}, which is not in their baseline process set`,
          created_at: new Date(),
          correlated_events: curr.eventIds || [],
          attack_chain: ['unusual_process', 'anomaly'],
          confidence_score: 70,
          tags: ['anomaly', 'unusual_pattern', 'process'],
        });
      }
    }

    return alerts;
  }
}

