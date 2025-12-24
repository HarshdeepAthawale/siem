import { BaseParser } from './baseParser.js';

export class SSHParser extends BaseParser {
  constructor() {
    super('SSHParser');
  }

  async parse(rawLog) {
    const log = rawLog.trim();
    if (!log) return null;

    // SSH log patterns
    const patterns = {
      failedPassword: /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) sshd\[(\d+)\]: Failed password for (?:invalid user )?(\S+) from (\d+\.\d+\.\d+\.\d+) port (\d+) ssh2/,
      acceptedPublickey: /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) sshd\[(\d+)\]: Accepted publickey for (\S+) from (\d+\.\d+\.\d+\.\d+) port (\d+) ssh2/,
      acceptedPassword: /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) sshd\[(\d+)\]: Accepted password for (\S+) from (\d+\.\d+\.\d+\.\d+) port (\d+) ssh2/,
    };

    let match = log.match(patterns.failedPassword);
    if (match) {
      return {
        timestamp: new Date(match[1]),
        source_ip: match[4],
        username: match[3],
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'failure',
        raw_log: log,
      };
    }

    match = log.match(patterns.acceptedPublickey);
    if (match) {
      return {
        timestamp: new Date(match[1]),
        source_ip: match[4],
        username: match[3],
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'success',
        raw_log: log,
      };
    }

    match = log.match(patterns.acceptedPassword);
    if (match) {
      return {
        timestamp: new Date(match[1]),
        source_ip: match[4],
        username: match[3],
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'success',
        raw_log: log,
      };
    }

    return null;
  }
}

