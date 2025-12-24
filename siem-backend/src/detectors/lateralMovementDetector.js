import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class LateralMovementDetector extends BaseDetector {
  constructor() {
    super('LateralMovementDetector');
    this.enabled = config.detection.lateralMovementEnabled;
    this.windowMinutes = config.detection.lateralMovementWindowMinutes;
    this.hostThreshold = config.detection.lateralMovementHostThreshold;
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);
      const alerts = [];

      // Detection 1: Event ID 4648 - Explicit credentials across multiple hosts
      const explicitCredsPipeline = [
        {
          $match: {
            event_id: 4648,
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: {
              username: '$username',
              source_ip: '$source_ip',
            },
            targetHosts: { $addToSet: '$hostname' },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
          },
        },
        {
          $match: {
            $expr: {
              $gte: [
                { $size: { $filter: { input: '$targetHosts', cond: { $ne: ['$$this', null] } } } },
                this.hostThreshold,
              ],
            },
          },
        },
      ];

      const explicitCredsResults = await Event.aggregate(explicitCredsPipeline);

      for (const result of explicitCredsResults) {
        const username = result._id.username;
        const sourceIp = result._id.source_ip;
        const targetHosts = result.targetHosts.filter(Boolean);

        const existingAlert = await Alert.findOne({
          alert_type: 'lateral_movement',
          source_ip: sourceIp,
          'attack_chain': 'explicit_credentials',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'lateral_movement',
            source_ip: sourceIp,
            severity: 'critical',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Lateral movement detected: User ${username} from ${sourceIp} used explicit credentials to access ${targetHosts.length} different hosts (${targetHosts.join(', ')}) within ${this.windowMinutes} minutes. Event ID 4648.`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['explicit_credentials', 'lateral_movement'],
            confidence_score: targetHosts.length >= 5 ? 90 : 75,
            tags: ['lateral_movement', 'windows', 'explicit_credentials', 'critical'],
          });
        }
      }

      // Detection 2: RDP connections to multiple hosts
      const rdpPipeline = [
        {
          $match: {
            event_id: 4624,
            logon_type: 10, // RDP
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: {
              username: '$username',
              source_ip: '$source_ip',
            },
            targetHosts: { $addToSet: '$hostname' },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
          },
        },
        {
          $match: {
            $expr: {
              $gte: [
                { $size: { $filter: { input: '$targetHosts', cond: { $ne: ['$$this', null] } } } },
                this.hostThreshold,
              ],
            },
          },
        },
      ];

      const rdpResults = await Event.aggregate(rdpPipeline);

      for (const result of rdpResults) {
        const username = result._id.username;
        const sourceIp = result._id.source_ip;
        const targetHosts = result.targetHosts.filter(Boolean);

        const existingAlert = await Alert.findOne({
          alert_type: 'lateral_movement',
          source_ip: sourceIp,
          'attack_chain': 'rdp_lateral_movement',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'lateral_movement',
            source_ip: sourceIp,
            severity: 'high',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Lateral movement via RDP: User ${username} from ${sourceIp} established RDP connections to ${targetHosts.length} different hosts (${targetHosts.join(', ')}) within ${this.windowMinutes} minutes.`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['rdp_connection', 'lateral_movement'],
            confidence_score: targetHosts.length >= 5 ? 80 : 65,
            tags: ['lateral_movement', 'rdp', 'windows'],
          });
        }
      }

      // Detection 3: SMB/Network share access from unusual IPs
      const smbPipeline = [
        {
          $match: {
            event_id: 5145, // Network share access
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: '$source_ip',
            targetShares: { $addToSet: '$file_path' },
            hosts: { $addToSet: '$hostname' },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
            usernames: { $addToSet: '$username' },
          },
        },
        {
          $match: {
            count: { $gte: 10 }, // Multiple share accesses
            $expr: {
              $gte: [
                { $size: { $filter: { input: '$hosts', cond: { $ne: ['$$this', null] } } } },
                2,
              ],
            },
          },
        },
      ];

      const smbResults = await Event.aggregate(smbPipeline);

      for (const result of smbResults) {
        const sourceIp = result._id;
        const hosts = result.hosts.filter(Boolean);

        const existingAlert = await Alert.findOne({
          alert_type: 'lateral_movement',
          source_ip: sourceIp,
          'attack_chain': 'smb_lateral_movement',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'lateral_movement',
            source_ip: sourceIp,
            severity: 'high',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Lateral movement via SMB: IP ${sourceIp} accessed network shares on ${hosts.length} different hosts (${hosts.join(', ')}) with ${result.count} total access attempts. Users: ${result.usernames.filter(Boolean).join(', ') || 'unknown'}`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['smb_access', 'lateral_movement'],
            confidence_score: hosts.length >= 3 ? 75 : 60,
            tags: ['lateral_movement', 'smb', 'network_share', 'windows'],
          });
        }
      }

      // Save all alerts
      for (const alertData of alerts) {
        const alert = new Alert(alertData);
        await alert.save();
        logger.warn(`Lateral Movement Alert Created: ${alertData.source_ip} - ${alertData.description}`);
      }

      return alerts.length;
    } catch (error) {
      logger.error('Error in lateral movement detection:', error);
      throw error;
    }
  }
}

