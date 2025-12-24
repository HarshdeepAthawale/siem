import { SSHBruteForceDetector } from './sshBruteForceDetector.js';
import { logger } from '../utils/logger.js';

export class DetectionEngine {
  constructor() {
    this.detectors = [
      new SSHBruteForceDetector(),
    ];
    this.isRunning = false;
    this.intervalId = null;
  }

  async start(intervalSeconds = 30) {
    if (this.isRunning) {
      logger.warn('Detection engine already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Detection engine started (checking every ${intervalSeconds}s)`);

    // Run immediately
    await this.runDetections();

    // Then run periodically
    this.intervalId = setInterval(async () => {
      await this.runDetections();
    }, intervalSeconds * 1000);
  }

  async stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Detection engine stopped');
  }

  async runDetections() {
    if (!this.isRunning) return;

    try {
      for (const detector of this.detectors) {
        await detector.detect();
      }
    } catch (error) {
      logger.error('Error running detections:', error);
    }
  }
}

