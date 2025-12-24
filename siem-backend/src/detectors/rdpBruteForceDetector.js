import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class RDPBruteForceDetector extends BaseDetector {
  constructor() {
    super('RDPBruteForceDetector');
    this.threshold = config.detection.rdpBruteForceThreshold;
    this.windowMinutes = config.detection.rdpBruteForceWindowMinutes;
    this.enabled = config.detection.rdpBruteForceEnabled;
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);

      // MongoDB aggregation pipeline for RDP brute force detection
      // Event ID 4625 = Failed logon, Logon Type 10 = RDP
      const pipeline = [
        {
          $match: {
            event_id: 4625,
            logon_type: 10,
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: '$source_ip',
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            usernames: { $addToSet: '$target_username' },
            eventIds: { $push: '$_id' },
          },
        },
        {
          $match: {
            count: { $gte: this.threshold },
          },
        },
      ];

      const results = await Event.aggregate(pipeline);

      for (const result of results) {
        const sourceIp = result._id;
        const count = result.count;

        // Check if alert already exists for this IP in the time window
        const existingAlert = await Alert.findOne({
          alert_type: 'rdp_brute_force',
          source_ip: sourceIp,
          created_at: { $gte: windowStart },
          false_positive: false,
        });

        if (!existingAlert) {
          // Create new alert
          const alert = new Alert({
            alert_type: 'rdp_brute_force',
            source_ip: sourceIp,
            severity: count >= this.threshold * 2 ? 'critical' : 'high',
            count: count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `RDP brute force attack detected from ${sourceIp}. ${count} failed RDP login attempts (Event ID 4625, Logon Type 10) in the last ${this.windowMinutes} minutes. Attempted usernames: ${result.usernames.filter(Boolean).join(', ') || 'various'}`,
            created_at: new Date(),
            correlated_events: result.eventIds || [],
            attack_chain: ['failed_logon', 'rdp_brute_force'],
            confidence_score: count >= this.threshold * 2 ? 90 : 75,
            tags: ['brute_force', 'rdp', 'windows'],
          });

          await alert.save();
          logger.warn(`RDP Brute Force Alert Created: ${sourceIp} - ${count} attempts`);
        } else {
          // Update existing alert
          existingAlert.count = count;
          existingAlert.last_seen = result.last_seen;
          existingAlert.severity = count >= this.threshold * 2 ? 'critical' : 'high';
          existingAlert.confidence_score = count >= this.threshold * 2 ? 90 : 75;
          existingAlert.correlated_events = result.eventIds || [];
          await existingAlert.save();
        }
      }

      return results.length;
    } catch (error) {
      logger.error('Error in RDP brute force detection:', error);
      throw error;
    }
  }
}

