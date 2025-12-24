import { logger } from '../utils/logger.js';

export class BaseCollector {
  constructor(name) {
    this.name = name;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    logger.info(`Collector ${this.name} started`);
  }

  async stop() {
    this.isRunning = false;
    logger.info(`Collector ${this.name} stopped`);
  }

  async collect(rawLog) {
    throw new Error('collect() must be implemented by subclass');
  }
}

