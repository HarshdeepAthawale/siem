import { BaseParser } from './baseParser.js';

// Windows Event Log Logon Types
const LOGON_TYPES = {
  2: 'Interactive',
  3: 'Network',
  4: 'Batch',
  5: 'Service',
  7: 'Unlock',
  8: 'NetworkCleartext',
  9: 'NewCredentials',
  10: 'RemoteInteractive', // RDP
  11: 'CachedInteractive',
};

// Windows Event IDs mapping
const EVENT_TYPES = {
  4624: 'windows_logon_success',
  4625: 'windows_logon_failure',
  4672: 'windows_admin_logon',
  4648: 'windows_explicit_credentials',
  4688: 'windows_process_creation',
  5145: 'windows_network_share',
  4657: 'windows_registry_modification',
  4768: 'windows_kerberos_tgt',
  4769: 'windows_kerberos_service',
};

export class WindowsEventParser extends BaseParser {
  constructor() {
    super('WindowsEventParser');
  }

  async parse(rawLog) {
    const log = rawLog.trim();
    if (!log) return null;

    // Try XML format first (Windows Event Log XML export)
    const xmlResult = this.parseXML(log);
    if (xmlResult) return xmlResult;

    // Try CSV format (PowerShell Export-Csv)
    const csvResult = this.parseCSV(log);
    if (csvResult) return csvResult;

    // Try plain text format
    const textResult = this.parseText(log);
    if (textResult) return textResult;

    return null;
  }

