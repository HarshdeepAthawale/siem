# Quick Start Guide

## Prerequisites

- Node.js (LTS version recommended)
- MongoDB (running locally or remote instance)
- npm or yarn

## Step 1: Start MongoDB

Make sure MongoDB is running:

```bash
# On macOS/Linux
mongod

# On Windows (if installed as service, it should be running)
# Or start MongoDB service manually
```

## Step 2: Setup Backend

```bash
cd siem-backend
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (default MongoDB URI is mongodb://localhost:27017/siem)
# Start the backend
npm start
```

Backend will run on `http://localhost:3001`

## Step 3: Setup Frontend

In a new terminal:

```bash
cd siem-frontend
npm install

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local if backend is on different port
# Start the frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## Step 4: Access the Dashboard

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health

## Testing the System

1. The backend will automatically create a sample log file at `siem-backend/logs/sample.log`
2. The file collector will ingest logs and parse them
3. The detection engine will run every 30 seconds
4. SSH brute force attempts (5+ failures from same IP in 2 minutes) will trigger alerts
5. View alerts and events in the frontend dashboard

## Sample Log Format

The system supports:
- SSH logs: `2024-01-15 10:23:45 sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 54321 ssh2`
- HTTP logs: `2024-01-15 10:24:05 httpd[2001]: GET /api/users HTTP/1.1 200 - 10.0.0.10`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongosh` or `mongo` should connect
- Check MongoDB URI in `.env` file
- Default: `mongodb://localhost:27017/siem`

### Port Already in Use
- Backend: Change `PORT` in `siem-backend/.env`
- Frontend: Change port in `siem-frontend/package.json` scripts or use `npm run dev -- -p 3001`

### No Data Showing
- Check backend logs for errors
- Verify MongoDB connection
- Ensure sample log file exists at `siem-backend/logs/sample.log`
- Check browser console for API errors

