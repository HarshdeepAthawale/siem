import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# MongoDB Connection
# Note: Special characters in password are URL encoded (@ becomes %40)
MONGODB_URI=mongodb+srv://harshdeep0x01:%40Harshdeep8432@siem-cluster.lt9yydt.mongodb.net/?appName=siem-cluster

# Server Configuration
PORT=3001
NODE_ENV=development

# Detection Rules
SSH_BRUTE_FORCE_THRESHOLD=5
SSH_BRUTE_FORCE_WINDOW_MINUTES=2
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with MongoDB Atlas connection string');
  console.log('📝 Password has been URL encoded (%40 for @)');
} else {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('📝 If you need to update it, edit siem-backend/.env manually');
}

