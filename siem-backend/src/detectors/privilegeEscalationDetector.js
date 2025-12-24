import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class PrivilegeEscalationDetector extends BaseDetector {
  constructor() {
    super('PrivilegeEscalationDetector');
    this.windowMinutes = config.detection.privilegeEscalationWindowMinutes;
    this.enabled = config.detection.privilegeEscalationEnabled;
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);
      const alerts = [];

      // Detection 1: Event ID 4672 - Admin logon from non-admin account
      const adminLogonPipeline = [
        {
          $match: {
            event_id: 4672,
            timestamp: { $gte: windowStart },
          },
        },
        {
          $lookup: {
            from: 'events',
            let: { username: '$username', timestamp: '$timestamp' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$username', '$$username'] },
                      { $eq: ['$event_id', 4624] }, // Successful logon
                      { $gte: ['$timestamp', { $subtract: ['$$timestamp', 300000] }] }, // Within 5 minutes
                      { $lte: ['$timestamp', '$$timestamp'] },
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],
            as: 'previous_logon',
          },
        },
        {
          $match: {
            'previous_logon.0': { $exists: true },
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

      const adminLogonResults = await Event.aggregate(adminLogonPipeline);

      for (const result of adminLogonResults) {
        const username = result._id.username;
        const sourceIp = result._id.source_ip;

        const existingAlert = await Alert.findOne({
          alert_type: 'privilege_escalation',
          source_ip: sourceIp,
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'privilege_escalation',
            source_ip: sourceIp,
            severity: 'critical',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Privilege escalation detected: User ${username} from ${sourceIp} obtained admin privileges (Event ID 4672). Privileges: ${result.privilegeList || 'N/A'}`,
            correlated_events: result.eventIds || [],
            attack_chain: ['successful_logon', 'admin_logon', 'privilege_escalation'],
            confidence_score: 85,
            tags: ['privilege_escalation', 'windows', 'critical'],
          });
        }
      }

      // Detection 2: Event ID 4648 - Explicit credentials with high privileges
      const explicitCredsPipeline = [
        {
          $match: {
            event_id: 4648,
            timestamp: { $gte: windowStart },
            privilege_list: { $exists: true, $ne: null },
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                { $regexMatch: { input: '$privilege_list', regex: /SeDebugPrivilege/i } },
                { $regexMatch: { input: '$privilege_list', regex: /SeTcbPrivilege/i } },
                { $regexMatch: { input: '$privilege_list', regex: /SeBackupPrivilege/i } },
                { $regexMatch: { input: '$privilege_list', regex: /SeRestorePrivilege/i } },
              ],
            },
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

      const explicitCredsResults = await Event.aggregate(explicitCredsPipeline);

      for (const result of explicitCredsResults) {
        const username = result._id.username;
        const sourceIp = result._id.source_ip;

        const existingAlert = await Alert.findOne({
          alert_type: 'privilege_escalation',
          source_ip: sourceIp,
          'attack_chain': 'explicit_credentials',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'privilege_escalation',
            source_ip: sourceIp,
            severity: 'critical',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Privilege escalation via explicit credentials: User ${username} from ${sourceIp} used explicit credentials with high privileges (Event ID 4648). Privileges: ${result.privilegeList}`,
            correlated_events: result.eventIds || [],
            attack_chain: ['explicit_credentials', 'privilege_escalation'],
            confidence_score: 90,
            tags: ['privilege_escalation', 'windows', 'explicit_credentials', 'critical'],
          });
        }
      }

      // Save all alerts
      for (const alertData of alerts) {
        const alert = new Alert(alertData);
        await alert.save();
        logger.warn(`Privilege Escalation Alert Created: ${alertData.source_ip} - ${alertData.description}`);
      }

      return alerts.length;
    } catch (error) {
      logger.error('Error in privilege escalation detection:', error);
      throw error;
    }
  }
}

