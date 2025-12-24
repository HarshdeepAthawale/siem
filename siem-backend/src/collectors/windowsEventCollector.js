import { BaseCollector } from './baseCollector.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WindowsEventCollector extends BaseCollector {
  constructor(filePath, parser) {
    super('WindowsEventCollector');
    this.filePath = filePath;
    this.parser = parser;
    this.onEventCallback = null;
    this.watchInterval = null;
  }

  onEvent(callback) {
    this.onEventCallback = callback;
  }

  async start() {
    await super.start();

    if (!fs.existsSync(this.filePath)) {
      logger.warn(`Windows Event Log file not found: ${this.filePath}, creating sample file`);
      this.createSampleLogFile();
    }

    // Read existing file
    await this.readFile();

    // Watch for new lines
    this.watchFile();
  }

  createSampleLogFile() {
    const sampleLogs = [
      // Event ID 4625 - Failed logon (RDP - Logon Type 10)
      '<Event><System><EventID>4625</EventID><TimeCreated SystemTime="2024-01-15T10:23:45.123Z"/></System><EventData><Data Name="TargetUserName">admin</Data><Data Name="IpAddress">192.168.1.100</Data><Data Name="LogonType">10</Data></EventData></Event>',
      '<Event><System><EventID>4625</EventID><TimeCreated SystemTime="2024-01-15T10:23:47.456Z"/></System><EventData><Data Name="TargetUserName">root</Data><Data Name="IpAddress">192.168.1.100</Data><Data Name="LogonType">10</Data></EventData></Event>',
      // Event ID 4624 - Successful logon
      '<Event><System><EventID>4624</EventID><TimeCreated SystemTime="2024-01-15T10:24:01.789Z"/></System><EventData><Data Name="TargetUserName">admin</Data><Data Name="IpAddress">10.0.0.5</Data><Data Name="LogonType">2</Data></EventData></Event>',
      // Event ID 4672 - Admin logon (privilege escalation)
      '<Event><System><EventID>4672</EventID><TimeCreated SystemTime="2024-01-15T10:24:05.012Z"/></System><EventData><Data Name="SubjectUserName">admin</Data><Data Name="PrivilegeList">SeSecurityPrivilege SeBackupPrivilege</Data></EventData></Event>',
      // Event ID 4688 - Process creation
      '<Event><System><EventID>4688</EventID><TimeCreated SystemTime="2024-01-15T10:24:10.345Z"/></System><EventData><Data Name="NewProcessName">C:\\Windows\\System32\\cmd.exe</Data><Data Name="CommandLine">cmd.exe /c dir</Data></EventData></Event>',
      // Event ID 5145 - Network share access
      '<Event><System><EventID>5145</EventID><TimeCreated SystemTime="2024-01-15T10:24:15.678Z"/></System><EventData><Data Name="ObjectName">\\\\server\\share\\sensitive\\file.txt</Data><Data Name="SubjectUserName">admin</Data></EventData></Event>',
    ];

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, sampleLogs.join('\n') + '\n');
  }

  async readFile() {
    try {
      const rl = readline.createInterface({
        input: fs.createReadStream(this.filePath),
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.trim() && this.onEventCallback) {
          try {
            const parsed = await this.parser.parse(line);
            if (parsed) {
              await this.onEventCallback(parsed);
            }
          } catch (error) {
            logger.error(`Error parsing Windows Event Log line: ${line}`, error);
          }
        }
      }
    } catch (error) {
      logger.error(`Error reading Windows Event Log file: ${this.filePath}`, error);
    }
  }

  watchFile() {
    let lastSize = fs.statSync(this.filePath).size;

    this.watchInterval = setInterval(async () => {
      try {
        const stats = fs.statSync(this.filePath);
        if (stats.size > lastSize) {
          const stream = fs.createReadStream(this.filePath, { start: lastSize });
          const rl = readline.createInterface({ input: stream });

          for await (const line of rl) {
            if (line.trim() && this.onEventCallback) {
              try {
                const parsed = await this.parser.parse(line);
                if (parsed) {
                  await this.onEventCallback(parsed);
                }
              } catch (error) {
                logger.error(`Error parsing Windows Event Log line: ${line}`, error);
              }
            }
          }

          lastSize = stats.size;
        }
      } catch (error) {
        logger.error(`Error watching Windows Event Log file: ${this.filePath}`, error);
      }
    }, 1000); // Check every second
  }

  async stop() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    await super.stop();
  }
}

