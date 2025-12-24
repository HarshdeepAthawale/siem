import { logger } from '../utils/logger.js';

export class Normalizer {
  static normalize(parsedEvent) {
    if (!parsedEvent) {
      return null;
    }

    // Ensure all required fields are present
    const normalized = {
      timestamp: parsedEvent.timestamp || new Date(),
      source_ip: parsedEvent.source_ip || '0.0.0.0',
      destination_ip: parsedEvent.destination_ip || null,
      username: parsedEvent.username || null,
      event_type: parsedEvent.event_type || 'unknown',
      service: parsedEvent.service || 'unknown',
      status: parsedEvent.status || 'unknown',
      severity: parsedEvent.severity || this.calculateSeverity(parsedEvent),
      raw_log: parsedEvent.raw_log || '',
      ingestion_time: new Date(),
    };

    return normalized;
  }

  static calculateSeverity(event) {
    // Default severity calculation
    if (event.status === 'failure' && event.event_type === 'ssh_login') {
      return 'high';
    }
    if (event.status === 'failure' && event.event_type === 'http_request') {
      return 'medium';
    }
    if (event.status === 'success') {
      return 'low';
    }
    return 'low';
  }
}

