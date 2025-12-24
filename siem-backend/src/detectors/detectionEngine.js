import { SSHBruteForceDetector } from './sshBruteForceDetector.js';
import { RDPBruteForceDetector } from './rdpBruteForceDetector.js';
import { PrivilegeEscalationDetector } from './privilegeEscalationDetector.js';
import { MalwareDetector } from './malwareDetector.js';
import { LateralMovementDetector } from './lateralMovementDetector.js';
import { DataExfiltrationDetector } from './dataExfiltrationDetector.js';
import { AnomalyDetector } from './anomalyDetector.js';
import { CorrelationEngine } from './correlationEngine.js';
import { ComplianceDetector } from './complianceDetector.js';
import { logger } from '../utils/logger.js';

export class DetectionEngine {
  constructor() {
    // Detectors ordered by priority (critical first, then high, then others)
    this.detectors = [
      new SSHBruteForceDetector(),
      new RDPBruteForceDetector(),
      new PrivilegeEscalationDetector(),
      new MalwareDetector(),
      new LateralMovementDetector(),
      new DataExfiltrationDetector(),
      new AnomalyDetector(),
      new CorrelationEngine(),
      new ComplianceDetector(),
    ];
    this.isRunning = false;
    this.intervalId = null;
    this.metrics = {
      totalRuns: 0,
      totalAlerts: 0,
      detectorStats: {},
    };
  }

  async start(intervalSeconds = 30) {
    if (this.isRunning) {
      logger.warn('Detection engine already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Detection engine started (checking every ${intervalSeconds}s)`);
    logger.info(`Loaded ${this.detectors.length} detectors`);

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
      this.metrics.totalRuns++;
      const startTime = Date.now();
      let totalAlerts = 0;

      // Run detectors in parallel for better performance
      const detectionPromises = this.detectors.map(async (detector) => {
        try {
          const alertCount = await detector.detect();
          totalAlerts += alertCount;

          // Update metrics
          if (!this.metrics.detectorStats[detector.name]) {
            this.metrics.detectorStats[detector.name] = {
              runs: 0,
              alerts: 0,
              avgTime: 0,
            };
          }
          this.metrics.detectorStats[detector.name].runs++;
          this.metrics.detectorStats[detector.name].alerts += alertCount;

          return { detector: detector.name, alerts: alertCount };
        } catch (error) {
          logger.error(`Error in detector ${detector.name}:`, error);
          return { detector: detector.name, alerts: 0, error: error.message };
        }
      });

      const results = await Promise.all(detectionPromises);
      const duration = Date.now() - startTime;

      this.metrics.totalAlerts += totalAlerts;

      logger.debug(`Detection run completed in ${duration}ms. Alerts: ${totalAlerts}`);
      logger.debug(`Detector results: ${JSON.stringify(results)}`);

      // Update average time for each detector
      for (const result of results) {
        if (this.metrics.detectorStats[result.detector]) {
          const stats = this.metrics.detectorStats[result.detector];
          stats.avgTime = (stats.avgTime * (stats.runs - 1) + duration) / stats.runs;
        }
      }
    } catch (error) {
      logger.error('Error running detections:', error);
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      isRunning: this.isRunning,
      detectorCount: this.detectors.length,
    };
  }

  getDetectorStatus() {
    return this.detectors.map(detector => ({
      name: detector.name,
      enabled: detector.enabled !== false,
    }));
  }
}

