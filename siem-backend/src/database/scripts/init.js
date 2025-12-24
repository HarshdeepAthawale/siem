import mongoose from 'mongoose';
import { config } from '../../config/index.js';
import { Event } from '../models/Event.js';
import { Alert } from '../models/Alert.js';

async function initDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Create indexes
    console.log('Creating indexes...');
    
    // Event indexes
    await Event.createIndexes();
    console.log('✅ Event indexes created');

    // Alert indexes
    await Alert.createIndexes();
    console.log('✅ Alert indexes created');

    // Verify indexes
    const eventIndexes = await Event.collection.getIndexes();
    const alertIndexes = await Alert.collection.getIndexes();

    console.log('\n📊 Event Collection Indexes:');
    console.log(JSON.stringify(eventIndexes, null, 2));

    console.log('\n📊 Alert Collection Indexes:');
    console.log(JSON.stringify(alertIndexes, null, 2));

    console.log('\n✅ Database initialization complete!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

