import { connectMongoDB } from './database/mongo.js';
import { createAPI } from './api/index.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { FileCollector } from './collectors/fileCollector.js';
import { MultiParser } from './parsers/multiParser.js';
import { Normalizer } from './normalizer/index.js';
import { Event } from './database/models/Event.js';
import { DetectionEngine } from './detectors/detectionEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Initialize detection engine
    const detectionEngine = new DetectionEngine();
    await detectionEngine.start(30); // Check every 30 seconds

    // Setup log ingestion pipeline
    const parser = new MultiParser();
    const logFilePath = path.join(__dirname, '../logs/sample.log');
    const collector = new FileCollector(logFilePath, parser);

    collector.onEvent(async (parsedEvent) => {
      try {
        const normalized = Normalizer.normalize(parsedEvent);
        if (normalized) {
          const event = new Event(normalized);
          await event.save();
          logger.debug(`Event ingested: ${normalized.event_type} from ${normalized.source_ip}`);
        }
      } catch (error) {
        logger.error('Error ingesting event:', error);
      }
    });

    await collector.start();

    // Start API server
    const app = createAPI();
    const server = app.listen(config.server.port, () => {
      logger.info(`SIEM Backend running on port ${config.server.port}`);
      logger.info(`API available at http://localhost:${config.server.port}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await collector.stop();
      await detectionEngine.stop();
      server.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start SIEM backend:', error);
    process.exit(1);
  }
}

main();

