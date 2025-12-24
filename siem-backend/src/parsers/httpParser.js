import { BaseParser } from './baseParser.js';

export class HTTPParser extends BaseParser {
  constructor() {
    super('HTTPParser');
  }

  async parse(rawLog) {
    const log = rawLog.trim();
    if (!log) return null;

    // HTTP log pattern: timestamp httpd[pid]: METHOD /path HTTP/1.1 status - source_ip
    const pattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) httpd\[(\d+)\]: (\w+) (\S+) HTTP\/[\d.]+ (\d+) - (\d+\.\d+\.\d+\.\d+)/;

    const match = log.match(pattern);
    if (match) {
      const statusCode = parseInt(match[5], 10);
      const status = statusCode >= 200 && statusCode < 400 ? 'success' : 'failure';
      const severity = statusCode === 401 || statusCode === 403 ? 'high' : 
                      statusCode >= 500 ? 'medium' : 'low';

      return {
        timestamp: new Date(match[1]),
        source_ip: match[6],
        destination_ip: null,
        event_type: 'http_request',
        service: 'httpd',
        status: status,
        severity: severity,
        raw_log: log,
      };
    }

    return null;
  }
}

