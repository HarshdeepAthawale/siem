import mongoose from 'mongoose';
import { config } from '../../config/index.js';
import { Event } from '../models/Event.js';
import { Alert } from '../models/Alert.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Get counts before deletion
    const eventCount = await Event.countDocuments();
    const alertCount = await Alert.countDocuments();

    console.log('\n⚠️  WARNING: This will delete all data!');
    console.log(`   Events: ${eventCount}`);
    console.log(`   Alerts: ${alertCount}`);

    const answer = await askQuestion('\nAre you sure you want to continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      await mongoose.disconnect();
      rl.close();
      process.exit(0);
    }

    console.log('\nDeleting all events...');
    const eventResult = await Event.deleteMany({});
    console.log(`✅ Deleted ${eventResult.deletedCount} events`);

    console.log('Deleting all alerts...');
    const alertResult = await Alert.deleteMany({});
    console.log(`✅ Deleted ${alertResult.deletedCount} alerts`);

    console.log('\n✅ Database cleared successfully!');
    
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    rl.close();
    process.exit(1);
  }
}

clearDatabase();

