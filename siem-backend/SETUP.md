# Backend Setup Instructions

## MongoDB Atlas Connection

Your MongoDB Atlas connection string has been configured. To set it up:

### Option 1: Run Setup Script (Recommended)

```bash
node setup-env.js
```

This will create the `.env` file with your MongoDB Atlas connection string.

### Option 2: Manual Setup

Create a file named `.env` in the `siem-backend` directory with the following content:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://harshdeep0x01:%40Harshdeep8432@siem-cluster.lt9yydt.mongodb.net/?appName=siem-cluster

# Server Configuration
PORT=3001
NODE_ENV=development

# Detection Rules
SSH_BRUTE_FORCE_THRESHOLD=5
SSH_BRUTE_FORCE_WINDOW_MINUTES=2
```

**Important**: The password has been URL encoded:
- `@` becomes `%40`
- If your password contains other special characters, they need to be URL encoded too

### Verify Connection

After setting up, start the backend:

```bash
npm start
```

You should see:
```
MongoDB connected: mongodb+srv://harshdeep0x01:***@siem-cluster.lt9yydt.mongodb.net/...
SIEM Backend running on port 3001
```

If you see connection errors:
1. Check your MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for testing)
2. Verify your username and password
3. Ensure the cluster is running

