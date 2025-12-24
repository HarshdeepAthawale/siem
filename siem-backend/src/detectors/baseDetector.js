import { logger } from '../utils/logger.js';

export class BaseDetector {
  constructor(name) {
    this.name = name;
  }

  async detect() {
    throw new Error('detect() must be implemented by subclass');
  }
}