  parseXML(xmlString) {
    try {
      // Simple XML parsing for Windows Event Log format
      // Format: <Event><System><EventID>4624</EventID>...
      const eventIdMatch = xmlString.match(/<EventID[^>]*>(\d+)<\/EventID>/i);
      if (!eventIdMatch) return null;

      const eventId = parseInt(eventIdMatch[1], 10);
      if (!EVENT_TYPES[eventId]) return null;

      const timeCreatedMatch = xmlString.match(/<TimeCreated[^>]*SystemTime="([^"]+)"/i);
      const timestamp = timeCreatedMatch ? new Date(timeCreatedMatch[1]) : new Date();

      const eventData = this.extractEventDataXML(xmlString, eventId);

      return {
        timestamp,
        event_id: eventId,
        event_type: EVENT_TYPES[eventId],
        source_ip: eventData.sourceIp || '0.0.0.0',
        destination_ip: eventData.destinationIp || null,
        username: eventData.username || null,
        target_username: eventData.targetUsername || null,
        logon_type: eventData.logonType || null,
        process_name: eventData.processName || null,
        command_line: eventData.commandLine || null,
        privilege_list: eventData.privilegeList || null,
        file_path: eventData.filePath || null,
        registry_key: eventData.registryKey || null,
        hostname: eventData.hostname || null,
        domain: eventData.domain || null,
        service: 'windows_event_log',
        status: this.determineStatus(eventId, eventData),
        raw_log: xmlString,
      };
    } catch (error) {
      return null;
    }
  }

  parseCSV(csvLine) {
    try {
      // CSV format: TimeGenerated,EventID,Level,Message,...
      const parts = csvLine.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 2) return null;

      const eventId = parseInt(parts[1], 10);
      if (!eventId || !EVENT_TYPES[eventId]) return null;

      const timestamp = parts[0] ? new Date(parts[0]) : new Date();
      const message = parts[3] || csvLine;

      const eventData = this.extractEventDataCSV(message, eventId);

      return {
        timestamp,
        event_id: eventId,
        event_type: EVENT_TYPES[eventId],
        source_ip: eventData.sourceIp || '0.0.0.0',
        destination_ip: eventData.destinationIp || null,
        username: eventData.username || null,
        target_username: eventData.targetUsername || null,
        logon_type: eventData.logonType || null,
        process_name: eventData.processName || null,
        command_line: eventData.commandLine || null,
        privilege_list: eventData.privilegeList || null,
        file_path: eventData.filePath || null,
        registry_key: eventData.registryKey || null,
        hostname: eventData.hostname || null,
        domain: eventData.domain || null,
        service: 'windows_event_log',
        status: this.determineStatus(eventId, eventData),
        raw_log: csvLine,
      };
    } catch (error) {
      return null;
    }
  }

  parseText(textLine) {
    try {
      // Text format: EventID 4624, Logon Type: 10, Account: DOMAIN\username
      // Or: 4624 - An account was successfully logged on. Account Name: username
      const eventIdMatch = textLine.match(/Event[_\s]*ID[:\s]*(\d+)|^(\d{4})\s*-/i);
      if (!eventIdMatch) return null;

      const eventId = parseInt(eventIdMatch[1] || eventIdMatch[2], 10);
      if (!eventId || !EVENT_TYPES[eventId]) return null;

      const eventData = this.extractEventDataText(textLine, eventId);

      return {
        timestamp: new Date(),
        event_id: eventId,
        event_type: EVENT_TYPES[eventId],
        source_ip: eventData.sourceIp || '0.0.0.0',
        destination_ip: eventData.destinationIp || null,
        username: eventData.username || null,
        target_username: eventData.targetUsername || null,
        logon_type: eventData.logonType || null,
        process_name: eventData.processName || null,
        command_line: eventData.commandLine || null,
        privilege_list: eventData.privilegeList || null,
        file_path: eventData.filePath || null,
        registry_key: eventData.registryKey || null,
        hostname: eventData.hostname || null,
        domain: eventData.domain || null,
        service: 'windows_event_log',
        status: this.determineStatus(eventId, eventData),
        raw_log: textLine,
      };
    } catch (error) {
      return null;
    }
  }

  extractEventDataXML(xmlString, eventId) {
    const data = {};

    // Extract common fields from EventData section
    const eventDataMatch = xmlString.match(/<EventData[^>]*>([\s\S]*?)<\/EventData>/i);
    if (eventDataMatch) {
      const eventData = eventDataMatch[1];

      // Extract Data elements
      const dataElements = eventData.match(/<Data[^>]*Name="([^"]+)"[^>]*>([^<]*)<\/Data>/gi) || [];
      for (const elem of dataElements) {
        const nameMatch = elem.match(/Name="([^"]+)"/i);
        const valueMatch = elem.match(/>([^<]+)</i);
        if (nameMatch && valueMatch) {
          const name = nameMatch[1].toLowerCase();
          const value = valueMatch[1].trim();

          switch (name) {
            case 'targetusername':
            case 'targetusername':
              data.targetUsername = value;
              break;
            case 'subjectusername':
            case 'subjectusername':
              data.username = value;
              break;
            case 'ipaddress':
            case 'ipaddress':
              if (!data.sourceIp) data.sourceIp = value;
              break;
            case 'ipaddress':
              data.destinationIp = value;
              break;
            case 'logontype':
              data.logonType = parseInt(value, 10);
              break;
            case 'processname':
            case 'newprocessname':
              data.processName = value;
              break;
            case 'commandline':
            case 'processcommandline':
              data.commandLine = value;
              break;
            case 'privilegelist':
              data.privilegeList = value;
              break;
            case 'objectname':
              if (eventId === 5145) data.filePath = value;
              break;
            case 'objectname':
              if (eventId === 4657) data.registryKey = value;
              break;
            case 'workstationname':
            case 'computername':
              data.hostname = value;
              break;
            case 'targetdomainname':
            case 'domain':
              data.domain = value;
              break;
          }
        }
      }
    }

    // Extract source IP from common patterns
    if (!data.sourceIp) {
      const ipMatch = xmlString.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (ipMatch) data.sourceIp = ipMatch[1];
    }

    return data;
  }

  extractEventDataCSV(message, eventId) {
    const data = {};

    // Extract IP addresses
    const ipMatch = message.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
    if (ipMatch) {
      data.sourceIp = ipMatch[0];
      if (ipMatch.length > 1) data.destinationIp = ipMatch[1];
    }

    // Extract username patterns
    const userMatch = message.match(/(?:Account|User|Subject)[\s:]+(?:Name|)[\s:]+([^\s,]+)/i);
    if (userMatch) data.username = userMatch[1];

    // Extract logon type
    const logonTypeMatch = message.match(/Logon[_\s]*Type[:\s]*(\d+)/i);
    if (logonTypeMatch) data.logonType = parseInt(logonTypeMatch[1], 10);

    // Extract process name
    const processMatch = message.match(/(?:Process|Image|New[_\s]*Process)[\s:]+Name[:\s]+([^\s,]+)/i);
    if (processMatch) data.processName = processMatch[1];

    // Extract command line
    const cmdMatch = message.match(/(?:Command[_\s]*Line|Process[_\s]*Command[_\s]*Line)[:\s]+(.+?)(?:$|,)/i);
    if (cmdMatch) data.commandLine = cmdMatch[1].trim();

    return data;
  }

  extractEventDataText(textLine, eventId) {
    const data = {};

    // Extract IP addresses
    const ipMatch = textLine.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
    if (ipMatch) {
      data.sourceIp = ipMatch[0];
      if (ipMatch.length > 1) data.destinationIp = ipMatch[1];
    }

    // Extract username (DOMAIN\username or username)
    const userMatch = textLine.match(/(?:Account|User|Subject)[\s:]+(?:Name|)[\s:]+([^\\\s,]+(?:\\[^\s,]+)?)/i);
    if (userMatch) {
      const userStr = userMatch[1];
      if (userStr.includes('\\')) {
        const [domain, username] = userStr.split('\\');
        data.domain = domain;
        data.username = username;
      } else {
        data.username = userStr;
      }
    }

    // Extract logon type
    const logonTypeMatch = textLine.match(/Logon[_\s]*Type[:\s]*(\d+)/i);
    if (logonTypeMatch) data.logonType = parseInt(logonTypeMatch[1], 10);

    // Extract process name
    const processMatch = textLine.match(/(?:Process|Image)[\s:]+Name[:\s]+([^\s,]+)/i);
    if (processMatch) data.processName = processMatch[1];

    // Extract command line
    const cmdMatch = textLine.match(/(?:Command[_\s]*Line)[:\s]+(.+?)(?:$|,)/i);
    if (cmdMatch) data.commandLine = cmdMatch[1].trim();

    return data;
  }

  determineStatus(eventId, eventData) {
    switch (eventId) {
      case 4624:
      case 4672:
      case 4768:
      case 4769:
        return 'success';
      case 4625:
        return 'failure';
      case 4648:
      case 4688:
      case 5145:
      case 4657:
        return 'unknown';
      default:
        return 'unknown';
    }
  }
}

