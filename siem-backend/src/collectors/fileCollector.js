import { BaseCollector } from './baseCollector.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileCollector extends BaseCollector {
  constructor(filePath, parser) {
    super('FileCollector');
    this.filePath = filePath;
    this.parser = parser;
    this.onEventCallback = null;
  }

  onEvent(callback) {
    this.onEventCallback = callback;
  }

  async start() {
    await super.start();
    
    if (!fs.existsSync(this.filePath)) {
      logger.warn(`Log file not found: ${this.filePath}, creating sample file`);
      this.createSampleLogFile();
    }

    this.watchFile();
  }

  createSampleLogFile() {
    const sampleLogs = [
      '2024-01-15 10:23:45 sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 54321 ssh2',
      '2024-01-15 10:23:47 sshd[1235]: Failed password for invalid user root from 192.168.1.100 port 54322 ssh2',
      '2024-01-15 10:23:49 sshd[1236]: Failed password for invalid user admin from 192.168.1.100 port 54323 ssh2',
      '2024-01-15 10:23:51 sshd[1237]: Failed password for invalid user test from 192.168.1.100 port 54324 ssh2',
      '2024-01-15 10:23:53 sshd[1238]: Failed password for invalid user admin from 192.168.1.100 port 54325 ssh2',
      '2024-01-15 10:23:55 sshd[1239]: Failed password for invalid user root from 192.168.1.100 port 54326 ssh2',
      '2024-01-15 10:24:01 sshd[1240]: Accepted publickey for user admin from 10.0.0.5 port 54327 ssh2',
      '2024-01-15 10:24:05 httpd[2001]: GET /api/users HTTP/1.1 200 - 10.0.0.10',
      '2024-01-15 10:24:10 httpd[2002]: GET /api/admin HTTP/1.1 401 - 192.168.1.200',
    ];

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, sampleLogs.join('\n') + '\n');
  }

  async watchFile() {
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
          logger.error(`Error parsing line: ${line}`, error);
        }
      }
    }

    // Watch for new lines (simple tail-like behavior)
    const watcher = fs.watchFile(this.filePath, { interval: 1000 }, async (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        const stream = fs.createReadStream(this.filePath, { start: prev.size });
        const rl = readline.createInterface({ input: stream });
        
        for await (const line of rl) {
          if (line.trim() && this.onEventCallback) {
            try {
              const parsed = await this.parser.parse(line);
              if (parsed) {
                await this.onEventCallback(parsed);
              }
            } catch (error) {
              logger.error(`Error parsing line: ${line}`, error);
            }
          }
        }
      }
    });
  }
}

