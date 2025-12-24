import mongoose from 'mongoose';
import { config } from '../../src/config/index.js';
import { Event } from '../../src/database/models/Event.js';
import { Alert } from '../../src/database/models/Alert.js';
import { Normalizer } from '../../src/normalizer/index.js';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Event.deleteMany({});
    await Alert.deleteMany({});
    console.log('✅ Existing data cleared');

    // Sample events
    const sampleEvents = [
      {
        timestamp: new Date('2024-01-15T10:23:45Z'),
        source_ip: '192.168.1.100',
        username: 'admin',
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'failure',
        raw_log: '2024-01-15 10:23:45 sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 54321 ssh2',
      },
      {
        timestamp: new Date('2024-01-15T10:23:47Z'),
        source_ip: '192.168.1.100',
        username: 'root',
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'failure',
        raw_log: '2024-01-15 10:23:47 sshd[1235]: Failed password for invalid user root from 192.168.1.100 port 54322 ssh2',
      },
      {
        timestamp: new Date('2024-01-15T10:23:49Z'),
        source_ip: '192.168.1.100',
        username: 'admin',
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'failure',
        raw_log: '2024-01-15 10:23:49 sshd[1236]: Failed password for invalid user admin from 192.168.1.100 port 54323 ssh2',
      },
      {
        timestamp: new Date('2024-01-15T10:23:51Z'),
        source_ip: '192.168.1.100',
        username: 'test',
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'failure',
        raw_log: '2024-01-15 10:23:51 sshd[1237]: Failed password for invalid user test from 192.168.1.100 port 54324 ssh2',
      },
      {
        timestamp: new Date('2024-01-15T10:23:53Z'),
        source_ip: '192.168.1.100',
        username: 'admin',
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'failure',
        raw_log: '2024-01-15 10:23:53 sshd[1238]: Failed password for invalid user admin from 192.168.1.100 port 54325 ssh2',
      },
      {
        timestamp: new Date('2024-01-15T10:24:01Z'),
        source_ip: '10.0.0.5',
        username: 'admin',
        event_type: 'ssh_login',
        service: 'sshd',
        status: 'success',
        raw_log: '2024-01-15 10:24:01 sshd[1240]: Accepted publickey for user admin from 10.0.0.5 port 54327 ssh2',
      },
      {
        timestamp: new Date('2024-01-15T10:24:05Z'),
        source_ip: '10.0.0.10',
        event_type: 'http_request',
        service: 'httpd',
        status: 'success',
        raw_log: '2024-01-15 10:24:05 httpd[2001]: GET /api/users HTTP/1.1 200 - 10.0.0.10',
      },
      {
        timestamp: new Date('2024-01-15T10:24:10Z'),
        source_ip: '192.168.1.200',
        event_type: 'http_request',
        service: 'httpd',
        status: 'failure',
        raw_log: '2024-01-15 10:24:10 httpd[2002]: GET /api/admin HTTP/1.1 401 - 192.168.1.200',
      },
    ];

    // Normalize and insert events
    console.log('Inserting sample events...');
    const normalizedEvents = sampleEvents.map(event => Normalizer.normalize(event));
    await Event.insertMany(normalizedEvents);
    console.log(`✅ Inserted ${normalizedEvents.length} events`);

    // Sample alerts
    const sampleAlerts = [
      {
        alert_type: 'ssh_brute_force',
        source_ip: '192.168.1.100',
        severity: 'high',
        count: 5,
        first_seen: new Date('2024-01-15T10:23:45Z'),
        last_seen: new Date('2024-01-15T10:23:53Z'),
        description: 'SSH brute force attack detected from 192.168.1.100. 5 failed login attempts in the last 2 minutes. Attempted usernames: admin, root, test',
        created_at: new Date('2024-01-15T10:23:55Z'),
      },
    ];

    console.log('Inserting sample alerts...');
    await Alert.insertMany(sampleAlerts);
    console.log(`✅ Inserted ${sampleAlerts.length} alerts`);

    // Show summary
    const eventCount = await Event.countDocuments();
    const alertCount = await Alert.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Events: ${eventCount}`);
    console.log(`   Alerts: ${alertCount}`);

    console.log('\n✅ Database seeding complete!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

