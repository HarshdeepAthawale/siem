import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class DataExfiltrationDetector extends BaseDetector {
  constructor() {
    super('DataExfiltrationDetector');
    this.enabled = config.detection.dataExfiltrationEnabled;
    this.sizeThreshold = config.detection.dataExfiltrationSizeThreshold;
    this.windowMinutes = config.detection.dataExfiltrationWindowMinutes;
    this.sensitivePatterns = [
      /sensitive/i,
      /confidential/i,
      /secret/i,
      /password/i,
      /credential/i,
      /\.pwd$/i,
      /\.key$/i,
      /\.pem$/i,
      /database/i,
      /backup/i,
      /\.db$/i,
      /\.sql$/i,
    ];
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);
      const alerts = [];

      // Detection 1: Large file transfers via network share (Event ID 5145)
      const largeFilePipeline = [
        {
          $match: {
            event_id: 5145, // Network share access
            timestamp: { $gte: windowStart },
            file_path: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: {
              source_ip: '$source_ip',
              username: '$username',
            },
            filePaths: { $push: '$file_path' },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
            hosts: { $addToSet: '$hostname' },
          },
        },
        {
          $match: {
            count: { $gte: 5 }, // Multiple file accesses
          },
        },
      ];

      const largeFileResults = await Event.aggregate(largeFilePipeline);

      for (const result of largeFileResults) {
        const sourceIp = result._id.source_ip;
        const username = result._id.username;
        const sensitiveFiles = result.filePaths.filter(path =>
          this.sensitivePatterns.some(pattern => pattern.test(path))
        );

        if (sensitiveFiles.length > 0 || result.count >= 20) {
          const existingAlert = await Alert.findOne({
            alert_type: 'data_exfiltration',
            source_ip: sourceIp,
            created_at: { $gte: windowStart },
            false_positive: false,
          });

          if (!existingAlert) {
            const description = sensitiveFiles.length > 0
              ? `Data exfiltration detected: User ${username} from ${sourceIp} accessed ${sensitiveFiles.length} sensitive files (${sensitiveFiles.slice(0, 3).join(', ')}${sensitiveFiles.length > 3 ? '...' : ''}) via network shares. Total accesses: ${result.count}`
              : `Potential data exfiltration: User ${username} from ${sourceIp} accessed ${result.count} files via network shares within ${this.windowMinutes} minutes.`;

            alerts.push({
              alert_type: 'data_exfiltration',
              source_ip: sourceIp,
              severity: sensitiveFiles.length > 0 ? 'critical' : 'high',
              count: result.count,
              first_seen: result.first_seen,
              last_seen: result.last_seen,
              description,
              created_at: new Date(),
              correlated_events: result.eventIds || [],
              attack_chain: ['network_share_access', 'data_access', 'potential_exfiltration'],
              confidence_score: sensitiveFiles.length > 0 ? 85 : 70,
              tags: ['data_exfiltration', 'network_share', 'windows', sensitiveFiles.length > 0 ? 'sensitive_data' : 'bulk_access'],
            });
          }
        }
      }

      // Detection 2: Unusual data access patterns (access outside business hours)
      const businessHoursPipeline = [
        {
          $match: {
            event_id: 5145,
            timestamp: { $gte: windowStart },
          },
        },
        {
          $addFields: {
            hour: { $hour: '$timestamp' },
          },
        },
        {
          $match: {
            $or: [
              { hour: { $lt: 8 } }, // Before 8 AM
              { hour: { $gte: 18 } }, // After 6 PM
            ],
          },
        },
        {
          $group: {
            _id: {
              source_ip: '$source_ip',
              username: '$username',
            },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
            filePaths: { $addToSet: '$file_path' },
          },
        },
        {
          $match: {
            count: { $gte: 5 },
          },
        },
      ];

      const businessHoursResults = await Event.aggregate(businessHoursPipeline);

      for (const result of businessHoursResults) {
        const sourceIp = result._id.source_ip;
        const username = result._id.username;

        const existingAlert = await Alert.findOne({
          alert_type: 'data_exfiltration',
          source_ip: sourceIp,
          'attack_chain': 'after_hours_access',
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          alerts.push({
            alert_type: 'data_exfiltration',
            source_ip: sourceIp,
            severity: 'high',
            count: result.count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `Unusual data access pattern: User ${username} from ${sourceIp} accessed ${result.count} files via network shares outside business hours (before 8 AM or after 6 PM).`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['after_hours_access', 'unusual_pattern', 'potential_exfiltration'],
            confidence_score: 65,
            tags: ['data_exfiltration', 'unusual_pattern', 'after_hours', 'windows'],
          });
        }
      }

      // Detection 3: External connections with data transfer indicators
      const externalPipeline = [
        {
          $match: {
            $or: [
              { event_id: 5145 },
              { event_id: 4624, logon_type: 3 }, // Network logon
            ],
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: '$source_ip',
            eventTypes: { $addToSet: '$event_id' },
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            eventIds: { $push: '$_id' },
            usernames: { $addToSet: '$username' },
          },
        },
        {
          $match: {
            $expr: {
              $and: [
                { $in: [5145, '$eventTypes'] },
                { $gte: ['$count', 10] },
              ],
            },
          },
        },
      ];

      const externalResults = await Event.aggregate(externalPipeline);

      for (const result of externalResults) {
        const sourceIp = result._id;

        // Check if IP is external (simple check - not RFC1918)
        const isExternal = !this.isPrivateIP(sourceIp);

        if (isExternal) {
          const existingAlert = await Alert.findOne({
            alert_type: 'data_exfiltration',
            source_ip: sourceIp,
            'attack_chain': 'external_connection',
            created_at: { $gte: windowStart },
            false_positive: false,
          });

          if (!existingAlert) {
            alerts.push({
              alert_type: 'data_exfiltration',
              source_ip: sourceIp,
              severity: 'high',
              count: result.count,
              first_seen: result.first_seen,
              last_seen: result.last_seen,
              description: `Potential data exfiltration to external IP: ${sourceIp} accessed network shares with ${result.count} events. Users: ${result.usernames.filter(Boolean).join(', ') || 'unknown'}`,
              created_at: new Date(),
              correlated_events: result.eventIds || [],
              attack_chain: ['external_connection', 'network_share_access', 'potential_exfiltration'],
              confidence_score: 70,
              tags: ['data_exfiltration', 'external_ip', 'network_share', 'windows'],
            });
          }
        }
      }

      // Save all alerts
      for (const alertData of alerts) {
        const alert = new Alert(alertData);
        await alert.save();
        logger.warn(`Data Exfiltration Alert Created: ${alertData.source_ip} - ${alertData.description}`);
      }

      return alerts.length;
    } catch (error) {
      logger.error('Error in data exfiltration detection:', error);
      throw error;
    }
  }

  isPrivateIP(ip) {
    if (!ip) return false;
    // RFC 1918 private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
    ];
    return privateRanges.some(range => range.test(ip));
  }
}

