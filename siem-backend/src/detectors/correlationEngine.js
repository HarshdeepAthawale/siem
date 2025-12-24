import { BaseDetector } from './baseDetector.js';
import { Event } from '../database/models/Event.js';
import { Alert } from '../database/models/Alert.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

// Correlation state model
const correlationStateSchema = new mongoose.Schema({
  source_ip: String,
  username: String,
  state: String,
  events: [mongoose.Schema.Types.ObjectId],
  first_seen: Date,
  last_seen: Date,
}, { collection: 'correlation_states', timestamps: false });

let CorrelationState;
try {
  CorrelationState = mongoose.models.CorrelationState;
} catch (e) {
  CorrelationState = mongoose.model('CorrelationState', correlationStateSchema);
}

export class CorrelationEngine extends BaseDetector {
  constructor() {
    super('CorrelationEngine');
    this.enabled = config.detection.correlationEnabled;
    this.windowMinutes = config.detection.correlationWindowMinutes;
    this.correlationRules = [
      {
        name: 'brute_force_to_success',
        pattern: ['failed_logon', 'successful_logon'],
        severity: 'high',
      },
      {
        name: 'successful_logon_to_privilege_escalation',
        pattern: ['successful_logon', 'admin_logon'],
        severity: 'critical',
      },
      {
        name: 'privilege_escalation_to_lateral_movement',
        pattern: ['admin_logon', 'explicit_credentials'],
        severity: 'critical',
      },
      {
        name: 'process_creation_to_data_transfer',
        pattern: ['process_creation', 'network_share_access'],
        severity: 'high',
      },
    ];
  }

  async detect() {
    if (!this.enabled) {
      return 0;
    }

    try {
      const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);
      const alerts = [];

      // Get all recent events
      const events = await Event.find({
        timestamp: { $gte: windowStart },
      }).sort({ timestamp: 1 });

      // Group events by source IP and username
      const eventGroups = new Map();
      for (const event of events) {
        const key = `${event.source_ip}:${event.username || 'unknown'}`;
        if (!eventGroups.has(key)) {
          eventGroups.set(key, []);
        }
        eventGroups.get(key).push(event);
      }

      // Check correlation rules for each group
      for (const [key, groupEvents] of eventGroups) {
        const [sourceIp, username] = key.split(':');

        for (const rule of this.correlationRules) {
          const matched = this.checkCorrelationRule(groupEvents, rule);
          if (matched) {
            const existingAlert = await Alert.findOne({
              alert_type: 'correlated_attack',
              source_ip: sourceIp,
              'attack_chain': rule.name,
              created_at: { $gte: windowStart },
              false_positive: false,
            });

            if (!existingAlert) {
              const eventIds = matched.map(m => m._id);
              alerts.push({
                alert_type: 'correlated_attack',
                source_ip: sourceIp,
                severity: rule.severity,
                count: matched.length,
                first_seen: matched[0].timestamp,
                last_seen: matched[matched.length - 1].timestamp,
                description: `Correlated attack chain detected: ${rule.name}. Pattern: ${rule.pattern.join(' → ')}. User: ${username || 'unknown'}`,
                created_at: new Date(),
                correlated_events: eventIds,
                attack_chain: [rule.name, ...rule.pattern],
                confidence_score: 85,
                tags: ['correlation', 'attack_chain', ...rule.pattern],
              });
            }
          }
        }
      }

      // Save all alerts
      for (const alertData of alerts) {
        const alert = new Alert(alertData);
        await alert.save();
        logger.warn(`Correlation Alert Created: ${alertData.source_ip} - ${alertData.description}`);
      }

      return alerts.length;
    } catch (error) {
      logger.error('Error in correlation engine:', error);
      throw error;
    }
  }

  checkCorrelationRule(events, rule) {
    const pattern = rule.pattern;
    const matched = [];
    let patternIndex = 0;

    for (const event of events) {
      const eventType = this.mapEventToPattern(event);
      if (eventType === pattern[patternIndex]) {
        matched.push(event);
        patternIndex++;
        if (patternIndex >= pattern.length) {
          return matched;
        }
      }
    }

    return null;
  }

  mapEventToPattern(event) {
    if (event.event_id === 4625 || (event.event_type === 'ssh_login' && event.status === 'failure')) {
      return 'failed_logon';
    }
    if (event.event_id === 4624 || (event.event_type === 'ssh_login' && event.status === 'success')) {
      return 'successful_logon';
    }
    if (event.event_id === 4672) {
      return 'admin_logon';
    }
    if (event.event_id === 4648) {
      return 'explicit_credentials';
    }
    if (event.event_id === 4688) {
      return 'process_creation';
    }
    if (event.event_id === 5145) {
      return 'network_share_access';
    }
    return null;
  }
}

