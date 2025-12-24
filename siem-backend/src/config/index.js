import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/siem',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
  },
  detection: {
    sshBruteForceThreshold: parseInt(process.env.SSH_BRUTE_FORCE_THRESHOLD || '5', 10),
    sshBruteForceWindowMinutes: parseInt(process.env.SSH_BRUTE_FORCE_WINDOW_MINUTES || '2', 10),
  },
};

