import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class SSHBruteForceDetector extends BaseDetector {
  constructor() {
    super('SSHBruteForceDetector');
    this.threshold = config.detection.sshBruteForceThreshold;
    this.windowMinutes = config.detection.sshBruteForceWindowMinutes;
  }

  async detect() {
    try {
      const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);

      // MongoDB aggregation pipeline for SSH brute force detection
      const pipeline = [
        {
          $match: {
            event_type: 'ssh_login',
            status: 'failure',
            timestamp: { $gte: windowStart },
          },
        },
        {
          $group: {
            _id: '$source_ip',
            count: { $sum: 1 },
            first_seen: { $min: '$timestamp' },
            last_seen: { $max: '$timestamp' },
            usernames: { $addToSet: '$username' },
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
          alert_type: 'ssh_brute_force',
          source_ip: sourceIp,
          created_at: { $gte: windowStart },
        });

        if (!existingAlert) {
          // Create new alert
          const alert = new Alert({
            alert_type: 'ssh_brute_force',
            source_ip: sourceIp,
            severity: count >= this.threshold * 2 ? 'critical' : 'high',
            count: count,
            first_seen: result.first_seen,
            last_seen: result.last_seen,
            description: `SSH brute force attack detected from ${sourceIp}. ${count} failed login attempts in the last ${this.windowMinutes} minutes. Attempted usernames: ${result.usernames.filter(Boolean).join(', ') || 'various'}`,
            created_at: new Date(),
          });

          await alert.save();
          logger.warn(`SSH Brute Force Alert Created: ${sourceIp} - ${count} attempts`);
        } else {
          // Update existing alert
          existingAlert.count = count;
          existingAlert.last_seen = result.last_seen;
          existingAlert.severity = count >= this.threshold * 2 ? 'critical' : 'high';
          await existingAlert.save();
        }
      }

      return results.length;
    } catch (error) {
      logger.error('Error in SSH brute force detection:', error);
      throw error;
    }
  }
}

