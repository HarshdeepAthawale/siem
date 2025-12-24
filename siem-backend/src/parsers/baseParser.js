import { logger } from '../utils/logger.js';

export class BaseParser {
  constructor(name) {
    this.name = name;
  }

  async parse(rawLog) {
    throw new Error('parse() must be implemented by subclass');
  }
}

