import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class ComplianceDetector extends BaseDetector {
  constructor() {
    super('ComplianceDetector');
    this.enabled = config.detection.complianceEnabled;
    this.failedAuthThreshold = config.detection.complianceFailedAuthThreshold;
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const alerts = [];

      // Compliance 1: Excessive failed authentication attempts
      const failedAuthPipeline = [
        {
          $match: {
            $or: [
              { event_id: 4625 }, // Windows failed logon
              { event_type: 'ssh_login', status: 'failure' },
            ],
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: {
              username: { $ifNull: ['$target_username', '$username'] },
              source_ip: '$source_ip',
            },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
          },
        },
        {
          $match: {
            count: { $gte: this.failedAuthThreshold },
          },
        },
      ];

      const failedAuthResults = await Event.aggregate(failedAuthPipeline);

      for (const result of failedAuthResults) {
        const username = result._id.username || 'unknown';
        const sourceIp = result._id.source_ip;

        const existingAlert = await Alert.findOne({
          alert_type: 'compliance_violation',
          source_ip: sourceIp,
          'attack_chain': 'failed_auth',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'compliance_violation',
            source_ip: sourceIp,
            severity: 'high',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Compliance violation: ${result.count} failed authentication attempts for user ${username} from ${sourceIp} in the last 24 hours. This exceeds the compliance threshold of ${this.failedAuthThreshold} failed attempts.`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['failed_auth', 'compliance_violation'],
            confidence_score: 90,
            tags: ['compliance', 'failed_auth', 'policy_violation'],
          });
        }
      }

      // Compliance 2: Admin account usage tracking
      const adminUsagePipeline = [
        {
          $match: {
            event_id: 4672, // Admin logon
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
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
            privilegeList: { $first: '$privilege_list' },
          },
        },
      ];

      const adminUsageResults = await Event.aggregate(adminUsagePipeline);

      for (const result of adminUsageResults) {
        const username = result._id.username;
        const sourceIp = result._id.source_ip;

        // Track admin usage for compliance reporting
        const existingAlert = await Alert.findOne({
          alert_type: 'compliance_violation',
          source_ip: sourceIp,
          'attack_chain': 'admin_usage',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert && result.count >= 10) {
          alerts.push({
            alert_type: 'compliance_violation',
            source_ip: sourceIp,
            severity: 'medium',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Admin account usage: User ${username} from ${sourceIp} used admin privileges ${result.count} times in the last 24 hours. Privileges: ${result.privilegeList || 'N/A'}`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['admin_usage', 'compliance_tracking'],
            confidence_score: 100,
            tags: ['compliance', 'admin_usage', 'audit'],
          });
        }
      }

      // Compliance 3: Account lockout events
      const lockoutPipeline = [
        {
          $match: {
            event_id: 4740, // Account lockout
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: {
              username: '$target_username',
              source_ip: '$source_ip',
            },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
          },
        },
      ];

      const lockoutResults = await Event.aggregate(lockoutPipeline);

      for (const result of lockoutResults) {
        const username = result._id.username || 'unknown';
        const sourceIp = result._id.source_ip;

        alerts.push({
          alert_type: 'compliance_violation',
          source_ip: sourceIp,
          severity: 'high',
          count: result.count,
          first_seen: result.first_seen,
          last_seen: result.last_seen,
          description: `Account lockout event: Account ${username} was locked out ${result.count} time(s) from ${sourceIp} in the last 24 hours.`,
          created_at: new Date(),
          correlated_events: result.eventIds || [],
          attack_chain: ['account_lockout', 'compliance_violation'],
          confidence_score: 100,
          tags: ['compliance', 'account_lockout', 'policy_violation'],
        });
      }

      // Save all alerts
      for (const alertData of alerts) {
        const alert = new Alert(alertData);
        await alert.save();
        logger.warn(`Compliance Alert Created: ${alertData.source_ip} - ${alertData.description}`);
      }

      return alerts.length;
    } catch (error) {
      logger.error('Error in compliance detection:', error);
      throw error;
    }
  }
}

