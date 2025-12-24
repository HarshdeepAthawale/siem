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
      // Windows Event Log fields
      event_id: parsedEvent.event_id || null,
      logon_type: parsedEvent.logon_type || null,
      process_name: parsedEvent.process_name || null,
      command_line: parsedEvent.command_line || null,
      target_username: parsedEvent.target_username || null,
      privilege_list: parsedEvent.privilege_list || null,
      file_path: parsedEvent.file_path || null,
      registry_key: parsedEvent.registry_key || null,
      hostname: parsedEvent.hostname || null,
      domain: parsedEvent.domain || null,
    };

    return normalized;
  }

  static calculateSeverity(event) {
    // Windows Event Log severity mapping
    if (event.event_id) {
      switch (event.event_id) {
        case 4625: // Failed logon
          return 'high';
        case 4672: // Admin logon
          return 'high';
        case 4648: // Explicit credentials
          return 'critical';
        case 4688: // Process creation
          // Check if suspicious process
          if (this.isSuspiciousProcess(event.process_name, event.command_line)) {
            return 'high';
          }
          return 'medium';
        case 5145: // Network share access
          // Check if sensitive file
          if (this.isSensitiveFile(event.file_path)) {
            return 'high';
          }
          return 'medium';
        case 4657: // Registry modification
          return 'high';
        case 4624: // Successful logon
          // Check logon type - RDP (10) is more suspicious
          if (event.logon_type === 10) {
            return 'medium';
          }
          return 'low';
        default:
          return 'medium';
      }
    }

    // Legacy severity calculation
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

  static isSuspiciousProcess(processName, commandLine) {
    if (!processName && !commandLine) return false;

    const suspiciousPatterns = [
      /powershell.*-enc/i,
      /powershell.*-e\s/i,
      /cmd\.exe.*\/c/i,
      /wscript\.exe/i,
      /cscript\.exe/i,
      /rundll32\.exe/i,
      /regsvr32\.exe/i,
      /mshta\.exe/i,
      /temp/i,
      /appdata.*local.*temp/i,
    ];

    const checkString = `${processName || ''} ${commandLine || ''}`.toLowerCase();

    return suspiciousPatterns.some(pattern => pattern.test(checkString));
  }

  static isSensitiveFile(filePath) {
    if (!filePath) return false;

    const sensitivePatterns = [
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
    ];

    return sensitivePatterns.some(pattern => pattern.test(filePath));
  }
}


